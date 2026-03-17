#!/usr/bin/env bash

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
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Building: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if (cd "$name" && pnpm i --no-frozen-lockfile && pnpm run build); then
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
echo "  All examples built successfully."
exit 0
