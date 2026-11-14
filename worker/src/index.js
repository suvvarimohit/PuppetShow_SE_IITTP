const MODEL = '@cf/qwen/qwen3.8-27b';
const MAX_STORY_CHARS = 6000;
const MAX_SENTENCES = 30;
const MAX_CHARACTERS = 18;
const ALLOWED_SETTINGS = new Set(['queens-chamber', 'throne-hall', 'princes-garden', 'village-market', 'house-interior', 'rishi-ashram', 'forest-hut', 'panchavati-forest', 'kurukshetra', 'battlefield', 'lanka', 'ayodhya', 'dwarka', 'celestial-heaven', 'night-scene', 'seashore', 'riverbank', 'cave', 'mountains', 'farmland', 'forest-jungle', 'temple', 'village', 'royal-palace', 'jail', 'camp', 'p7-village']);
const ALLOWED_TIMES = new Set(['morning', 'noon', 'evening', 'night']);
const ALLOWED_MOMENTS = new Set(['rideBoat', 'ride', 'pickup', 'fight', 'aim', 'attack', 'defend', 'fall', 'recover', 'dance', 'jump', 'fly', 'run', 'walk', 'wave', 'enter', 'exit', 'backward', 'turn', 'meet', 'climb', 'up', 'down', 'still']);
const ALLOWED_PROPS = new Set(['sword', 'shield', 'bow', 'arrow', 'boat', 'horse', 'none']);

function responseJson(body, status, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function parseModelJson(value) {
  let text = typeof value === 'string' ? value :
    value?.response ?? value?.choices?.[0]?.message?.content ?? '';
  if (typeof text !== 'string') throw new Error('Model response was not text');
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('Model returned no JSON object');
  return JSON.parse(text.slice(first, last + 1));
}

function cleanEvents(result, sentenceCount, knownCharacters) {
  if (!Array.isArray(result?.events)) throw new Error('Model response has no events list');
  const events = [];
  const seen = new Set();
  for (const item of result.events) {
    const index = Number(item?.sentence_index);
    if (!Number.isInteger(index) || index < 0 || index >= sentenceCount || seen.has(index)) continue;
    seen.add(index);
    const confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0));
    const actor = String(item.actor || '').trim();
    events.push({
      sentence_index: index,
      actor: knownCharacters.find(name => name.toLocaleLowerCase() === actor.toLocaleLowerCase()) || null,
      setting: ALLOWED_SETTINGS.has(item.setting) ? item.setting : null,
      time_of_day: ALLOWED_TIMES.has(item.time_of_day) ? item.time_of_day : null,
      action_description: typeof item.action_description === 'string'
        ? item.action_description.trim().slice(0, 240)
        : '',
      confidence
    });
  }
  return events;
}

