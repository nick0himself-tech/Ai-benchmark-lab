// Adds a scored submission to leaderboard.json. Optionally judges open-ended answers
// with an OpenAI-compatible API if the JUDGE_MODEL variable and a key secret are set.
import fs from 'node:fs';
const res = JSON.parse(fs.readFileSync('result.json', 'utf8'));
if (!res.ok) { fs.writeFileSync('publish.md', 'Nothing to publish: the submission could not be read.'); process.exit(0); }
const lb = fs.existsSync('leaderboard.json') ? JSON.parse(fs.readFileSync('leaderboard.json', 'utf8')) : {};
lb.models ||= []; lb.res ||= {}; lb.arena ||= {};
const m = res.meta;
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const date = new Date().toISOString().slice(0, 10);
const id = 'gh-' + slug([m.model, m.access, m.iface, m.think, m.tools, date].join(' '));
let run = lb.models.find(x => x.id === id);
if (!run) { run = { id }; lb.models.push(run); }
Object.assign(run, { name: `${m.model} — ${date}`, model: m.model, date, access: m.access, iface: m.iface, think: m.think, tools: m.tools,
  restrict: m.restrict, notes: [m.provider && 'Provider: ' + m.provider, m.notes, `Submitted in issue #${res.issue} by @${res.author}`].filter(Boolean).join(' · ') });
const R = (lb.res[id] ||= {});
for (const [tid, x] of Object.entries(res.scores)) if (x.score != null) R[tid] = { score: x.score };
const A = (lb.arena[id] ||= {});
for (const [cid, x] of Object.entries(res.arena)) A[cid] = { metric: x.metric, ok: x.ok, detail: x.detail, tie: x.tie };

let judged = 0, judgeNote = 'Open-ended answers were not judged (set the JUDGE_MODEL variable and an API key secret to enable).';
const key = process.env.OPENROUTER_API_KEY || process.env.JUDGE_API_KEY;
const model = process.env.JUDGE_MODEL;
const base = process.env.JUDGE_BASE_URL || 'https://openrouter.ai/api/v1';
if (key && model && res.rubric.length) {
  for (const q of res.rubric) {
    const prompt = `You are an impartial, strict grader. For each numbered criterion decide whether the ANSWER meets it. Judge only what is written; do not reward length.\n\nQUESTION:\n${q.prompt}\n\nANSWER:\n${q.answer}\n\nCRITERIA:\n${q.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nReply with JSON only: {"met":[${q.criteria.map(() => '0 or 1').join(',')}]}`;
    try {
      const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
      const j = await r.json(); const txt = j.choices[0].message.content; const v = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      const met = q.criteria.map((_, i) => !!+((v.met || [])[i]));
      R[q.id] = { score: Math.round(3 * met.filter(Boolean).length / q.criteria.length), checks: met };
      judged++;
    } catch (e) { /* leave unjudged */ }
  }
  judgeNote = `Open-ended answers judged by ${model}: ${judged} of ${res.rubric.length}.`;
}
lb.updated = new Date().toISOString();
fs.writeFileSync('leaderboard.json', JSON.stringify(lb, null, 1));
fs.writeFileSync('publish.md', `Added to the public leaderboard as **${run.name}** (run \`${id}\`). ${judgeNote}`);
