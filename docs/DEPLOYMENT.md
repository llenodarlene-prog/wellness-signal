# Deployment

Branch flow: `feature/*` → pull request to `staging` → review the noindex staging site → release pull request from `staging` to `main`.

## GitHub Environments

Create `staging` and `production` environments. Require a reviewer for production.

## Required Secrets

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_ROOT`
- `DEPLOY_SSH_KEY`
- `SSH_KNOWN_HOSTS`

Optional: `DEPLOY_PORT`.

## Variables

Set `SITE_URL=https://wellsignal.org`. If staging is a folder under the production root, set `DEPLOY_PRESERVE_DIR` on production so rsync does not delete it.

## Manual GitHub Settings

Protect `staging` and `main`, require pull requests and the repository QA check, and block direct pushes.
