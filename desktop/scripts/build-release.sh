#!/usr/bin/env bash
# Git Bash / MSYS entrypoint; keep all packaging logic in one Windows script.
set -euo pipefail
if ! command -v powershell.exe >/dev/null 2>&1; then
  echo 'Windows is required. See desktop/build-windows.md.' >&2
  exit 1
fi
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$SCRIPT_DIR/build-release.ps1")"
