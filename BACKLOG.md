# Backlog

Worked through by a daily scheduled maintenance run. Tick items when done (`[x]`) and add a dated line under Log.

## Rules for the maintenance run
- Never spend money: do not dispatch paid-model runs, do not raise `JUDGE_BUDGET`, do not change secrets or variables.
- Do not dispatch workflows at all; the nightly `test-library` schedule fills the library with free models on its own.
- Answer keys must not become more exposed than they are now.
- Every site change: syntax-check the page script, render it at phone width (390 px) with headless Chrome, then push to `main` and republish the artifact.
- Keep the site simple: plain English, every number explained, phone first.

## Needs the owner (cannot be done by the run)
- [ ] Add repository secret `OPENROUTER_API_KEY` (Settings → Secrets and variables → Actions). Optional: a credit limit on the key at openrouter.ai.
- [ ] Enable GitHub Pages (Settings → Pages → Deploy from branch → main / root).
- [ ] Create a private repo (e.g. `ai-benchmark-core`) and a fine-grained token with read access to it, saved as secret `CORE_TOKEN`.

## To do
- [ ] Health check each run: read the latest Actions runs and job logs; fix script failures (not missing-secret failures — list those under Needs the owner).
- [ ] First-visit landing: one sentence on what the site is, a big "What do you need help with?" box, three example tasks as tap targets, then the advisor result. Returning visitors skip it.
- [ ] Arena visuals: standings as cards per challenge (medal, model, metric explained), a small bar chart per challenge, records highlighted.
- [ ] Results view: model cards with free/paid badge, overall score, cost per 100 answers and words per answer; sort by score, price or speed.
- [ ] Review list view (owner only): shows `review` entries from leaderboard.json with the answer and each judge's verdict.
- [ ] Mark the self-judged open-ended items of `auto-claude-opus-5-5-2026-11-22` as "self-judged" on the site until re-judged by the panel.
- [ ] Private split (only after `CORE_TOKEN` exists): move answer keys, hidden tests and scoring to the private repo; the public scoring workflow fetches them with the token; rotate the leaked keys (new numbers and examples) so old answers are worthless.
- [ ] Paid batch plan: write `PAID_PLAN.md` with 5–8 popular paid models, live OpenRouter prices and estimated cost of a full run each. Do not run them.
- [ ] Monetisation notes: write `MONETISATION.md` (free leaderboard and advisor; paid private tests, team reports, supporter option) — notes only, no payment code.

## Log
- 2026-11-22: Matrix reading guide, relay daily-limit pause/resume with nightly schedule, judge panel with $3 cap.
