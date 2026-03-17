#!/usr/bin/env bash

# Run tests in all examples.
# Builds first if dist/ does not exist. Use examples:build-and-test.sh for full build + test cycle.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

EXAMPLES=(basic-js js-react typescript-react import-external socket-only api-docs prisma docker rate-limit validation-only error-handling cors minimal-ts build-api-false alias vite6-minimal)
PASSED=0
FAILED=0
FAILED_NAMES=()

for name in "${EXAMPLES[@]}"; do
  if [ ! -d "$name" ]; then
    echo "⏭  Skipping $name (not found)"
    continue
  fi
  if [ ! -f "$name/package.json" ] || ! grep -q '"test"' "$name/package.json" 2>/dev/null; then
    echo "⏭  Skipping $name (no test script)"
    continue
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Testing: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  (cd "$name" && [ ! -d dist ] && pnpm i --no-frozen-lockfile && pnpm run build) || true
  if (cd "$name" && pnpm test); then
    echo "✅ $name: OK"
    PASSED=$((PASSED + 1))
  else
    echo "❌ $name: FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
if [ $FAILED -gt 0 ]; then
  echo "  Failed examples: ${FAILED_NAMES[*]}"
  exit 1
fi
echo "  All example tests passed."
exit 0
