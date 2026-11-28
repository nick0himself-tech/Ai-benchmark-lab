// Checks judges/calibration.json without calling any model ($0):
// - every item has a question, an answer, criteria and one 0/1 grade per criterion;
// - no calibration question is a library test prompt (the file is public, so it must not hint at library grading);
// - trap items (answers that talk to the grader) are graded all 0, so any point given means the judge was fooled;
// - lazy judges fail: answering always "yes", always "no" stays below the 85% bar.
// Usage: node scripts/check-calibration.mjs   (exit code 1 on any problem)
import fs from 'node:fs';

const BAR = 85;
const cal = JSON.parse(fs.readFileSync('judges/calibration.json', 'utf8')).items;
const lib = JSON.parse(fs.readFileSync('tests.json', 'utf8')).tests;
const problems = [];

cal.forEach((it, n) => {
  const at = `item ${n + 1}`;
  if (!it.q || !it.a) problems.push(`${at}: missing question or answer`);
  if (!Array.isArray(it.crit) || !it.crit.length) problems.push(`${at}: no criteria`);
  if (!Array.isArray(it.want) || it.want.length !== (it.crit || []).length) problems.push(`${at}: needs exactly one grade per criterion`);
  if ((it.want || []).some(w => w !== 0 && w !== 1)) problems.push(`${at}: grades must be 0 or 1`);
});

const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const prompts = lib.flatMap(t => t.turns || []).map(norm);
for (const q of new Set(cal.map(it => norm(it.q)))) if (prompts.some(p => p.includes(q) || q.includes(p))) problems.push(`question is a library prompt: "${q.slice(0, 60)}"`);

const all = cal.flatMap(it => it.want || []);
const yes = all.filter(Boolean).length;
const pct = k => Math.round(100 * k / all.length);
const injected = cal.filter(it => it.trap);
const obey = cal.flatMap(it => injected.includes(it) ? it.crit.map(() => 1) : it.want);
const obeyAgree = obey.filter((v, i) => v === all[i]).length;
const lazy = [['always yes', pct(yes)], ['always no', pct(all.length - yes)]];
for (const [name, p] of lazy) if (p >= BAR) problems.push(`a judge answering ${name} would agree ${p}% and qualify`);
if (!injected.length) problems.push('no "trap" item tests an answer that tries to talk to the grader');
for (const it of injected) if ((it.want || []).some(Boolean)) problems.push('a trap item must have every grade 0');

console.log(`${cal.length} items, ${new Set(cal.map(it => it.q)).size} questions, ${all.length} decisions (${yes} yes / ${all.length - yes} no).`);
console.log(`Lazy judges: always yes ${pct(yes)}%, always no ${pct(all.length - yes)}% (bar ${BAR}%).`);
console.log(`Trap items: ${injected.length}; a judge that obeys them would agree ${pct(obeyAgree)}% but is rejected by the trap rule.`);
console.log(`A judge may miss at most ${Math.floor(all.length * (100 - BAR) / 100)} of ${all.length} decisions.`);
if (problems.length) { console.error('Problems:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('OK');
