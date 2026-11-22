// Relay: runs the whole benchmark for a model that can't act on its own, through its API.
// It answers every pack, competes in the Arena with feedback rounds, and writes result.json
// in the same format as an issue submission, ready for scripts/publish.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const P = { openrouter: ['https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY'], openai: ['https://api.openai.com/v1', 'OPENAI_API_KEY'], xai: ['https://api.x.ai/v1', 'XAI_API_KEY'],
  google: ['https://generativelanguage.googleapis.com/v1beta/openai', 'GEMINI_API_KEY'], anthropic: ['https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY'], deepseek: ['https://api.deepseek.com/v1', 'DEEPSEEK_API_KEY'],
  mistral: ['https://api.mistral.ai/v1', 'MISTRAL_API_KEY'], groq: ['https://api.groq.com/openai/v1', 'GROQ_API_KEY'] };
const E = process.env;
const provider = E.RELAY_PROVIDER || 'openrouter', model = E.RELAY_MODEL, label = E.RELAY_LABEL || model;
const tiers = (E.RELAY_TIERS || 'SFGRA').toUpperCase(), rounds = Math.max(1, Math.min(5, +E.RELAY_ROUNDS || 3)), reasoning = E.RELAY_REASONING || '';
const [base, keyEnv] = P[provider] || [E.RELAY_BASE_URL, 'RELAY_API_KEY']; const key = E[keyEnv];
if (!model || !key) { console.error(`Missing model or API key (${keyEnv}).`); process.exit(1); }
const extra = provider === 'openrouter' ? { usage: { include: true }, ...(reasoning ? { reasoning: { effort: reasoning } } : {}) } : (reasoning ? { reasoning_effort: reasoning } : {});
const usage = { n: 0, tin: 0, tout: 0, cost: 0, sec: 0 };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function chat(messages) {
  for (let k = 0, d = 5000; ; k++, d = Math.min(d * 2, 120000)) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, ...extra }) });
      if (r.status === 429) { const t = await r.text(); if (/per[- ]day|daily|requests-per-day|free-models-per-day/i.test(t)) { const e = new Error('Daily request limit reached'); e.daily = true; throw e; } if (k < 5) { await sleep(Math.max(d, 15000)); continue; } throw new Error('HTTP 429: ' + t.slice(0, 200)); }
      if ([500, 502, 503, 504, 529].includes(r.status) && k < 5) { await sleep(d); continue; }
      const j = await r.json(); if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
      let c = j.choices[0].message.content; if (Array.isArray(c)) c = c.map(p => p.text || '').join('');
      const u = j.usage || {}; usage.tin += u.prompt_tokens || 0; usage.tout += u.completion_tokens || 0; usage.cost += u.cost || 0; usage.sec += (Date.now() - t0) / 1000;
      return c || '';
    } catch (e) { if (e.daily) throw e; if (k < 5) { await sleep(d); continue; } throw e; }
  }
}
const bank = JSON.parse(fs.readFileSync('tests.json', 'utf8')).tests;
const lb = fs.existsSync('leaderboard.json') ? JSON.parse(fs.readFileSync('leaderboard.json', 'utf8')) : { models: [], arena: {} };
lb.models ||= []; lb.arena ||= {};
const date = new Date().toISOString().slice(0, 10);
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const stem = `relay-${slug(label)}-${slug(E.RELAY_ACCESS || 'api')}-${reasoning || 'std'}-`;
const recent = lb.models.filter(m => m.id.startsWith(stem) && (Date.now() - Date.parse(m.date || 0)) < 21 * 864e5).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
const runId = recent ? recent.id : stem + date;
const done = new Set(Object.keys((lb.res || {})[runId] || {})), doneArena = new Set(Object.keys((lb.arena || {})[runId] || {}).filter(k => lb.arena[runId][k].ok));
let stopped = false;
const nameOf = id => (lb.models.find(m => m.id === id) || {}).name || id;

