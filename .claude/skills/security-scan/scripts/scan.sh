#!/usr/bin/env bash
# Fast first-pass security/standards check for this repo. Not a
# replacement for a real SAST or secret scanner. Usage: scan.sh [path]
set -uo pipefail

TARGET="${1:-.}"
FOUND=0
EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
          --exclude-dir=.curate-cache --exclude-dir=.workout-program-cache
          --exclude=package-lock.json)

echo "== Secret-like patterns =="
if grep -rnE \
  -e '(api[_-]?key|secret|password|token)\s*[=:]\s*["'"'"'][A-Za-z0-9_\-]{12,}["'"'"']' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
  --include='*.env*' --include='*.json' --include='*.yaml' --include='*.yml' \
  "${EXCLUDES[@]}" \
  -I "$TARGET" 2>/dev/null; then
  echo "^ review the above — possible hardcoded secret"
  FOUND=1
else
  echo "none found"
fi

echo
echo "== npm audit =="
(cd "$TARGET" && npm audit --audit-level=high) || FOUND=1

echo
echo "== Unsafe frontend patterns =="
grep -rn --include='*.tsx' --include='*.ts' "${EXCLUDES[@]}" -E 'dangerouslySetInnerHTML' "$TARGET" 2>/dev/null && FOUND=1
grep -rn --include='*.tsx' --include='*.ts' "${EXCLUDES[@]}" -E '\beval\(' "$TARGET" 2>/dev/null && FOUND=1

if [ "$FOUND" -eq 0 ]; then
  echo "CLEAN"
else
  echo
  echo "Review findings above before committing."
fi
