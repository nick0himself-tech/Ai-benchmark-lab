# Backlog

Source of truth for priorities is Issue #1. This file mirrors it for the daily maintenance run.

## Rules for the maintenance run
- Never push to `main`. Work on a `claude/<topic>` branch and open a PR into `dev` (REST API: `gh api repos/nick0himself-tech/Ai-benchmark-lab/pulls`). The owner merges.
- Never spend money: no paid-model runs, no raising `JUDGE_BUDGET`, no changes to secrets or variables, no workflow dispatches.
- Answer keys must not become more exposed than they are now.
- Every site change: `node --check` on the page script, render at 390 px wide in headless Chrome, look at the screenshot.
- Report facts in PRs and issue comments: files, commands, results, limitations. No bare @mentions.

## Decisions
- 2026-11-25 (owner): the GitHub site (https://nick0himself-tech.github.io/Ai-benchmark-lab/) and `leaderboard.json` are the official results. The Claude artifact copy is the owner's private place for manual test runs and is not synced automatically; manual runs reach the leaderboard via Export / import → Copy JSON.

## Needs the owner
- [x] Add repository secret `OPENROUTER_API_KEY` (optionally a credit limit on the key at openrouter.ai).
- [ ] Decide: one-off $10 OpenRouter credit (raises the free cap from 50 to 1,000 requests/day).
- [x] Enable GitHub Pages (Settings → Pages → main / root).
- [x] Create a private repo (`ai-benchmark-core` exists).
- [ ] Fine-grained read token for it, saved as secret `CORE_TOKEN`.
- [x] Review and merge PR #2 (audit fixes) into `dev`, then `dev` into `main`.

## To do (in order; see Issue #1 for acceptance criteria)
- [ ] Follow up review comments on open PRs and on Issue #1 (from ChatGPT or the owner) before starting new work.
- [x] Advisor v2: evidence-strength label per recommendation (test count, verification level); score bands instead of exact % when fewer than 10 tests; "cheapest good-enough" pick (cheapest within 5 points of the best); access-mode filter (app / API / free tier / local).
- [ ] Catalogue facts: script that fetches the OpenRouter model list into `catalog.json` (id, name, prices, context, free/paid, release date, fetched date, source URL); advisor shows price from it with the source.
- [ ] Core set proposal: list ~50 existing objectively graded tests for the first vertical (coding + practical calculations), with gaps; post as a PR adding `core/PROPOSAL.md` (IDs and categories only, never answers).
- [ ] Repeatability: relay option `ATTEMPTS=3` for the core set, stored as passes out of 3, shown as "passed x/3".
- [ ] Feedback prompt on the advisor ("Did this help you decide? Yes / No"), counted anonymously; no accounts.
- [ ] Grow `judges/calibration.json` to about 20 items.
- [ ] Paid batch plan `PAID_PLAN.md`: 6–8 popular paid models, live OpenRouter prices, estimated cost of the core set each. Do not run.
- [ ] Private split, only after `CORE_TOKEN` exists.

## Deferred (Issue #1): Arena expansion, autonomous agent protocol work, nightly runs of paid models, subscriptions and payments. (Nightly free-model runs are on: $0, owner asked for the full free batch.)

## Log
- 2026-11-22: Matrix reading guide; relay daily-limit pause/resume; judge panel with $3 cap (pushed to main before the PR protocol).
- 2026-11-23: Audit posted to Issue #1; PR #2 (approval loophole, evidence labels, judge-injection guard, SOURCES.md, counts, nightly paused, CONTRIBUTING.md).
- 2026-11-23 (daily run): Fixed nightly library runs losing all answers: the Commit step failed on `git add submissions` when that folder did not exist (runs 45086543485 and 45104312898; 48 free answers for Ling 3.2 Flash were discarded). Same fix in test-model and score-submission workflows. Owner checklist updated.
- 2026-11-23 (daily run): Advisor v2: evidence label per recommendation (Strong / Moderate / Limited from relevant test count, share checked automatically, and how the run was produced); score bands when under 10 tests; "Cheapest good enough" card (cheapest known price within 5 points of the best; unknown prices never win); new "Free tier" access filter. Price still comes from measured run cost until `catalog.json` exists.
