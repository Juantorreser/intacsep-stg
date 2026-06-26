#!/bin/bash

echo "🚀 Starting INTACSEP DEV (frontend + api)"

FRONTEND_NAME="intacsep-dev"
BACKEND_NAME="intacsep-api-dev"

FRONTEND_PORT=3001
BACKEND_PORT=3002

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# -------------------------
# 🧹 Clean old processes
# -------------------------
echo "🧹 Cleaning old PM2 processes..."
pm2 delete $FRONTEND_NAME 2>/dev/null
pm2 delete $BACKEND_NAME 2>/dev/null

# -------------------------
# 🎨 Start Frontend (Vite)
# -------------------------
echo "🎨 Starting frontend ($FRONTEND_NAME) on port $FRONTEND_PORT..."
pm2 start npm \
  --name $FRONTEND_NAME \
  --cwd "$SCRIPT_DIR/client" \
  -- run dev -- --host 0.0.0.0 --port $FRONTEND_PORT

# -------------------------
# ⚙️ Start Backend (Node)
# -------------------------
echo "⚙️ Starting backend ($BACKEND_NAME) on port $BACKEND_PORT..."
PORT=$BACKEND_PORT pm2 start npm \
  --name $BACKEND_NAME \
  --cwd "$SCRIPT_DIR/server" \
  -- run dev

# -------------------------
# 💾 Save PM2 state
# -------------------------
pm2 save

# -------------------------
# 📊 Status
# -------------------------
echo "✅ INTACSEP DEV running:"
pm2 list
echo ""
echo "  intacsep-dev      -> https://intacsep-dev.spotynet.com     (localhost:$FRONTEND_PORT)"
echo "  intacsep-api-dev  -> https://intacsep-api-dev.spotynet.com (localhost:$BACKEND_PORT)"
