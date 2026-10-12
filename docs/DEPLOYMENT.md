# Deployment

Wellness Signal follows the same protected branch flow as the other portfolio sites:

1. Work on `feature/*`.
2. Open a pull request into `staging`.
3. Staging builds are noindex and may deploy only to a document root ending in `/staging`.
4. Review staging.
5. Open a release pull request from `staging` into `main`.
6. Production requires `data/site.json` to have `"launch_status": "ready"`.
7. Production deploys preserve the top-level `staging` directory.

Required environment secrets:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_ROOT`
- `DEPLOY_SSH_KEY`
- `SSH_KNOWN_HOSTS`

Required environment variables:
- `DEPLOY_PORT`
- `SITE_URL`
- `SITE_NAME`

Recommended production protection:
- Required reviewer: repository owner
