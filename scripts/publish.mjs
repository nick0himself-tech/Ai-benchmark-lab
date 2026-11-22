// Publishes a scored submission to leaderboard.json and submissions/.
// Open-ended answers, professional tasks and builds are graded by a judge panel when an API key is set.
import fs from 'node:fs';
import path from 'node:path';
import { makePanel, suspicious } from './judges.mjs';
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
// Evidence labels shown next to the run, so partial or unverified results are never presented as fully verified.
{ const total = JSON.parse(fs.readFileSync('tests.json', 'utf8')).tests.filter(t => t.tier !== 'A').length;
  const ev = new Set((run.evidence || []).filter(e => !['partial run', 'unverified submission'].includes(e)));
  if (res.issue && res.authorAssociation !== 'OWNER') ev.add('unverified submission');
  if (res.issue && !/relay/i.test(m.notes || '')) ev.add('self-reported setup');
  run._pendingEvidence = { ev, total }; }
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

// Judging: a panel of three qualified judges from other companies, with a hard spending cap (see judges.mjs).
const key = process.env.OPENROUTER_API_KEY || process.env.JUDGE_API_KEY;
const base = process.env.JUDGE_BASE_URL || 'https://openrouter.ai/api/v1';
let judged = 0, J = null;
if (key && process.env.JUDGING !== 'off') J = await makePanel({ key, base, runModel: `${m.model} ${m.provider || ''} ${res.modelId || ''}`, lb, env: process.env });
const flag = (what, why) => { lb.review = (lb.review || []).filter(x => !(x.run === id && x.what === what)); lb.review.push({ run: id, what, why, at: new Date().toISOString() }); };
if (J && J.panel.length) {
  for (const q of res.rubric) { if (suspicious(q.answer)) flag(q.id, 'Answer seems to address the grader'); const v = await J.rubric(q); if (!v) continue; R[q.id] = { score: v.score, checks: v.checks, judges: v.judges }; judged++; if (v.split) flag(q.id, 'Judges disagreed by 2+ points'); }
  for (const [cid, a] of proQueue) {
    if (suspicious(a.text)) flag(cid, 'Submission seems to address the grader');
    const v = await J.pro(a); if (!v) { A[cid] ||= { ok: true, metric: null, detail: 'Awaiting judge' }; continue; }
    const f = a.facts ? 100 * a.facts.filter(x => x[1]).length / a.facts.length : null; const metric = Math.round(f == null ? v.j : 0.7 * v.j + 0.3 * f);
    const old = A[cid]; if (!old || old.metric == null || metric > old.metric) A[cid] = { ok: true, metric, detail: `Judges ${Math.round(v.j)}/100 (${v.judges} judges, middle score)${f != null ? ` · facts ${a.facts.filter(x => x[1]).length}/${a.facts.length}` : ''}. ${String(v.summary).slice(0, 200)}` };
    if (v.split) flag(cid, 'Judges were more than 30 points apart');
  }
  for (const [cid, a] of Object.entries(res.arena)) {
    if (a.kind !== 'build' || !a.ok || J.stopped()) continue;
    const others = fs.existsSync('submissions') ? fs.readdirSync('submissions').filter(r => r !== id && fs.existsSync(path.join('submissions', r, cid + '.txt'))) : [];
    for (const other of others.sort(() => Math.random() - 0.5).slice(0, 3)) {
      const swap = Math.random() < 0.5; const [x, y] = swap ? [other, id] : [id, other];
      const code = r => fs.readFileSync(path.join('submissions', r, cid + '.txt'), 'utf8').slice(0, 40000);
      const v = await J.pair(a.brief || a.name, code(x), code(y)); if (v) lb.votes.push({ ch: cid, a: x, b: y, w: v.w, who: v.who, at: Date.now(), why: v.why });
    }
  }
} else for (const [cid] of proQueue) A[cid] ||= { ok: true, metric: null, detail: 'Awaiting judge' };
// Elo for every build challenge.
for (const cid of [...new Set(lb.votes.map(v => v.ch))]) {
  const E = {}; Object.entries(lb.arena).forEach(([r, mm]) => { if (mm[cid]?.ok) E[r] = 1000; });
  lb.votes.filter(v => v.ch === cid && v.a in E && v.b in E).forEach(v => { const ea = 1 / (1 + 10 ** ((E[v.b] - E[v.a]) / 400)); const s = v.w === 'a' ? 1 : v.w === 'b' ? 0 : 0.5; E[v.a] += 32 * (s - ea); E[v.b] -= 32 * (s - ea); });
  for (const [r, e] of Object.entries(E)) lb.arena[r][cid].metric = Math.round(e);
}
{ const { ev, total } = run._pendingEvidence; delete run._pendingEvidence;
  if (Object.keys(R).length < 0.9 * total) ev.add('partial run');
  const hasRubric = (res.rubric || []).length; if (hasRubric && !(J && J.panel.length)) ev.add('open-ended not judged'); else if (J && J.panel.length) ev.delete('open-ended not judged');
  run.evidence = [...ev]; }
lb.updated = new Date().toISOString();
fs.writeFileSync('leaderboard.json', JSON.stringify(lb, null, 1));
const jl = !J ? 'Open-ended answers and builds are not judged yet (the owner can add an OpenRouter key).'
  : !J.panel.length ? `No qualified judges available${J.stopped() ? ' (judging budget used up)' : ''}; open-ended answers wait for judging. ${J.log.join(' ')}`
  : `Judges: ${J.panel.join(', ')}. ${judged} of ${res.rubric.length} open-ended answers judged. Judging spend so far $${J.spend.total.toFixed(2)} of $${J.budget.toFixed(2)}${J.stopped() ? ' — budget reached, judging paused' : ''}. ${J.log.join(' ')}`;
fs.writeFileSync('publish.md', [`Published to the leaderboard as **${run.name}**.`, jl, ...notes].join(' '));
