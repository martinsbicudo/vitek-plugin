#!/usr/bin/env bash

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
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Building: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if (pnpm i --dir "$SCRIPT_DIR/$name" --ignore-workspace --no-frozen-lockfile && [ -d "$SCRIPT_DIR/$name/node_modules" ] && pnpm run --dir "$SCRIPT_DIR/$name" build); then
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
echo "  All showcases built successfully."
exit 0
