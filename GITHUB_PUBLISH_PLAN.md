# GitHub Publish Plan

## Current State

- No Git remote is configured in this workspace.
- GitHub CLI is not installed on this machine.
- The project has many local changes and new files that should be reviewed before publishing.
- `.gitignore` excludes local databases, environment files, Node dependencies, upload folders, caches, and logs.

## Recommended Repository

Create a private repository first:

```text
etherealai-local
```

Recommended visibility:

```text
private
```

## Do Not Publish

Keep these out of GitHub:

- `database.sqlite`
- `.env` and `.env.*`
- `node_modules/`
- `.aider*`
- `.parcel-cache/`
- `market-data-uploads/`
- local API keys, private keys, mnemonics, wallet files, exchange secrets, and social account tokens

## Manual GitHub Setup

After creating the private GitHub repo, add the remote:

```bash
git remote add origin git@github.com:<owner>/etherealai-local.git
```

Or with HTTPS:

```bash
git remote add origin https://github.com/<owner>/etherealai-local.git
```

Then verify:

```bash
git remote -v
git status --short
```

## Suggested First Push

After owner review:

```bash
git add .
git status --short
git commit -m "feat: build EtherealAI local MVP and multi-agent coordination"
git push -u origin master
```

## Safer Alternative

If the owner wants a review bundle before the first push:

```bash
git bundle create etherealai-local-review.bundle --all
```

That creates a local bundle that can be inspected before publishing to GitHub.

## Safety Reminder

Publishing to GitHub is externally visible. Do not push until the owner confirms:

- GitHub account or organization
- repository name
- public vs private visibility
- whether `ONBOARD_MEMORY.md`, `MVP_OWNER_TEST_PASS.md`, and other owner-specific docs should be included