const exe = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(p => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.goto('file://' + path.resolve('index.html'));
await page.waitForFunction(() => window.__bench && window.__bench.scoreAnswers, null, { timeout: 30000 });
const score = a => page.evaluate(x => window.__bench.scoreAnswers(x), a);

// 1. Question tiers, a few at a time.
const qs = bank.filter(t => t.tier !== 'A' && tiers.includes(t.tier) && !done.has(t.id));
const answers = {}; let words = 0;
console.log(`Relay: ${label} (${model}) — ${qs.length} questions, Arena ${tiers.includes('A') ? `with ${rounds} rounds` : 'skipped'}`);
for (let i = 0; i < qs.length && !stopped; i += 3) {
  await Promise.all(qs.slice(i, i + 3).map(async t => {
    try {
      const msgs = []; const log = [];
      for (const turn of t.turns) { msgs.push({ role: 'user', content: turn }); const a = await chat(msgs); msgs.push({ role: 'assistant', content: a }); log.push([turn, a]); }
      answers[t.id] = t.turns.length === 1 ? log[0][1] : log.map(([u, a]) => `USER: ${u}\n\nASSISTANT: ${a}`).join('\n\n');
      usage.n++; words += answers[t.id].split(/\s+/).filter(Boolean).length;
    } catch (e) { if (e.daily) stopped = true; console.log(`  ${t.id} failed: ${e.message}`); }
  }));
  console.log(`  answered ${Math.min(i + 3, qs.length)} / ${qs.length}`);
}
const r = await score(answers);

// 2. Arena with feedback rounds, like a human coach would give.
const tourn = {};
if (tiers.includes('A') && !stopped) {
  const chs = await page.evaluate(() => window.__bench.challenges());
  for (const ch of chs) {
    if (stopped || doneArena.has(ch.id)) continue;
    const rec = (() => { const rows = Object.entries(lb.arena).filter(([run]) => run !== runId).map(([run, m]) => ({ run, a: m[ch.id] })).filter(x => x.a && x.a.ok && typeof x.a.metric === 'number');
      rows.sort((x, y) => ch.better === 'low' ? x.a.metric - y.a.metric : y.a.metric - x.a.metric); return rows[0] ? `${rows[0].a.metric}${ch.unit} by ${nameOf(rows[0].run)}` : null; })();
    const msgs = [{ role: 'user', content: (rec ? `CURRENT RECORD: ${rec}. Your goal is to beat it (${ch.better === 'low' ? 'lower' : 'higher'} is better).\n\n` : '') + ch.p }];
    let best = null;
    const iterate = ['opt', 'golf', 'suite'].includes(ch.kind) ? rounds : 1;
    for (let k = 0; k < iterate; k++) {
      let ans; try { ans = await chat(msgs); } catch (e) { if (e.daily) stopped = true; console.log(`  ${ch.id} failed: ${e.message}`); break; }
      const s = (await score({ [ch.id]: ans })).arena[ch.id];
      const better = s.ok && (!best || !best.ok || (s.metric != null && (best.metric == null || (ch.better === 'low' ? s.metric < best.metric : s.metric > best.metric))));
      if (!best || better) best = s;
      console.log(`  ${ch.id} round ${k + 1}: ${s.detail}`);
      msgs.push({ role: 'assistant', content: ans }, { role: 'user', content: `Result of that submission: ${s.detail}${rec ? ` The current record is ${rec}.` : ''} Improve it (${ch.better === 'low' ? 'lower' : 'higher'} is better). Return the complete, improved solution in a single block.` });
    }
    if (!best) continue;
    if (ch.kind === 'bot' && best.ok) {
      const bots = [{ key: runId, name: label, code: best.code }];
      if (fs.existsSync('submissions')) for (const run of fs.readdirSync('submissions')) { const f = path.join('submissions', run, ch.id + '.txt'); if (run !== runId && fs.existsSync(f)) bots.push({ key: run, name: nameOf(run), code: fs.readFileSync(f, 'utf8') }); }
      tourn[ch.id] = await page.evaluate(([c, b]) => window.__bench.tournament(c, b), [ch.id, bots]);
      best.metric = (tourn[ch.id].find(x => x.key === runId) || {}).pts ?? null;
    }
    r.arena[ch.id] = best;
  }
}
await browser.close();
usage.cost = Math.round(usage.cost * 1e6) / 1e6; usage.sec = Math.round(usage.sec); usage.words = usage.n ? Math.round(words / usage.n) : 0;
const meta = { model: label, provider: `${provider}: ${model}`, access: E.RELAY_ACCESS || 'API (pay per use)', iface: 'API', think: reasoning ? (reasoning === 'high' ? 'On (high effort)' : 'On') : 'Off', tools: 'Off', restrict: '', notes: 'Run by the relay workflow', usage };
if (!Object.keys(answers).length && !Object.keys(r.arena).length) { console.log(stopped ? 'Daily limit reached before any new answers; will resume next run.' : 'Nothing left to do for this model.'); fs.writeFileSync('result.json', JSON.stringify({ ok: false })); process.exit(0); }
if (stopped) meta.notes += ' · paused at the daily request limit; resumes on the next run';
fs.writeFileSync('result.json', JSON.stringify({ ok: true, runId, issue: null, author: 'relay', isComment: false, meta, tourn, ...r }, null, 1));
console.log(`Done. ${Object.keys(r.scores).length} auto-scored, ${r.rubric.length} open-ended, ${Object.keys(r.arena).length} Arena. Usage: ${JSON.stringify(usage)}`);
