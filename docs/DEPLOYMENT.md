# Deployment

Wellness Signal uses the same protected branch and deployment model as the other portfolio sites.

## Branch flow

1. Work on `feature/*`.
2. Open a pull request into `staging`.
3. Repository checks must pass.
4. Staging builds are noindex and deployment is refused unless the configured document root ends in `/staging`.
5. Review staging.
6. Open a release pull request from `staging` into `main`.
7. Production requires `data/site.json` to have `"launch_status": "ready"`.
8. Production preserves the top-level `staging` directory and runs a live smoke test.
9. Configure the GitHub `production` environment with a required reviewer.

## Scheduled publishing

`.github/workflows/scheduled-publish.yml` runs at 00:07 UTC each day. It checks approved content on `main` and only calls the protected production workflow when a post's `published: YYYY-MM-DD` date matches that UTC day.

The scheduler does not bypass the production release gate or environment approval.

## Required environment secrets

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_ROOT`
- `DEPLOY_SSH_KEY`
- `SSH_KNOWN_HOSTS`

## Required environment variables

- `DEPLOY_PORT`
- `SITE_URL`
- `SITE_NAME`

## Rollback

Use **Actions → Roll back deployment** with an exact known-good 40-character commit SHA. The selected staging or production environment supplies its own protected secrets and variables.
