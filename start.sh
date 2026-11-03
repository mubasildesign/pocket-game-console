#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${1:-8091}"
echo ""
echo "  Pocket Grid"
echo "  Open: http://localhost:${PORT}"
echo "  Press Ctrl+C to stop"
echo ""
exec python3 -m http.server "$PORT"
