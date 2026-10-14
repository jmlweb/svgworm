---
id: LRN-034
title: gh secret set without --body stores an empty value outside a terminal
status: active
tags: [github, secrets, cli]
task: TSK-036
created: 2026-10-14
---

Context: running gh secret set NAME through a non-interactive shell (Claude Code's ! prefix).
Insight: gh prompts for the value on stdin only in a TTY. Without one, the command exits 0 with no output and the secret is saved as an empty value. gh secret list shows the name and date, which looks correct.
Application: check gh secret list for the date, then set the value explicitly. Use --body for non-sensitive values only (for example an account ID). Put tokens in a real terminal, never with --body, since the value would end up in shell history and in this conversation.
