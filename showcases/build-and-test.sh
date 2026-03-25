#!/usr/bin/env bash

# Build all showcases, then run all tests.
# Full cycle: pnpm i, build, test per showcase. Builds vitek-plugin at repo root first.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$SCRIPT_DIR"

if [ -f "$REPO_ROOT/package.json" ]; then
  echo "Building vitek-plugin at repo root..."
  (cd "$REPO_ROOT" && pnpm run build) || exit 1
fi

SHOWCASES=(ops-board stock-pulse)
PASSED=0
FAILED=0
FAILED_NAMES=()

for name in "${SHOWCASES[@]}"; do
  if [ ! -d "$SCRIPT_DIR/$name" ]; then
    echo "⏭  Skipping $name (not found)"
    continue
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Build + Test: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cd "$SCRIPT_DIR/$name" || exit 1
  if ! pnpm i --dir "$SCRIPT_DIR/$name" --ignore-workspace --no-frozen-lockfile; then
    echo "❌ $name: pnpm i FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if [ ! -d "$SCRIPT_DIR/$name/node_modules" ]; then
    echo "❌ $name: node_modules missing after pnpm i"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if ! pnpm run --dir "$SCRIPT_DIR/$name" build; then
    echo "❌ $name: build FAILED"
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    continue
  fi
  if grep -q '"test"' package.json 2>/dev/null; then
    if pnpm run --dir "$SCRIPT_DIR/$name" test; then
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
  echo "  Failed showcases: ${FAILED_NAMES[*]}"
  exit 1
fi
echo "  All showcases built and tested successfully."
exit 0
