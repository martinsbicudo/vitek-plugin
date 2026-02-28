#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"
pnpm run build
pnpm pack
TARBALL=$(ls vitek-plugin-*.tgz 2>/dev/null | head -1)
if [ -z "$TARBALL" ]; then
  echo "Error: pnpm pack did not produce a tarball" >&2
  exit 1
fi
mv "$TARBALL" "$SCRIPT_DIR/"
echo "Created $SCRIPT_DIR/$TARBALL"
