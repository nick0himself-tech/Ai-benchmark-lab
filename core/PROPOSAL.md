# Core set proposal: coding + practical calculations

Status: proposal for review (Issue #1, priority 4). Nothing here changes scoring or the site yet.

This file lists **test IDs, names and categories only**. It never contains prompts' expected answers, hidden tests or checker code, and must stay that way.

## What the core set is for
- One fixed, objectively graded set that every model in the first vertical runs, so advisor scores compare like with like.
- The unit for repeatability: each item run 3 times, shown as "passed x/3" (next backlog item).
- The basis for paid-model cost estimates (`PAID_PLAN.md`): about 50 items × 3 attempts per model.

## Selection rules
1. Graded automatically only: code with hidden tests, number within tolerance, exact match, or a checker function. **No rubric / judge items**, so the core set costs $0 to score.
2. Fits the first vertical: writing working code, and the calculations freelancers and small businesses actually do (money, dates and times, quantities, units, engineering formulas, spreadsheet logic).
3. Prefer realistic tasks over puzzles and trick questions. Trick items (bat and ball, "do not use a calculator" digit feats) are left out; they test something else.
4. Spread of difficulty (1–3) so the set separates both weak and strong models.

## Proposed set: 52 items
By grading: code + hidden tests 20, number within tolerance 24, exact match 7, checker function 1.
By tier: items come from Standard (S), Frontier (F), Gauntlet (G) and Real World (R).
"Runs with an answer" counts the 4 runs on the leaderboard today (`main`, 25 Nov 2026) that already answered the item.

### Coding: write a function (hidden tests run in a browser worker) (20)

| ID | Tier | Category | Graded by | Difficulty | Name | Runs with an answer |
|---|---|---|---|---|---|---|
| C1 | S | code | code + hidden tests | 1 | Palindrome | 4/4 |
| C2 | S | code | code + hidden tests | 2 | Merge intervals | 3/4 |
| C3 | S | code | code + hidden tests | 1 | Roman numerals | 4/4 |
| C4 | S | code | code + hidden tests | 2 | Longest unique substring | 4/4 |
| C5 | S | code | code + hidden tests | 3 | Topological sort | 3/4 |
| C6 | S | code | code + hidden tests | 3 | CSV line parser | 4/4 |
| C7 | S | code | code + hidden tests | 2 | Edit distance | 4/4 |
| C8 | S | code | code + hidden tests | 3 | N-Queens count | 4/4 |
| F50 | F | code | code + hidden tests | 3 | Expression evaluator | 2/4 |
| F51 | F | code | code + hidden tests | 2 | LRU cache | 2/4 |
| F52 | F | code | code + hidden tests | 3 | Regex matcher | 2/4 |
| F53 | F | code | code + hidden tests | 3 | Hardest sudoku | 2/4 |
| F54 | F | code | code + hidden tests | 2 | Big-integer strings | 2/4 |
| F55 | F | code | code + hidden tests | 3 | LIS at scale | 2/4 |
| F56 | F | code | code + hidden tests | 3 | Minimum window | 2/4 |
| G60 | G | code | code + hidden tests | 2 | Days between (DST) | 2/4 |
| G61 | G | code | code + hidden tests | 2 | Median trap | 2/4 |
| G62 | G | code | code + hidden tests | 3 | Deep equality | 2/4 |
| G63 | G | code | code + hidden tests | 2 | Chunk with edge cases | 2/4 |
| G64 | G | code | code + hidden tests | 3 | Duration parser | 2/4 |

### Everyday money, time and quantity calculations (20)

| ID | Tier | Category | Graded by | Difficulty | Name | Runs with an answer |
|---|---|---|---|---|---|---|
| R01 | R | real | exact match | 1 | Scale a recipe | 0/4 |
| R02 | R | real | number within tolerance | 1 | Oven temperature | 0/4 |
| R03 | R | real | number within tolerance | 1 | Fuel cost of a trip | 0/4 |
| R04 | R | real | number within tolerance | 1 | Heater electricity | 0/4 |
| R05 | R | real | number within tolerance | 2 | Loan payment | 0/4 |
| R06 | R | real | number within tolerance | 2 | Splitting a bill | 0/4 |
| R07 | R | real | exact match | 3 | Time zones and DST | 0/4 |
| R08 | R | real | exact match | 2 | Business-day delivery | 0/4 |
| R09 | R | real | number within tolerance | 2 | Paint calculation | 0/4 |
| R10 | R | real | checker function | 2 | Spreadsheet formula | 0/4 |
| R12 | R | real | exact match | 2 | Lease notice period | 0/4 |
| R14 | R | real | number within tolerance | 1 | Budget left over | 0/4 |
| R15 | R | real | number within tolerance | 3 | Cheapest way to buy | 0/4 |
| R16 | R | real | number within tolerance | 2 | Parking fee with cap | 0/4 |
| R17 | R | real | exact match | 2 | Will it fit? | 0/4 |
| R18 | R | real | exact match | 2 | Backward planning | 0/4 |
| M5 | S | math | number within tolerance | 2 | Compound interest | 4/4 |
| T2 | S | track | number within tolerance | 2 | Running balance | 2/4 |
| F06 | F | prec | number within tolerance | 2 | Days between dates | 2/4 |
| F30 | F | track | number within tolerance | 3 | Invoice reconciliation (long) | 2/4 |

### Engineering and unit calculations (9)

| ID | Tier | Category | Graded by | Difficulty | Name | Runs with an answer |
|---|---|---|---|---|---|---|
| E3 | S | eng | number within tolerance | 2 | Pipe flow | 3/4 |
| E4 | S | eng | number within tolerance | 2 | Reynolds number | 2/4 |
| E5 | S | eng | number within tolerance | 3 | Faraday dissolution | 2/4 |
| E6 | S | eng | number within tolerance | 3 | RO mass balance | 3/4 |
| E7 | S | eng | number within tolerance | 2 | Beam moment | 2/4 |
| E8 | S | eng | number within tolerance | 2 | Heating energy | 2/4 |
| F60 | F | eng | number within tolerance | 3 | Darcy–Weisbach | 2/4 |
| F61 | F | eng | number within tolerance | 3 | NPSH available | 2/4 |
| F62 | F | eng | number within tolerance | 2 | Osmotic pressure | 2/4 |

### Data and spreadsheet-style maths (3)

| ID | Tier | Category | Graded by | Difficulty | Name | Runs with an answer |
|---|---|---|---|---|---|---|
| S2 | S | data | exact match | 2 | Largest % change | 4/4 |
| S4 | S | data | number within tolerance | 2 | Std deviation | 3/4 |
| S5 | S | data | number within tolerance | 2 | CSV aggregation | 4/4 |

### Alternates (not counted; swap in if an item above is dropped)

| ID | Tier | Category | Graded by | Difficulty | Name | Runs with an answer |
|---|---|---|---|---|---|---|
| E1 | S | eng | number within tolerance | 1 | Electrical power | 2/4 |
| S1 | S | data | number within tolerance | 1 | Mean | 3/4 |
| S3 | S | data | number within tolerance | 1 | Median | 4/4 |
| R13 | R | real | exact match | 1 | Warranty window | 0/4 |
| M8 | S | math | number within tolerance | 1 | Bat and ball | 3/4 |
| T5 | S | track | exact match | 2 | Mental execution | 2/4 |
| G23 | G | prec | exact match | 3 | JavaScript quirks | 2/4 |
| G24 | G | prec | exact match | 3 | Python quirks | 2/4 |
| G25 | G | prec | exact match | 2 | Closure in a loop | 2/4 |
| F32 | F | track | exact match | 3 | Mental program execution | 2/4 |

## Gaps (what the existing tests don't cover)
- **Only JavaScript.** All 20 coding items are JavaScript. Users also ask for Python, SQL and spreadsheet formulas. Suggest adding about 6 Python and 4 SQL items with hidden tests (the browser worker would need Pyodide / sql.js, or the checks move to the private scorer).
- **Spreadsheets:** one Excel formula item (R10). Add about 4 more (lookup, conditional sums, date maths, text cleanup), checked by evaluating the formula on fixed sample rows.
- **Percent and VAT maths:** no item on VAT in/out, margin vs markup, discounts stacked on discounts, or currency conversion with a given rate. Add about 4.
- **Unit conversions:** only °F→°C (R02) and inside engineering items. Add about 3 (imperial/metric lengths and volumes, energy units).
- **Code fixing:** "fix this bug" items are graded by a judge today (`debug` category), so they are excluded. Converting 3–4 of them to hidden-test grading would cover a very common real use.
- **Exposure.** Every item above is public in `tests.json` and `index.html` (finding B in Issue #1). Results on them can be inflated by models that saw the repo. This set is a **starting point**: once `CORE_TOKEN` exists, new private items for the gaps above should replace the most exposed ones, and the public versions stay as a practice set.

## Open questions for review
1. Are T2 (running balance) and F30 (long invoice reconciliation) "practical calculations" or reading tasks? They are kept because they mirror real bookkeeping.
2. Should the code-reading items (T5, G23–G25, F32) count as coding? They are listed as alternates because predicting output without running code is less common in practice than writing code.
3. 52 items × 3 attempts = 156 answers per model. On the free tier (50 requests/day) that is about 4 nights per free model. Acceptable, or cut to about 40 items?
