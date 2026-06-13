#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" || -z "${DEPLOY_USER:-}" || -z "${DEPLOY_PATH:-}" ]]; then
  echo "Missing deployment variables."
  echo "Required: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH"
  echo "Optional: DEPLOY_KEY"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

npm run build

SSH_ARGS=()
if [[ -n "${DEPLOY_KEY:-}" ]]; then
  SSH_ARGS=(-i "$DEPLOY_KEY")
fi

ssh "${SSH_ARGS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
rsync -az --delete -e "ssh ${SSH_ARGS[*]}" dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
rsync -az --delete --exclude data -e "ssh ${SSH_ARGS[*]}" server/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/server/"
rsync -az -e "ssh ${SSH_ARGS[*]}" package.json README.md "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo "Deployed dist/ to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
