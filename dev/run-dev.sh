#!/usr/bin/env bash
# Dev helper: build the web-terminal dynamic module from a built-on-envoy checkout
# and run Envoy's dev channel with it on :10000, so `npm run dev` (which proxies
# /ws to :10000) drives a real in-Envoy WebSocket terminal.
#
# The L4 network filter uses the newer dynamic-modules ABI, which only the Envoy
# "dev" binary provides (func-e downloads it under ~/.local/share/boe).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
# web-terminal extension source; override if your checkout lives elsewhere.
EXT="${WEB_TERMINAL_EXT:-$HOME/built-on-envoy/extensions/web-terminal}"
ENVOY="$HOME/.local/share/boe/envoy-versions/dev/bin/envoy"
[ -d "$EXT" ]   || { echo "extension not found at $EXT (set WEB_TERMINAL_EXT)" >&2; exit 1; }
[ -x "$ENVOY" ] || { echo "Envoy dev not found at $ENVOY (run 'boe run' once to download it)" >&2; exit 1; }
# Build the c-shared module into the extension dir; Envoy resolves the module
# named "web-terminal" to libweb-terminal.so via the search path below.
CGO_ENABLED=1 go -C "$EXT" build -buildmode=c-shared -o "$EXT/libweb-terminal.so" ./main
# cgocheck=0 is required to run Go dynamic modules under Envoy.
exec env ENVOY_DYNAMIC_MODULES_SEARCH_PATH="$EXT" GODEBUG=cgocheck=0 \
  "$ENVOY" --config-path "$HERE/dev-bootstrap.yaml" --use-dynamic-base-id
