// Publishes a scored submission to leaderboard.json and submissions/.
// Builds are ranked by head-to-head judging (Elo) when JUDGE_MODEL and an API key are set.
import fs from 'node:fs';
import path from 'node:path';
const res = JSON.parse(fs.readFileSync('result.json', 'utf8'));
if (!res.ok) { fs.writeFileSync('publish.md', 'Nothing to publish: the submission could not be read.'); process.exit(0); }
const lb = fs.existsSync('leaderboard.json') ? JSON.parse(fs.readFileSync('leaderboard.json', 'utf8')) : {};
lb.models ||= []; lb.res ||= {}; lb.arena ||= {}; lb.tourn ||= {}; lb.votes ||= [];
const id = res.runId, m = res.meta;
let run = lb.models.find(x => x.id === id);
const date = new Date().toISOString().slice(0, 10);
if (!run) { run = { id, date }; lb.models.push(run); }
Object.assign(run, { name: `${m.model} — ${run.date}`, model: m.model, access: m.access, iface: m.iface, think: m.think, tools: m.tools, restrict: m.restrict,
  notes: [m.provider && 'Provider: ' + m.provider, m.notes, res.issue ? `Issue #${res.issue} by @${res.author}` : ''].filter(Boolean).join(' · ') });
if (m.usage) { const u = (run.usage ||= { n: 0, tin: 0, tout: 0, cost: 0, sec: 0, words: 0 }); const w = u.words * u.n + (m.usage.words || 0) * (m.usage.n || 0); for (const k of ['n', 'tin', 'tout', 'cost', 'sec']) u[k] = (u[k] || 0) + (m.usage[k] || 0); u.words = u.n ? Math.round(w / u.n) : 0; }
const R = (lb.res[id] ||= {});
for (const [tid, x] of Object.entries(res.scores)) if (x.score != null) R[tid] = { score: x.score };
const A = (lb.arena[id] ||= {});
const notes = []; const proQueue = [];
const save = (cid, code) => { const d = path.join('submissions', id); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, cid + '.txt'), code); };
for (const [cid, a] of Object.entries(res.arena)) {
  if (!a.ok) continue;
  if (a.kind === 'bot') { save(cid, a.code); lb.tourn[cid] = { at: new Date().toISOString(), rows: res.tourn[cid].map(x => ({ key: x.key, name: x.name, pts: x.pts, rec: x.rec || '', run: !String(x.key).startsWith('house:') })) };
    for (const x of res.tourn[cid]) if (lb.arena[x.key]) lb.arena[x.key][cid] = { ...(lb.arena[x.key][cid] || {}), ok: true, metric: x.pts, detail: 'Tournament points' };
    A[cid] = { ok: true, metric: (res.tourn[cid].find(x => x.key === id) || {}).pts ?? null, detail: 'Tournament points' }; continue; }
  if (a.kind === 'pro') { proQueue.push([cid, a]); continue; }
  if (a.kind === 'build') { save(cid, a.code); A[cid] = { ...(A[cid] || {}), ok: true, metric: A[cid]?.metric ?? null, detail: 'Visual build' }; continue; }
  const old = A[cid]; const better = !old || !old.ok || old.metric == null || (a.better === 'low' ? a.metric < old.metric : a.metric > old.metric) || (a.metric === old.metric && (a.tie ?? 1e9) < (old.tie ?? 1e9));
  if (better) A[cid] = { ok: true, metric: a.metric, detail: a.detail, tie: a.tie ?? null };
  else notes.push(`${cid}: kept your earlier, better result (${old.metric}).`);
}

// Judging: open-ended answers and head-to-head build votes.
const key = process.env.OPENROUTER_API_KEY || process.env.JUDGE_API_KEY, model = process.env.JUDGE_MODEL;
const base = process.env.JUDGE_BASE_URL || 'https://openrouter.ai/api/v1';
const ask = async prompt => { const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
  const j = await r.json(); const t = j.choices[0].message.content; return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); };