function cleanMomentEvents(result, sentenceCount, knownCharacters) {
  if (!Array.isArray(result?.events)) throw new Error('Model response has no events list');
  const seen = new Set();
  return result.events.flatMap(item => {
    const index=Number(item?.sentence_index);
    if(!Number.isInteger(index)||index<0||index>=sentenceCount||seen.has(index)||!Array.isArray(item.moments))return [];
    seen.add(index);
    const confidence=Math.max(0,Math.min(1,Number(item.confidence)||0));
    const moments=item.moments.slice(0,4).flatMap(moment=>{
      if(!ALLOWED_MOMENTS.has(moment?.kind))return [];
      const target=String(moment.target||'').trim();
      const prop=String(moment.prop||'none').toLowerCase();
      return [{kind:moment.kind,target:knownCharacters.find(name=>name.toLocaleLowerCase()===target.toLocaleLowerCase())||null,prop:ALLOWED_PROPS.has(prop)?prop:'none',duration:Math.max(.3,Math.min(3,Number(moment.duration)||1)),confidence:Math.max(0,Math.min(1,Number(moment.confidence)||confidence))}];
    });
    return moments.length?[{sentence_index:index,moments,confidence}]:[];
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',').map(value => value.trim()).filter(Boolean);
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '';

    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return responseJson({}, 200, origin);
    }
    if (requestOrigin && !origin) return responseJson({ error: 'Origin is not allowed' }, 403, '');
    if (url.pathname === '/health' && request.method === 'GET') {
      return responseJson({ status: 'ok', model: MODEL }, 200, origin);
    }
    if (!['/analyze-story', '/analyze-moments'].includes(url.pathname)) return responseJson({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return responseJson({ error: 'Use POST' }, 405, origin);

    let body;
    try {
      body = await request.json();
    } catch {
      return responseJson({ error: 'Request body must be JSON' }, 400, origin);
    }
    const story = typeof body.story === 'string' ? body.story.trim() : '';
    const actions = Array.isArray(body.actions) ? body.actions : [];
    const sentences = Array.isArray(body.sentences) ? body.sentences :
      url.pathname === '/analyze-moments' ? actions.map(action => action?.text) : [];
    const characters = Array.isArray(body.characters) ? body.characters : [];
    if (!story || story.length > MAX_STORY_CHARS) {
      return responseJson({ error: `Story must contain 1–${MAX_STORY_CHARS} characters` }, 413, origin);
    }
    if (!sentences.length || sentences.length > MAX_SENTENCES ||
        sentences.some(sentence => typeof sentence !== 'string' || sentence.length > 260)) {
      return responseJson({ error: `Send 1–${MAX_SENTENCES} short sentences` }, 400, origin);
    }
    const knownCharacters = [...new Set(characters
      .filter(character => character && character.onScreen !== false)
      .map(character => String(character.name || '').trim())
      .filter(Boolean))].slice(0, MAX_CHARACTERS);

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limit = await env.AI_LIMITER.limit({ key: `${clientIp}:story-enrichment` });
    if (!limit.success) return responseJson({ error: 'Rate limit reached; use local story mapping' }, 429, origin);

    if (url.pathname === '/analyze-moments') {
      if (!actions.length || actions.length > MAX_SENTENCES || actions.some(action => !action || typeof action.text !== 'string' || action.text.length > 260)) {
        return responseJson({ error: `Send 1–${MAX_SENTENCES} short action records` }, 400, origin);
      }
      const system = `Convert puppet-show action records into short visual animation moment sequences. Return JSON only: {"events":[{"sentence_index":0,"moments":[{"kind":"walk","target":"known character or null","prop":"sword|shield|bow|arrow|boat|horse|none","duration":1.0,"confidence":0.0}],"confidence":0.0}]}. Use only the supplied character names and allowed moment kinds: ${[...ALLOWED_MOMENTS].join(', ')}. Preserve the described action and order. Use 1–4 moments per record only when the action has multiple distinct beats. Animals can walk, run, jump, fly, attack, fall, recover, and meet; never assign them hand props or make them ride. Use fall then recover only when the text says both. Do not invent dialogue, characters, props, facial expressions, or actions. A target must be one of the supplied characters. Return one event for each supplied action record. Durations must be 0.3–3 seconds.`;
      try {
        const result=await env.AI.run(MODEL,{messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({characters:knownCharacters,actions})}],max_completion_tokens:1800,reasoning_effort:'low',temperature:0});
        const parsed=parseModelJson(result),events=cleanMomentEvents(parsed,actions.length,knownCharacters);
        if(!events.length)throw new Error('No valid action moments');
        return responseJson({success:true,source:'cloudflare_workers_ai',events},200,origin);
      } catch {
        return responseJson({success:false,error:'AI moment enrichment unavailable; use local action mapping'},503,origin);
      }
    }

    const system = `You enrich structured puppet-show data. Return JSON only, with this shape: {"events":[{"sentence_index":0,"actor":"known character name or null","setting":"one supplied setting key or null","time_of_day":"morning|noon|evening|night or null","action_description":"short physical stage movement","confidence":0.0}]}.
Use one event for each source sentence, preserving sentence_index. Only choose actor names from the supplied cast. Do not create characters, aliases, events, dialogue, or props. Animals do not hold props. Keep action_description to observable puppet movement; never include speech or facial expressions. Do not describe internal thoughts as visible actions. Infer setting/time only when supported by the story; otherwise use null. Choose setting only from: ${[...ALLOWED_SETTINGS].join(', ')}. Keep the original event meaning and order. Confidence must be from 0 to 1.`;
    const user = JSON.stringify({ characters: knownCharacters, sentences });

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_completion_tokens: 2000,
        reasoning_effort: 'low',
        temperature: 0
      });
      const parsed = parseModelJson(result);
      const events = cleanEvents(parsed, sentences.length, knownCharacters);
      if (!events.length) throw new Error('No valid events in model response');
      return responseJson({ success: true, source: 'cloudflare_workers_ai', events }, 200, origin);
    } catch {
      // Keep provider/model details out of the public response; the browser uses local rules.
      return responseJson({ success: false, error: 'AI enrichment unavailable; use local story mapping' }, 503, origin);
    }
  }
};
