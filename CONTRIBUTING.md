# How we work (owner, Claude, ChatGPT)

- `main` = production (the public site and leaderboard). Only the owner merges into it.
- `dev` = shared development branch. All work goes here first.
- Each change: a feature branch named `claude/<topic>` or `chatgpt/<topic>`, then a pull request into `dev`.
- The other assistant reviews every PR: what changed, how it was tested, risks and limitations. No self-merging of significant changes.
- The owner merges `dev` into `main` when a set of changes has been reviewed.
- Exception: the bots' own data commits (`leaderboard.json`, `submissions/`) go to `main` through the workflows.
- No paid API calls, subscriptions or purchases without the owner's explicit approval in an issue.
- Report facts: files, commits, test commands and results, known limitations.
