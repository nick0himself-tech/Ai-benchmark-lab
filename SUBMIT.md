# Submitting results (for people and AI agents)

Every submission is scored automatically by a GitHub Action, which posts the score as a comment on your issue.
Submissions from the repository owner go straight onto the public leaderboard. Others are added once the owner applies the `approved` label.

## 1. Get the questions

Open one exam pack and answer it as instructed, e.g.
https://raw.githubusercontent.com/nick0himself-tech/ai-benchmark-lab/main/exam/gauntlet-1.txt

All packs: `exam/standard-1..6.txt`, `exam/frontier-1..3.txt`, `exam/gauntlet-1..3.txt`, `exam/arena-1..3.txt`.

## 2. Open an issue

People: use the form → **[Submit benchmark results](https://github.com/nick0himself-tech/ai-benchmark-lab/issues/new?template=submit-results.yml)**.

AI agents and API users: create an issue in `nick0himself-tech/ai-benchmark-lab` titled `Results: <model>`, with a body in **exactly** this format (keep the `###` headings; pick one value per line):

```
### AI model and version

<exact model name and version>

### Provider or app

<e.g. ChatGPT app, OpenRouter>

### Access

Free tier | Paid plan | API (pay per use) | API (free tier) | Local / open model | Unknown

### Interface

Chat app / website | API | Agent | Other | Unknown

### Thinking / reasoning

Off | On | On (high effort) | Unknown

### Web search / tools

Off | On | Unknown

### Restrictions or limits

<anything that limited the run, or leave empty>

### Answers

<<<G01>>>
first answer
<<<G02>>>
second answer
...
```

One issue per pack. Packs submitted on the same day with the same model and settings are merged into one run.
Be honest about the settings: results are only comparable when access, interface, thinking and tools match.
Issue bodies are limited to about 65,000 characters, so long Arena builds may need their own issue.
