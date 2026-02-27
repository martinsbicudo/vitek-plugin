#!/usr/bin/env bash

# Build all examples, then run all tests.
# Full cycle: pnpm i, build, test per example.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

EXAMPLES=(basic-js js-react typescript-react import-external socket-only api-docs prisma docker)
PASSED=0
FAILED=0
FAILED_NAMES=()

for name in "${EXAMPLES[@]}"; do
  if [ ! -d "$SCRIPT_DIR/$name" ]; then
    echo "⏭  Skipping $name (not found)"
    continue
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Build + Test: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cd "$SCRIPT_DIR/$name" || exit 1
  if ! pnpm i --no-frozen-lockfile; then
    echo "❌ $name: pnpm i FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if ! pnpm run build; then
    echo "❌ $name: build FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if grep -q '"test"' package.json 2>/dev/null; then
    if pnpm test; then
      echo "✅ $name: Build + Test OK"
    else
      echo "❌ $name: test FAILED"
      FAILED=$((FAILED + 1))
      FAILED_NAMES+=("$name")
      continue
    fi
  else
    echo "✅ $name: Build OK (no tests)"
  fi
  PASSED=$((PASSED + 1))
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
echo "  All examples built and tested successfully."
exit 0
