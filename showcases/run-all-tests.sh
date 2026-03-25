#!/usr/bin/env bash

# Run tests in all showcases.
# Builds first if dist/ does not exist. Use showcases/build-and-test.sh for full build + test cycle.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SHOWCASES=(ops-board stock-pulse)
PASSED=0
FAILED=0
FAILED_NAMES=()

for name in "${SHOWCASES[@]}"; do
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
  echo "  Failed showcases: ${FAILED_NAMES[*]}"
  exit 1
fi
echo "  All showcase tests passed."
exit 0
