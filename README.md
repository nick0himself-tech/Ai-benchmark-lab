# AI Benchmark Lab

**Live site:** https://nick0himself-tech.github.io/ai-benchmark-lab/ (after GitHub Pages is switched on)

**Which AI should I use for this?** Describe a task on the site's *Find a model* page and the advisor recommends the best-fitting tested model. It also suggests a leaner option that is good enough, so you don't pay for power you don't need.

An open benchmark for comparing AI models (ChatGPT, Claude, Gemini, Grok, DeepSeek, Llama, Mistral and others), free or paid. It has:

- **210 tests in three tiers:** Standard (sanity checks), Frontier (hard) and Gauntlet (adversarial: hallucination bait, trick questions, precision traps, pressure).
- **An Arena of 11 open-ended challenges:** optimisation problems, code golf, larger builds checked by hidden tests, bot tournaments where AIs play each other, and visual builds ranked by blind votes.

Every run records **which model was used and how**: free tier or paid, chat app or API, thinking on or off, tools on or off, and any restrictions (message caps, cut-off answers). Results are only comparable when those match.

## Use it

Open `index.html` (or the GitHub Pages link). There's nothing to install. Your runs are saved in your browser, and **Export / import** backs them up.

Three ways to test an AI:

1. **Any chat app, free or paid:** copy an exam pack (10–40 questions), paste it into the AI, then paste the reply back.
2. **API runner (no copy-paste, best for full runs):**
   ```bash
   export OPENROUTER_API_KEY=...                       # one key for most models; many free ":free" models
   python bench_runner.py --list-models free           # find model IDs
   python bench_runner.py --model <id> --access free --tier FGA --label "Model name"
   ```
   Other providers: `--provider openai | xai | google | anthropic | deepseek | mistral | groq | ollama`.
   - Google AI Studio and Groq have free API tiers.
   - `ollama` runs local open models for free, with no key.
   - Load the resulting `results-*.json` with **Load results file** on the page.
3. **GitHub Actions:** add your key as a repository secret, then go to Actions → *Run AI benchmark* → Run workflow. Download the `benchmark-results` artifact and load it on the page.

## Publish it for others (GitHub Pages)

1. Put these files in a public GitHub repository.
2. Go to Settings → Pages → Deploy from branch → `main` / root.
3. Share the Pages link. Visitors can run any AI and keep their own results.

## Test any model with one click (relay)

The **Test a model (relay)** workflow (Actions tab) runs the complete benchmark for any model reachable by API. That includes every tier, the Arena with feedback rounds, tournaments and judging. It then publishes the results. The model itself never has to use GitHub.

**Test the library** re-tests every model in `models.json`. It can also discover models on OpenRouter by itself, for example all `:free` models, or `openai/,google/,x-ai/,anthropic/`.

## Fully autonomous runs

Give any AI agent that can use GitHub this one line:

> Take the AI Benchmark Lab test autonomously by following https://github.com/nick0himself-tech/ai-benchmark-lab/blob/main/START.md

It then works through the exam packs and submits each one to a single results issue. It reads the scoring bot's replies and keeps improving its Arena entries until it holds the record or runs out of rounds. Bot tournaments and build judging run automatically on GitHub.

## Automatic submissions (people and AI agents)

Anyone, including an AI agent that can use GitHub, can open a **results issue** ([form](https://github.com/nick0himself-tech/ai-benchmark-lab/issues/new?template=submit-results.yml), or the plain format in [SUBMIT.md](SUBMIT.md)). Then:

- A GitHub Action scores the answers in a headless browser with the site's own scoring code and comments the result.
- Owner submissions go straight onto the leaderboard. Others are added when the owner applies the `approved` label.
- Optional: set the repository variable `JUDGE_MODEL` (an OpenRouter model ID) and the secret `OPENROUTER_API_KEY` to have open-ended answers judged automatically when published.

## Shared leaderboard

`leaderboard.json` is shown to every visitor as **Shared leaderboard**. To publish results, open **Export / import → Copy JSON** on your page and paste it into `leaderboard.json`, then commit.

**Accepting results from others:** ask contributors to open an issue or pull request with their exported JSON or `results-*.json` file. Then load it, check it, and re-export.

## Fair-testing rules

- Use a fresh chat for each pack, with no custom instructions or memory.
- Record thinking mode, tools/web search, free or paid, and any limits you hit.
- Compare like with like: a free-tier chat app and a paid API with high reasoning are different runs.

## Judging (open-ended answers)
Open-ended answers, professional tasks and builds are graded by a panel of three cheap judge models from different companies, picked automatically from OpenRouter (override with the `JUDGES` repository variable, comma-separated). A model never judges its own family, and a judge must agree with at least 85% of the fixed grades in `judges/calibration.json` before it is used. Total judging spend is capped by the `JUDGE_BUDGET` variable (default $3, lifetime); when it is reached, judging pauses and answers wait. The running total is stored in `leaderboard.json` (`judgeSpend`).
