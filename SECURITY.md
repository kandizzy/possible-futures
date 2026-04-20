# Security Policy

Possible Futures is a **local-first desktop-style web app** with a narrow threat surface. There is no hosted backend, no telemetry, no user accounts, and no network-exposed attack surface beyond the Anthropic API client. Your SQLite database and markdown files live on your own laptop.

## Supported versions

Only the current `main` branch is supported. No backports.

## Reporting a vulnerability

Please report security issues **privately** by opening a [GitHub security advisory](https://github.com/kandizzy/possible-futures/security/advisories/new). This lets us discuss the issue without publishing details, and keeps everything inside GitHub's secure disclosure flow.

Please do **not** open a public issue for security reports.

## What to expect

I'll acknowledge your report within 7 days. If the issue is reproducible and in scope, I'll follow up with either a fix plan, a timeline, or an explanation of why it's out of scope. Severe issues (remote exploitation, credential leakage) are triaged within 48 hours.

## In scope

- Bugs that would let someone read, modify, or exfiltrate your local database or markdown files via the app itself.
- Flaws in the Claude API client that could leak your API key, prompt content, or role data to an unintended destination.
- Cross-site scripting, HTML injection, or prompt-injection vectors in the local dev server that an attacker on your local network could reach.

## Out of scope

- Attacks requiring local filesystem access to your laptop. If an attacker is already on your machine, the app isn't the weakest link.
- Issues with the Anthropic API itself — report those to [Anthropic](https://www.anthropic.com/).
- Social engineering, phishing, or attacks that require tricking you into running malicious code.
- Denial-of-service against a single-user local app (not meaningful in this threat model).

## Recognition

This project is free software built by one person. There is no bounty program. If your report leads to a fix, I'll credit you in the commit message and release notes — please tell me how you'd like to be credited (name, handle, or anonymous).
