# Wellness Signal Repository Rules

- Work on a feature branch.
- Never push directly to `staging` or `main`.
- Run `npm run verify` before opening a pull request.
- Run `npm run release:check` before production.
- Staging must remain noindex.
- Production builds must never deploy into the staging document root.
- Do not commit credentials, SSH keys, tokens, or private source exports.
- Do not mark `launch_status` ready until the site, content, legal pages, and production configuration have been reviewed.
