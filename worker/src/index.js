const MODEL = '@cf/qwen/qwen3.8-27b';
const MAX_STORY_CHARS = 6000;
const MAX_SENTENCES = 30;
const MAX_CHARACTERS = 18;
const ALLOWED_SETTINGS = new Set(['palace', 'desert', 'mountain', 'town', 'river', 'forest']);
const ALLOWED_TIMES = new Set(['morning', 'noon', 'evening', 'night']);

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
    if (url.pathname !== '/analyze-story') return responseJson({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return responseJson({ error: 'Use POST' }, 405, origin);

    let body;
    try {
      body = await request.json();
    } catch {
      return responseJson({ error: 'Request body must be JSON' }, 400, origin);
    }
    const story = typeof body.story === 'string' ? body.story.trim() : '';
    const sentences = Array.isArray(body.sentences) ? body.sentences : [];
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

    const system = `You enrich structured puppet-show data. Return JSON only, with this shape: {"events":[{"sentence_index":0,"actor":"known character name or null","setting":"palace|desert|mountain|town|river|forest or null","time_of_day":"morning|noon|evening|night or null","action_description":"short physical stage movement","confidence":0.0}]}.
Use one event for each source sentence, preserving sentence_index. Only choose actor names from the supplied cast. Do not create characters, aliases, events, dialogue, or props. Animals do not hold props. Keep action_description to observable puppet movement; never include speech or facial expressions. Do not describe internal thoughts as visible actions. Infer setting/time only when supported by the story; otherwise use null. Keep the original event meaning and order. Confidence must be from 0 to 1.`;
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
