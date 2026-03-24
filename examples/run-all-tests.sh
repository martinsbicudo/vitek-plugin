#!/usr/bin/env bash

# Run tests in all examples.
# Builds first if dist/ does not exist. Use examples:build-and-test.sh for full build + test cycle.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

EXAMPLES=(basic-js js-react typescript-react import-external socket-only api-docs prisma docker rate-limit validation-only error-handling cors minimal-ts observability issue-dispatch platform-doctor platform-events platform-generate platform-schedule build-api-false alias vite6-minimal mcp-project)
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
  if ! pnpm i --dir "$SCRIPT_DIR/$name" --ignore-workspace --no-frozen-lockfile; then
    echo "❌ $name: pnpm i FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if [ ! -d "$SCRIPT_DIR/$name/dist" ]; then
    if ! pnpm run --dir "$SCRIPT_DIR/$name" build; then
      echo "❌ $name: build FAILED"
      FAILED=$((FAILED + 1))
      FAILED_NAMES+=("$name")
      continue
    fi
  fi
  if pnpm run --dir "$SCRIPT_DIR/$name" test; then
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
