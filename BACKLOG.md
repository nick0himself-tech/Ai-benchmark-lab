# Backlog

Source of truth for priorities is Issue #1. This file mirrors it for the daily maintenance run.

## Rules for the maintenance run
- Never push to `main`. Work on a `claude/<topic>` branch and open a PR into `dev` (REST API: `gh api repos/nick0himself-tech/Ai-benchmark-lab/pulls`). The owner merges.
- Never spend money: no paid-model runs, no raising `JUDGE_BUDGET`, no changes to secrets or variables, no workflow dispatches.
- Answer keys must not become more exposed than they are now.
- Every site change: `node --check` on the page script, render at 390 px wide in headless Chrome, look at the screenshot.
- Report facts in PRs and issue comments: files, commands, results, limitations. No bare @mentions.

## Needs the owner
- [ ] Add repository secret `OPENROUTER_API_KEY` (optionally a credit limit on the key at openrouter.ai).
- [ ] Decide: one-off $10 OpenRouter credit (raises the free cap from 50 to 1,000 requests/day).
- [ ] Enable GitHub Pages (Settings → Pages → main / root).
- [ ] Create a private repo (e.g. `ai-benchmark-core`) and a fine-grained read token saved as secret `CORE_TOKEN`.
- [ ] Review and merge PR #2 (audit fixes) into `dev`, then `dev` into `main`.

## To do (in order; see Issue #1 for acceptance criteria)
- [ ] Follow up review comments on open PRs and on Issue #1 (from ChatGPT or the owner) before starting new work.
- [ ] Advisor v2: evidence-strength label per recommendation (test count, verification level); score bands instead of exact % when fewer than 10 tests; "cheapest good-enough" pick (cheapest within 5 points of the best); access-mode filter (app / API / free tier / local).
- [ ] Catalogue facts: script that fetches the OpenRouter model list into `catalog.json` (id, name, prices, context, free/paid, release date, fetched date, source URL); advisor shows price from it with the source.
- [ ] Core set proposal: list ~50 existing objectively graded tests for the first vertical (coding + practical calculations), with gaps; post as a PR adding `core/PROPOSAL.md` (IDs and categories only, never answers).
- [ ] Repeatability: relay option `ATTEMPTS=3` for the core set, stored as passes out of 3, shown as "passed x/3".
- [ ] Feedback prompt on the advisor ("Did this help you decide? Yes / No"), counted anonymously; no accounts.
- [ ] Grow `judges/calibration.json` to about 20 items.
- [ ] Paid batch plan `PAID_PLAN.md`: 6–8 popular paid models, live OpenRouter prices, estimated cost of the core set each. Do not run.
- [ ] Private split, only after `CORE_TOKEN` exists.

## Deferred (Issue #1): Arena expansion, autonomous agent protocol work, nightly full-library runs, subscriptions and payments.

## Log
- 2026-11-22: Matrix reading guide; relay daily-limit pause/resume; judge panel with $3 cap (pushed to main before the PR protocol).
- 2026-11-23: Audit posted to Issue #1; PR #2 (approval loophole, evidence labels, judge-injection guard, SOURCES.md, counts, nightly paused, CONTRIBUTING.md).
