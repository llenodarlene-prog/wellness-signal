#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?missing DEPLOY_HOST}"
: "${DEPLOY_USER:?missing DEPLOY_USER}"
: "${DEPLOY_ROOT:?missing DEPLOY_ROOT}"
: "${DEPLOY_SSH_KEY:?missing DEPLOY_SSH_KEY}"
: "${SSH_KNOWN_HOSTS:?missing SSH_KNOWN_HOSTS}"
PORT="${DEPLOY_PORT:-22}"
PRESERVE="${DEPLOY_PRESERVE_DIR:-}"
[[ "$PORT" =~ ^[0-9]+$ ]] || { echo "Invalid DEPLOY_PORT"; exit 1; }
[[ "$DEPLOY_ROOT" = /* && "$DEPLOY_ROOT" != "/" ]] || { echo "Unsafe DEPLOY_ROOT"; exit 1; }
if [[ -n "$PRESERVE" ]]; then [[ "$PRESERVE" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "Unsafe preserve dir"; exit 1; }; fi
KEY_FILE="$(mktemp)"; KH_FILE="$(mktemp)"; trap 'rm -f "$KEY_FILE" "$KH_FILE"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$KEY_FILE"; chmod 600 "$KEY_FILE"; printf '%s\n' "$SSH_KNOWN_HOSTS" > "$KH_FILE"
SSH=(ssh -p "$PORT" -i "$KEY_FILE" -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KH_FILE")
RSYNC_RSH="${SSH[*]}"
EXCLUDE=(); if [[ -n "$PRESERVE" ]]; then EXCLUDE=(--exclude "$PRESERVE/"); fi
rsync -az --delete "${EXCLUDE[@]}" -e "$RSYNC_RSH" dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_ROOT/"
