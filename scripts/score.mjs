// Scores a results issue with the site's own scoring code in headless Chrome.
// Untrusted answers (including code) only ever run inside the browser sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const issue = ev.issue || {};
const body = String(issue.body || '').replace(/\r\n/g, '\n');

function fields(b) {
  const out = {}; const parts = b.split(/^###\s+(.+?)\s*$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i].trim().toLowerCase()] = parts[i + 1].trim();
  return out;
}
const f = fields(body);
const get = (...keys) => {
  for (const k of keys) {
    const hit = Object.keys(f).find(x => x.startsWith(k));
    if (hit && f[hit] && f[hit] !== '_No response_') return f[hit].slice(0, 300);
  }
  return '';
};
const answersRaw = (() => { const hit = Object.keys(f).find(x => x.startsWith('answers')); return hit ? f[hit] : ''; })();
const meta = {
  model: get('ai model', 'model'), provider: get('provider'), access: get('access') || 'Unknown',
  iface: get('interface') || 'Unknown', think: get('thinking') || 'Unknown', tools: get('web search', 'tools') || 'Unknown',
  restrict: get('restriction'), notes: get('notes'),
};
const answers = {};
const parts = answersRaw.replace(/^```[a-z]*\n?|```\s*$/g, m => m).split(/<<<\s*([A-Z]+\d+)\s*>>>/);
for (let i = 1; i < parts.length; i += 2) answers[parts[i].toUpperCase()] = parts[i + 1].replace(/^\s*\n/, '').trim();

const write = (res, comment) => {
  fs.writeFileSync('result.json', JSON.stringify(res, null, 1));
  fs.writeFileSync('comment.md', comment);
};

if (!meta.model || !Object.keys(answers).length) {
  write({ ok: false }, `Thanks! I couldn't read this submission. It needs an **AI model and version** section and an **Answers** section with each answer starting with its ID like \`<<<G01>>>\`. See [SUBMIT.md](../blob/main/SUBMIT.md) for the exact format, then edit this issue and it will be scored again.`);
  process.exit(0);
}

const exe = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(p => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.goto('file://' + path.resolve('index.html'));
await page.waitForFunction(() => window.__bench && window.__bench.scoreAnswers, null, { timeout: 30000 });
const r = await page.evaluate(a => window.__bench.scoreAnswers(a), answers);
await browser.close();

const tierName = { S: 'Standard', F: 'Frontier', G: 'Gauntlet' };
const sum = {};
for (const [id, x] of Object.entries(r.scores)) {
  if (x.score == null) continue;
  const t = (sum[x.tier] ||= { s: 0, w: 0, n: 0 }); t.s += x.score * x.d; t.w += 3 * x.d; t.n++;
}
const lines = Object.entries(sum).map(([k, v]) => `| ${tierName[k] || k} | ${v.n} | ${(100 * v.s / v.w).toFixed(1)}% |`);
const det = Object.entries(r.scores).map(([id, x]) => `| ${id} | ${x.score ?? '–'}/3 | ${x.detail.replace(/\|/g, '\\|')} |`).join('\n');
const ar = Object.entries(r.arena).map(([id, x]) => `| ${id} | ${x.ok ? x.metric ?? 'submitted' : 'invalid'} | ${String(x.detail).replace(/\|/g, '\\|')} |`).join('\n');
const comment = [
  `## Automatic score for ${meta.model}`,
  `Access: ${meta.access} · Interface: ${meta.iface} · Thinking: ${meta.think} · Tools: ${meta.tools}${meta.restrict ? ' · Restrictions: ' + meta.restrict : ''}`,
  '', `Answers found: **${Object.keys(answers).length}** · auto-scored: **${Object.keys(r.scores).length}** · open-ended (judged on approval): **${r.rubric.length}** · Arena: **${Object.keys(r.arena).length}**${r.unknown.length ? ` · unknown IDs: ${r.unknown.join(', ')}` : ''}`,
  '', lines.length ? '| Tier | Tests | Score |\n|---|---|---|\n' + lines.join('\n') : '',
  det ? '\n<details><summary>Per-question results</summary>\n\n| ID | Score | Check |\n|---|---|---|\n' + det + '\n\n</details>' : '',
  ar ? '\n**Arena**\n\n| Challenge | Result | Detail |\n|---|---|---|\n' + ar : '',
  '', issue.author_association === 'OWNER' ? '_Owner submission: it will be added to the leaderboard automatically._' : '_The repository owner adds the `approved` label to put this on the public leaderboard._',
].join('\n');
write({ ok: true, issue: issue.number, author: issue.user && issue.user.login, meta, ...r }, comment);
