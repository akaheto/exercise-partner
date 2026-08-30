#!/usr/bin/env bash
# Runs the project's quality gate, stopping at the first failure.
# Usage: audit.sh [unit|e2e|all]   (default: unit — lint, typecheck, test)
set -uo pipefail

SCOPE="${1:-unit}"
REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$REPO_ROOT"

run_stage() {
  local name="$1"; shift
  echo "== ${name} =="
  if ! "$@"; then
    echo "FAIL: ${name}"
    exit 1
  fi
}

run_stage "lint"      npm run lint
run_stage "typecheck" npm run typecheck
run_stage "test"      npm test

if [ "$SCOPE" = "e2e" ] || [ "$SCOPE" = "all" ]; then
  run_stage "test:e2e" npm run test:e2e
fi

echo "ALL CLEAN"