let judged = 0;
if (!(key && model)) for (const [cid] of proQueue) A[cid] ||= { ok: true, metric: null, detail: 'Awaiting judge' };
if (key && model) {
  for (const q of res.rubric) {
    try { const v = await ask(`You are an impartial, strict grader. For each numbered criterion decide whether the ANSWER meets it. Judge only what is written; do not reward length.\n\nQUESTION:\n${q.prompt}\n\nANSWER:\n${q.answer}\n\nCRITERIA:\n${q.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nReply with JSON only: {"met":[${q.criteria.map(() => '0 or 1').join(',')}]}`);
      const met = q.criteria.map((_, i) => !!+((v.met || [])[i])); R[q.id] = { score: Math.round(3 * met.filter(Boolean).length / q.criteria.length), checks: met }; judged++; } catch (e) {}
  }
  for (const [cid, a] of proQueue) {
    try { const v = await ask(`You are an expert, demanding reviewer scoring a submission against a checklist. Score each criterion from 0 (absent or wrong) to 10 (excellent). Penalise invented statistics, internal inconsistencies and padding.\n\nBRIEF:\n${a.brief}\n\nSUBMISSION:\n${a.text}\n\nCRITERIA:\n${a.crit.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nReply with JSON only: {"scores":[${a.crit.map(() => '0-10').join(',')}],"summary":"one sentence"}`);
      const sc = a.crit.map((_, i) => Math.max(0, Math.min(10, +((v.scores || [])[i]) || 0))); const j = sc.reduce((p, q) => p + q, 0) / a.crit.length * 10;
      const f = a.facts ? 100 * a.facts.filter(x => x[1]).length / a.facts.length : null; const metric = Math.round(f == null ? j : 0.7 * j + 0.3 * f);
      const old = A[cid]; if (!old || old.metric == null || metric > old.metric) A[cid] = { ok: true, metric, detail: `Judge ${Math.round(j)}/100${f != null ? ` · facts ${a.facts.filter(x => x[1]).length}/${a.facts.length}` : ''}. ${String(v.summary || '').slice(0, 200)}` };
    } catch (e) {}
  }
  for (const [cid, a] of Object.entries(res.arena)) {
    if (a.kind !== 'build' || !a.ok) continue;
    const others = fs.existsSync('submissions') ? fs.readdirSync('submissions').filter(r => r !== id && fs.existsSync(path.join('submissions', r, cid + '.txt'))) : [];
    for (const other of others.sort(() => Math.random() - 0.5).slice(0, 4)) {
      const swap = Math.random() < 0.5; const [x, y] = swap ? [other, id] : [id, other];
      const code = r => fs.readFileSync(path.join('submissions', r, cid + '.txt'), 'utf8').slice(0, 60000);
      try { const v = await ask(`You are judging two anonymous entries in a coding competition. The brief was:\n\n${a.brief || a.name}\n\nENTRY A (HTML):\n${code(x)}\n\nENTRY B (HTML):\n${code(y)}\n\nJudge by reading the code: which entry better meets every requirement, works without bugs, and would look and feel more polished? Reply with JSON only: {"winner":"A" or "B" or "tie","reason":"one sentence"}`);
        lb.votes.push({ ch: cid, a: x, b: y, w: v.winner === 'A' ? 'a' : v.winner === 'B' ? 'b' : 't', who: model, at: Date.now(), why: String(v.reason || '').slice(0, 200) }); } catch (e) {}
    }
  }
}
// Elo for every build challenge.
for (const cid of [...new Set(lb.votes.map(v => v.ch))]) {
  const E = {}; Object.entries(lb.arena).forEach(([r, mm]) => { if (mm[cid]?.ok) E[r] = 1000; });
  lb.votes.filter(v => v.ch === cid && v.a in E && v.b in E).forEach(v => { const ea = 1 / (1 + 10 ** ((E[v.b] - E[v.a]) / 400)); const s = v.w === 'a' ? 1 : v.w === 'b' ? 0 : 0.5; E[v.a] += 32 * (s - ea); E[v.b] -= 32 * (s - ea); });
  for (const [r, e] of Object.entries(E)) lb.arena[r][cid].metric = Math.round(e);
}
lb.updated = new Date().toISOString();
fs.writeFileSync('leaderboard.json', JSON.stringify(lb, null, 1));
fs.writeFileSync('publish.md', [`Published to the leaderboard as **${run.name}**.`, key && model ? `Judge ${model}: ${judged} of ${res.rubric.length} open-ended answers judged; build votes updated.` : 'Open-ended answers and builds are not judged yet (the owner can set JUDGE_MODEL and an API key).', ...notes].join(' '));
