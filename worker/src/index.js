const MODEL = '@cf/openai/gpt-oss-20b';
const MAX_STORY_CHARS = 6000;
const MAX_ACTIONS = 12;
const MAX_CHARACTERS = 18;
const SETTINGS = new Set([
  'queens-chamber','throne-hall','princes-garden','village-market','house-interior',
  'rishi-ashram','forest-hut','panchavati-forest','kurukshetra','battlefield','lanka',
  'ayodhya','dwarka','celestial-heaven','night-scene','seashore','riverbank','cave',
  'mountains','farmland','forest-jungle','temple','village','royal-palace','jail','camp',
  'palace','town','forest','mountain'
]);
const TIMES = new Set(['morning','noon','evening','night']);
const MOMENTS = new Set([
  'rideBoat','ride','recover','throwRope','pullRope','rescue','lift','give','kneel',
  'fall','fight','defend','attack','exit','enter','backward','jump','fly','wave',
  'dance','turn','run','walk','up','down','meet','still'
]);
const HUMAN_ONLY = new Set(['rideBoat','ride','throwRope','pullRope','lift','give','kneel','defend']);
const PROPS = new Set(['sword','shield','bow','arrow','boat','horse','none']);
const LABELS = {
  rideBoat:'Boat ride',ride:'Ride',recover:'Get up',throwRope:'Throw rope',
  pullRope:'Pull to safety',rescue:'Rescue',lift:'Lift',give:'Give',kneel:'Kneel',
  fall:'Fall',fight:'Fight',defend:'Defend',attack:'Attack',exit:'Exit',enter:'Enter',
  backward:'Retreat',jump:'Jump',fly:'Fly',wave:'Wave',dance:'Dance',turn:'Turn',
  run:'Run',walk:'Walk',up:'Rise',down:'Land',meet:'Meet',still:'Speak'
};
const ALLOWED_BY_ROLE = {
  human: new Set(MOMENTS),
  animal: new Set(['recover','rescue','fall','fight','attack','exit','enter','backward','jump','turn','run','walk','up','down','meet','still']),
  bird: new Set(['recover','rescue','fall','fight','attack','exit','enter','backward','jump','fly','turn','run','walk','up','down','meet','still']),
  object: new Set(['turn','still'])
};

