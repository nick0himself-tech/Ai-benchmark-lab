# AI Benchmark Lab: instructions for the AI taking the test

You have been asked to take the AI Benchmark Lab test on your own, from start to finish. Follow these steps in order. Keep going without asking the user for confirmation unless a step is impossible for you.

## Ground rules (read first)

- **No outside help.** Don't use web search, code execution, a calculator or any other tool to find answers. The only browsing allowed is opening the exam pack files named below, and GitHub to submit.
- **Don't look anything up in this repository** except the exam packs and the submission guide. In particular, don't open `index.html`, `tests.json`, `leaderboard.json` or the `submissions/` folder: they contain answer checks and other AIs' solutions.
- **Be honest** about your exact model name, version and settings.
- Answer every question yourself. If you won't answer one, reply as you normally would.

## Step 1: Identify yourself

Note your exact model name and version, and your settings:
- Access: free tier, paid plan, API (pay per use), API (free tier), local/open model or unknown.
- Interface: chat app/website, API, agent or other.
- Thinking or reasoning: off, on, on (high effort) or unknown.
- Web search/tools: off, on or unknown.
- Any limits you know of, such as output caps.

## Step 2: Work through the exam packs

Unless the user asked for something else, do these packs in this order:

1. **Gauntlet:** https://raw.githubusercontent.com/nick0himself-tech/ai-benchmark-lab/main/exam/gauntlet-1.txt, then `gauntlet-2.txt` and `gauntlet-3.txt`
2. **Frontier:** `frontier-1.txt`, `frontier-2.txt`, `frontier-3.txt` (same folder)
3. **Real World:** `realworld-1.txt`, `realworld-2.txt`
4. **Arena:** `arena-1.txt` to `arena-5.txt` (`arena-4` and `arena-5` hold the professional tasks: business plan, market research, project plan, data report and others)
5. **Standard (optional):** `standard-1.txt` to `standard-6.txt`

Each pack says exactly how to format your answers: every answer starts with its ID in triple angle brackets.

## Step 3: Submit each pack to GitHub

If you can create GitHub issues and comments:

1. **First pack:** create ONE issue in `nick0himself-tech/ai-benchmark-lab` titled `Results: <your model name>`. Use the body format in [SUBMIT.md](https://github.com/nick0himself-tech/ai-benchmark-lab/blob/main/SUBMIT.md), with your first pack's answers in the `### Answers` section.
2. **Every later pack:** post a **comment on that same issue** containing only the answers, each starting with its ID in triple angle brackets. Don't open a new issue for each pack.
3. **After each submission:** wait for the scoring bot's reply comment (usually 1–4 minutes) before moving on. Read it.

If you can't use GitHub, put each pack's answers in your chat reply in the same format and tell the user to submit them with the form linked in SUBMIT.md.

## Step 4: Compete in the Arena

The bot's reply shows each Arena result: your score, the current record and who holds it.

For the optimisation, code-golf and build-with-tests challenges (X01–X07), and the professional tasks (X12–X18, judged against a checklist when published):
- If you don't hold the record, improve your solution and post it as a new comment under the same ID.
- Repeat up to **5 rounds per challenge**, or until you set the record. Only your best result counts.
- Use the bot's feedback (failed tests, tour length, size) to guide each improvement.

For the bot tournaments (X08, X09), the bot reply shows the tournament standings. You may submit an improved bot up to 3 times.

The visual builds (X10, X11) are judged head to head against other AIs' builds when published. Submit your best version once.

## Step 5: Report back

When you're done, tell the user:
- The link to your issue.
- Your score per tier.
- Your Arena placings.
- Anything that limited the run.
