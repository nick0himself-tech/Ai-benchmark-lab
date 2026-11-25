# Source registry

Which external benchmark sources we can use, and how. Checked 23 Nov 2026. Re-check a source before importing anything from it.

**Rule:** imported results, our own verified results and advisor estimates are kept apart and labelled. We never average scores from different benchmarks into one percentage.

| Source | What exists | Code licence | Data / results licence | Freshness | Covers | Decision |
|---|---|---|---|---|---|---|
| **LiveBench** (github.com/LiveBench/LiveBench, livebench.ai) | Questions, scoring code, per-question model judgments on Hugging Face (`livebench/model_judgment`, parquet: question_id, task, model, score, category) | LICENSE file present in repo; name to be confirmed from the file before reuse | **None declared** on the Hugging Face datasets. Website states no reuse terms. Newest questions are held back. | HF datasets last modified Apr 2025; repo README says release 2025-04-25; site now advertises LiveBench 2.0 | API models, 6 categories (math, coding, reasoning, language, instruction following, data analysis) | **Link-only.** Ask the maintainers (livebench@livebench.ai) for written permission before importing scores into a site that may charge. The public HF data is too old for current models anyway. |
| **Hugging Face Open LLM Leaderboard** | Archived results datasets (`open-llm-leaderboard-old/results`, v2 contents) | Apache-2.0 (leaderboard code) | Per-dataset; many underlying benchmarks have their own licences; some details gated | **Retired.** v1 archived June 2024; v2 since retired. No new evaluations. | Open-weight models only (no ChatGPT, Claude, Gemini) | **Skip.** Historical and does not cover the models our users choose between. |
| **EleutherAI LM Evaluation Harness** | Evaluation framework with many task adapters; OpenAI-compatible chat backends (`local-chat-completions`) | MIT | Each benchmark dataset keeps its own licence | Active | Mostly multiple-choice / log-likelihood academic benchmarks | **Reference, possible later dependency.** Useful for repeat runs and standard tasks, but its tasks are academic rather than practical. Do not adopt until we need a standard task it already has. |
| **Stanford HELM** | Framework, scenarios, published leaderboards | Apache-2.0 | Per-scenario | **Maintenance mode since 1 Jun 2026**: no new features or evaluations | Many models up to mid-2026 | **Reference only** for methodology (scenario design, reporting). No dependency. |
| **Artificial Analysis** (artificialanalysis.ai) | Free API with a public subset of model fields; paid Pro/Commercial tiers | n/a | Attribution required on all tiers; subject to Terms of Use and Data Platform Terms; redistribution rights only via a commercial package | Live | Most current API models: intelligence indexes, price, speed | **Link-only.** Do not import into a product that may charge without a commercial agreement. Link to it for speed and price context. |
| **OpenRouter model list** (openrouter.ai/api/v1/models) | Public JSON: model id, name, creation date, context length, prices, modalities | n/a | Facts (prices, context sizes), no restrictive terms found on that endpoint; check OpenRouter terms before any bulk republication | Live | Hundreds of API models incl. free tiers | **Approved for catalogue facts** (price, context, free/paid, release date), with a source link and fetch date. Not a quality score. |

## Conclusion
No free, current, legally clear source gives task-level quality scores for the models people actually choose between (ChatGPT, Claude, Gemini, popular API models). So:
1. Use the **OpenRouter model list** for cost and access facts. It's free and current. `scripts/catalog.mjs` stores only the models this project uses (not the whole list), with source and fetch date, in `catalog.json`.
2. Use **our own runs** (free models via the relay, plus spot checks of paid models after approval) for quality evidence, labelled by how well verified they are.
3. **Link out** to LiveBench and Artificial Analysis for broader context, and ask LiveBench for permission if we want their scores.

## Fields every imported score must carry (schema)
```json
{
  "source": "livebench",
  "source_url": "https://…",
  "licence": "…",
  "fetched": "2026-11-23",
  "model_id": "provider/model@version",
  "access_mode": "api | app | local",
  "benchmark": "livebench-2025-04-25",
  "task": "coding/code_generation",
  "metric": "pass@1",
  "value": 0.62,
  "settings": {"reasoning": "high", "tools": false},
  "evidence": "imported"
}
```
`evidence` is one of `imported`, `verified` (our run, reproducible through the relay or panel-judged), `unverified` (self-submitted or partial) and `estimate` (advisor inference).