function json(body, status, requestOrigin, allowedOrigin) {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return new Response(JSON.stringify(body), {status, headers});
}
function parseModelJson(value) {
  let text = typeof value === 'string' ? value : value?.response ?? value?.choices?.[0]?.message?.content ?? '';
  if (typeof text !== 'string') throw new Error('Model response was not text');
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = text.indexOf('{'), last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('Model returned no JSON object');
  return JSON.parse(text.slice(first, last + 1));
}
function cleanEvents(result, actions, knownCharacters) {
  if (!Array.isArray(result?.events)) throw new Error('Model response has no events');
  const seen = new Set();
  return result.events.flatMap(item => {
    const index = Number(item?.action_index);
    if (!Number.isInteger(index) || index < 0 || index >= actions.length || seen.has(index)) return [];
    seen.add(index);
    const action = actions[index];
    const role = ['human','animal','bird','object'].includes(action.role) ? action.role : 'human';
    const kind = MOMENTS.has(item.kind) && ALLOWED_BY_ROLE[role].has(item.kind) ? item.kind : null;
    const targetName = String(item.target || '').trim();
    const target = knownCharacters.find(name => name.toLowerCase() === targetName.toLowerCase() && name.toLowerCase() !== String(action.actor || '').toLowerCase()) || null;
    const prop = String(item.prop || 'none').toLowerCase();
    const description = typeof item.action_description === 'string'
      ? item.action_description.replace(/[\r\n]+/g, ' ').trim().slice(0, 180) : '';
    return [{
      action_index: index,
      source_act_index: Number.isInteger(Number(action.source_act_index)) ? Number(action.source_act_index) : index,
      kind,
      target,
      prop: role === 'human' && PROPS.has(prop) ? prop : 'none',
      duration: Math.max(.35, Math.min(2.6, Number(item.duration) || 1)),
      setting: SETTINGS.has(item.setting) ? item.setting : null,
      time_of_day: TIMES.has(item.time_of_day) ? item.time_of_day : null,
      action_description: description,
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0))
    }];
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || '';
    const origins = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const allowedOrigin = origins.includes(requestOrigin) ? requestOrigin : '';
    if (request.method === 'OPTIONS') return allowedOrigin ? json({}, 200, requestOrigin, allowedOrigin) : new Response(null, {status:403});
    if (requestOrigin && !allowedOrigin) return json({error:'Origin is not allowed'},403,requestOrigin,'');
    if (url.pathname === '/health' && request.method === 'GET') return json({status:'ok',model:MODEL},200,requestOrigin,allowedOrigin);
    if (url.pathname !== '/analyze-actions') return json({error:'Not found'},404,requestOrigin,allowedOrigin);
    if (request.method !== 'POST') return json({error:'Use POST'},405,requestOrigin,allowedOrigin);

    let body;
    try { body = await request.json(); } catch { return json({error:'Request body must be JSON'},400,requestOrigin,allowedOrigin); }
    const story = typeof body.story === 'string' ? body.story.trim() : '';
    const actions = Array.isArray(body.actions) ? body.actions : [];
    const characters = Array.isArray(body.characters) ? body.characters : [];
    if (!story || story.length > MAX_STORY_CHARS) return json({error:`Story must contain 1–${MAX_STORY_CHARS} characters`},413,requestOrigin,allowedOrigin);
    if (!actions.length || actions.length > MAX_ACTIONS || actions.some(action => !action || typeof action.text !== 'string' || action.text.length > 260)) {
      return json({error:`Send 1–${MAX_ACTIONS} short action records`},400,requestOrigin,allowedOrigin);
    }
    const knownCharacters = [...new Set(characters.filter(character => character && character.onScreen !== false)
      .map(character => String(character.name || '').trim()).filter(Boolean))].slice(0,MAX_CHARACTERS);
    if (!knownCharacters.length) return json({error:'Send the current on-screen cast'},400,requestOrigin,allowedOrigin);
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limit = await env.AI_LIMITER.limit({key:`${clientIp}:action-enrichment`});
    if (!limit.success) return json({error:'AI rate limit reached; local mapping remains available'},429,requestOrigin,allowedOrigin);

    const system = `You refine physical puppet-show action mappings. Return JSON only: {"events":[{"action_index":0,"kind":"walk","target":"known character or null","prop":"sword|shield|bow|arrow|boat|horse|none","duration":1.0,"setting":"valid setting key or null","time_of_day":"morning|noon|evening|night or null","action_description":"short observable stage action","confidence":0.0}]}. Return at most one event per input action and exactly one movement kind, because the input is already split into stage acts. Choose only the supplied cast, action kinds, settings, and props. Never change the actor or speaker. Do not invent a character, dialogue, object, weapon, prop, or action. Animals never hold props, use weapons, or ride mounts; only use natural animal movement for them. Only choose props included in the actor's supplied asset slots. Action descriptions must be visible physical actions, with no speech text, internal thoughts, or facial expressions. Preserve action order and the source meaning. Use null for unsupported target, setting, or time. Durations are 0.35–2.6 seconds. Low confidence means return no event for that action.`;
    try {
      const result = await env.AI.run(MODEL, {
        messages:[
          {role:'system',content:system},
          {role:'user',content:JSON.stringify({characters,actions})}
        ],
        max_tokens:700,
        response_format:{type:'json_object'},
        reasoning_effort:'low',
        temperature:0
      });
      const events = cleanEvents(parseModelJson(result),actions,knownCharacters).filter(event => event.kind && event.confidence >= .72);
      if (!events.length) return json({success:true,source:'cloudflare_workers_ai',events:[]},200,requestOrigin,allowedOrigin);
      return json({success:true,source:'cloudflare_workers_ai',events},200,requestOrigin,allowedOrigin);
    } catch {
      return json({success:false,error:'Workers AI unavailable; use local action mapping'},503,requestOrigin,allowedOrigin);
    }
  }
};
