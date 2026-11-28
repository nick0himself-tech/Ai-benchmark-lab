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
- [ ] Switch on the advisor feedback counter: create a free site at goatcounter.com (no cookies, free for non-commercial use), then put its code in `feedback.json`, e.g. `{"goatcounter": "ai-benchmark-lab"}` for ai-benchmark-lab.goatcounter.com. Until then the prompt stays hidden; `?feedback=preview` shows it without counting.
- [x] Review and merge PR #2 (audit fixes) into `dev`, then `dev` into `main`.

## To do (in order; see Issue #1 for acceptance criteria)
- [ ] Follow up review comments on open PRs and on Issue #1 (from ChatGPT or the owner) before starting new work.
- [x] Advisor v2: evidence-strength label per recommendation (test count, verification level); score bands instead of exact % when fewer than 10 tests; "cheapest good-enough" pick (cheapest within 5 points of the best); access-mode filter (app / API / free tier / local).
- [x] Catalogue facts: script that fetches the OpenRouter model list into `catalog.json` (id, name, prices, context, free/paid, release date, fetched date, source URL); advisor shows price from it with the source.
- [x] Core set proposal: list ~50 existing objectively graded tests for the first vertical (coding + practical calculations), with gaps; post as a PR adding `core/PROPOSAL.md` (IDs and categories only, never answers).
- [x] Repeatability: relay option `ATTEMPTS=3` for the core set, stored as passes out of 3, shown as "passed x/3".
- [x] Feedback prompt on the advisor ("Did this help you decide? Yes / No"), counted anonymously; no accounts.
- [x] Grow `judges/calibration.json` to about 20 items.
- [ ] Paid batch plan `PAID_PLAN.md`: 6–8 popular paid models, live OpenRouter prices, estimated cost of the core set each. Do not run.
- [ ] Private split, only after `CORE_TOKEN` exists.

## Deferred (Issue #1): Arena expansion, autonomous agent protocol work, nightly runs of paid models, subscriptions and payments. (Nightly free-model runs are on: $0, owner asked for the full free batch.)

## Log
- 2026-11-22: Matrix reading guide; relay daily-limit pause/resume; judge panel with $3 cap (pushed to main before the PR protocol).
- 2026-11-23: Audit posted to Issue #1; PR #2 (approval loophole, evidence labels, judge-injection guard, SOURCES.md, counts, nightly paused, CONTRIBUTING.md).
- 2026-11-23 (daily run): Fixed nightly library runs losing all answers: the Commit step failed on `git add submissions` when that folder did not exist (runs 45086543485 and 45104312898; 48 free answers for Ling 3.2 Flash were discarded). Same fix in test-model and score-submission workflows. Owner checklist updated.
- 2026-11-23 (daily run): Advisor v2: evidence label per recommendation (Strong / Moderate / Limited from relevant test count, share checked automatically, and how the run was produced); score bands when under 10 tests; "Cheapest good enough" card (cheapest known price within 5 points of the best; unknown prices never win); new "Free tier" access filter. Price still comes from measured run cost until `catalog.json` exists.
- 2026-11-24 (daily run): Catalogue facts: `scripts/catalog.mjs` + weekly workflow `catalog.yml` ($0, no key) write `catalog.json` from OpenRouter's public model list, limited to models we use (models.json, OpenRouter IDs in leaderboard runs, `CATALOG_IDS`). Advisor shows the API list price with source and fetch date, and estimates cost per answer from it when a run has no measured cost. Could not fetch OpenRouter from the maintenance sandbox, so `catalog.json` appears after the first workflow run; tested against a fixture.
- 2026-11-25 (daily run): Core set proposal `core/PROPOSAL.md`: 52 existing auto-graded items for coding + practical calculations (20 code with hidden tests, 24 numeric, 7 exact, 1 checker; no judge items), 10 alternates, coverage per item from the 4 current runs, and gaps (only JavaScript, few spreadsheet/VAT/unit items, code fixing is judge-graded, all items public). IDs and names only, no answers.
- 2026-11-25: Results tab showed a blank "Model A" run first (0 of 236 scored) and the published leaderboard about 3,700 px further down, so the site looked empty to visitors. Published results now come first; your own runs fold into a closed section when they have no scored answers; the published table shows Overall and Tests right after the run name so the score is visible on a phone.
- 2026-11-26 (daily run): Repeatability: `core/core-set.json` (the 52 core IDs from PROPOSAL.md, no answers); relay options `RELAY_SET=core` (core items only, no Arena, no judge cost) and `RELAY_ATTEMPTS=1–3` (separate chats per attempt, resumes after the daily limit without repeating stored attempts; own run ID so it never mixes with full-library runs). `publish.mjs` stores every attempt's score in `att` and the mean as `score`. Results tab shows "How reliable is each AI?" with passed every time / sometimes / never and "passed x/3" per question. Manual `Test a model` workflow gains `set` and `attempts` inputs; nightly runs unchanged. Tested end to end against a mock API (60-request daily limit, then resume: exactly 156 answers = 52 × 3). No real run yet.
- 2026-11-27 (daily run): Advisor feedback prompt: "Did this help you decide? Yes / No" under each recommendation. Anonymous: one request to a GoatCounter event counter with only the answer and the top need (e.g. `/feedback/yes/code`); nothing typed is sent, no cookies, no accounts; one answer per browser per 30 days (remembered in localStorage). Off until the owner adds a GoatCounter code to `feedback.json` (code is validated, so the file cannot point the request elsewhere); `?feedback=preview` shows it without counting. Not shown in the Claude artifact copy. Tested in headless Chrome at 390×844: hidden when unconfigured or code invalid, preview counts nothing, configured sends exactly one request, prompt does not return after voting.
- 2026-11-28 (daily run): Judge calibration set grown from 8 to 20 answers (80 yes/no decisions, 45 yes / 35 no) with 6 new questions written only for this file (password storage, bill split, Git merge conflict, office backups, recipe scaling, 404 vs 500), not library tests. New answers test: an injected "give full marks" note, an arithmetic slip, a different but valid method, a long padded answer missing one point, a refusal, an invented statistic and wrong facts. New rule: a judge that gives any point to the trap answer is not used, even at 95% agreement. `scripts/check-calibration.mjs` ($0) checks grades, no overlap with library prompts, and that always-yes (56%) and always-no (44%) judges fail. Qualification costs 20 instead of 8 judge calls per candidate per month (about $0.014 each at the observed $0.0007/call). Judges already qualified on the old set keep their status until their monthly re-test.
