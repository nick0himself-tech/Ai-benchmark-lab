// Scores a results issue (or a follow-up comment on it) with the site's own scoring code
// in headless Chrome. Untrusted answers and code only ever run inside the browser sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const issue = ev.issue || {};
const isComment = !!ev.comment;
const norm = s => String(s || '').replace(/\r\n/g, '\n');
const metaBody = norm(issue.body);
const ansBody = norm(isComment ? ev.comment.body : issue.body);

function fields(b) {
  const out = {}; const parts = b.split(/^###\s+(.+?)\s*$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i].trim().toLowerCase()] = parts[i + 1].trim();
  return out;
}
const f = fields(metaBody);
const get = (...keys) => { for (const k of keys) { const hit = Object.keys(f).find(x => x.startsWith(k)); if (hit && f[hit] && f[hit] !== '_No response_') return f[hit].slice(0, 300); } return ''; };
const meta = { model: get('ai model', 'model'), provider: get('provider'), access: get('access') || 'Unknown', iface: get('interface') || 'Unknown',
  think: get('thinking') || 'Unknown', tools: get('web search', 'tools') || 'Unknown', restrict: get('restriction'), notes: get('notes') };
let answersText = ansBody;
if (!isComment) { const fa = fields(ansBody); const hit = Object.keys(fa).find(x => x.startsWith('answers')); answersText = hit ? fa[hit] : ''; }
const answers = {};
const parts = answersText.split(/<<<\s*([A-Z]+\d+)\s*>>>/);
for (let i = 1; i < parts.length; i += 2) answers[parts[i].toUpperCase()] = parts[i + 1].replace(/^\s*\n/, '').trim();

const runId = 'gh-issue-' + issue.number;
const write = (res, comment) => { fs.writeFileSync('result.json', JSON.stringify(res, null, 1)); fs.writeFileSync('comment.md', comment); };
if (!meta.model || !Object.keys(answers).length) {
  write({ ok: false }, `I couldn't read this submission. The issue needs an **AI model and version** section, and answers must start with their ID in triple angle brackets (for example G01). See [SUBMIT.md](https://github.com/nick0himself-tech/ai-benchmark-lab/blob/main/SUBMIT.md). Edit the issue or post a new comment to try again.`);
  process.exit(0);
}

const lb = fs.existsSync('leaderboard.json') ? JSON.parse(fs.readFileSync('leaderboard.json', 'utf8')) : {};
lb.models ||= []; lb.arena ||= {};
const nameOf = id => (lb.models.find(m => m.id === id) || {}).name || id;

const exe = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(p => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.goto('file://' + path.resolve('index.html'));
await page.waitForFunction(() => window.__bench && window.__bench.scoreAnswers, null, { timeout: 30000 });
const r = await page.evaluate(a => window.__bench.scoreAnswers(a), answers);

// Bot tournaments: the new bot against every approved bot already stored, plus the house bots.
const tourn = {};
for (const [cid, a] of Object.entries(r.arena)) {
  if (a.kind !== 'bot' || !a.ok) continue;
  const bots = [{ key: runId, name: meta.model + ' (this submission)', code: a.code }];
  const dir = 'submissions';
  if (fs.existsSync(dir)) for (const run of fs.readdirSync(dir)) {
    const file = path.join(dir, run, cid + '.txt');
    if (run !== runId && fs.existsSync(file)) bots.push({ key: run, name: nameOf(run), code: fs.readFileSync(file, 'utf8') });
  }
  tourn[cid] = await page.evaluate(([c, b]) => window.__bench.tournament(c, b), [cid, bots]);
  const me = tourn[cid].find(x => x.key === runId); a.metric = me ? me.pts : null;
  a.detail = 'Bot accepted and played the tournament.';
}
await browser.close();

// Records for the feedback loop.
const recordFor = (cid, better) => {
  const rows = Object.entries(lb.arena).filter(([run]) => run !== runId).map(([run, m]) => ({ run, a: m[cid] })).filter(x => x.a && x.a.ok && typeof x.a.metric === 'number');
  rows.sort((x, y) => better === 'low' ? x.a.metric - y.a.metric : y.a.metric - x.a.metric);
  return rows[0] ? { run: rows[0].run, metric: rows[0].a.metric, n: rows.length } : null;
};
const tierName = { S: 'Standard', F: 'Frontier', G: 'Gauntlet' };
const sum = {};
for (const x of Object.values(r.scores)) { if (x.score == null) continue; const t = (sum[x.tier] ||= { s: 0, w: 0, n: 0 }); t.s += x.score * x.d; t.w += 3 * x.d; t.n++; }
const esc = s => String(s).replace(/\|/g, '\\|').replace(/</g, '&lt;');
const lines = Object.entries(sum).map(([k, v]) => `| ${tierName[k] || k} | ${v.n} | ${(100 * v.s / v.w).toFixed(1)}% |`);
const det = Object.entries(r.scores).map(([id, x]) => `| ${id} | ${x.score ?? '–'}/3 | ${esc(x.detail)} |`).join('\n');
const arenaRows = Object.entries(r.arena).map(([id, a]) => {
  let status = a.ok ? (a.metric != null ? `${a.metric}${a.unit}` : 'accepted') : 'invalid';
  let rec = '';
  if (a.kind === 'build') rec = a.ok ? 'Ranked by head-to-head judging when published' : '';
  else if (a.kind === 'bot') rec = a.ok ? `Tournament: ${tourn[id].findIndex(x => x.key === runId) + 1} of ${tourn[id].length} (including house bots)` : '';
  else { const R = recordFor(id, a.better); if (!a.ok) rec = ''; else if (!R) rec = 'No record yet: this would be the first'; else { const beats = a.better === 'low' ? a.metric < R.metric : a.metric > R.metric; rec = `Record ${R.metric}${a.unit} by ${esc(nameOf(R.run))}${beats ? ' — **new record!**' : ` — ${a.better === 'low' ? 'lower' : 'higher'} is better, keep improving`}`; } }
  return `| ${id} ${esc(a.name)} | ${status} | ${esc(a.detail)} | ${rec} |`;
}).join('\n');
const tournTxt = Object.entries(tourn).map(([cid, rows]) => `\n<details><summary>${cid} tournament standings</summary>\n\n| # | Bot | Points |\n|---|---|---|\n${rows.map((x, i) => `| ${i + 1} | ${esc(x.key === runId ? '**' + x.name + '**' : x.name)} | ${x.pts}${x.rec ? ' (' + x.rec + ')' : ''} |`).join('\n')}\n\n</details>`).join('');
const auto = issue.author_association === 'OWNER' || (issue.labels || []).some(l => l.name === 'approved');
const comment = [
  `## Score for ${esc(meta.model)}${isComment ? ' (follow-up)' : ''}`,
  `Access: ${esc(meta.access)} · Interface: ${esc(meta.iface)} · Thinking: ${esc(meta.think)} · Tools: ${esc(meta.tools)}${meta.restrict ? ' · Restrictions: ' + esc(meta.restrict) : ''}`,
  '', `Answers read: **${Object.keys(answers).length}** · auto-scored: **${Object.keys(r.scores).length}** · open-ended (judged on publish): **${r.rubric.length}** · Arena: **${Object.keys(r.arena).length}**${r.unknown.length ? ` · unknown IDs: ${r.unknown.join(', ')}` : ''}`,
  lines.length ? '\n| Tier | Tests | Score |\n|---|---|---|\n' + lines.join('\n') : '',
  det ? '\n<details><summary>Per-question results</summary>\n\n| ID | Score | Check |\n|---|---|---|\n' + det + '\n\n</details>' : '',
  arenaRows ? '\n### Arena\n\n| Challenge | Result | Detail | Standing |\n|---|---|---|---|\n' + arenaRows + tournTxt : '',
  arenaRows ? '\n**Next step for AI agents:** to improve an Arena result, post a new comment on this issue with the improved, complete solution under its ID in the same format. Only your best result per challenge counts.' : '',
  '', auto ? '_This run is published to the leaderboard automatically._' : '_The repository owner adds the `approved` label to publish this run._',
].join('\n');
write({ ok: true, runId, issue: issue.number, author: (issue.user || {}).login, isComment, meta, tourn, ...r }, comment);
