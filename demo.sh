#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "================================================"
echo "  Softlend — Demo Script"
echo "================================================"
echo ""

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
(cd backend && npm install --silent) 2>/dev/null
(cd rule-engine && pip3 install -q -r requirements.txt) 2>/dev/null
echo "  Done."

# 2. Seed database
echo "[2/4] Seeding database with sample data..."
(cd backend && node src/config/seed.js)
echo "  Done."

# 3. Start backend
echo "[3/4] Starting backend API on http://localhost:3000 ..."
(cd backend && node src/app.js) &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# 4. Start rule engine
echo "[4/4] Starting rule engine on http://localhost:8000 ..."
(cd rule-engine && uvicorn src.api.server:app --host 0.0.0.0 --port 8000 --log-level warning) &
ENGINE_PID=$!
echo "  Engine PID: $ENGINE_PID"

echo ""
echo "================================================"
echo "  Services Running"
echo "================================================"
echo ""
echo "  Backend API:   http://localhost:3000"
echo "  Swagger Docs:  http://localhost:3000/api/docs"
echo "  Rule Engine:   http://localhost:8000"
echo "  Engine Docs:   http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "================================================"

trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $ENGINE_PID 2>/dev/null; exit 0" INT TERM
wait
