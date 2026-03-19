#!/bin/bash

echo "🚀 Starting INTACSEP DEV (frontend + api)"

FRONTEND_NAME="intacsep-dev"
BACKEND_NAME="intacsep-api-dev"

FRONTEND_PORT=3001
BACKEND_PORT=3002

# Go to project root (safe execution)
cd "$(dirname "$0")"

# -------------------------
# 🧹 Clean old processes
# -------------------------
echo "🧹 Cleaning old PM2 processes..."

pm2 delete $FRONTEND_NAME 2>/dev/null
pm2 delete $BACKEND_NAME 2>/dev/null

# -------------------------
# 🎨 Start Frontend (Vite)
# -------------------------
echo "🎨 Starting frontend..."

cd client

pm2 start npm \
  --name $FRONTEND_NAME \
  -- run dev -- --host 0.0.0.0 --port $FRONTEND_PORT

cd ..

# -------------------------
# ⚙️ Start Backend (Node)
# -------------------------
echo "⚙️ Starting backend..."

cd server

export PORT=$BACKEND_PORT

pm2 start npm \
  --name $BACKEND_NAME \
  -- run dev

cd ..

# -------------------------
# 💾 Save PM2 state
# -------------------------
pm2 save

# -------------------------
# 📊 Status
# -------------------------
echo "✅ INTACSEP DEV running:"
pm2 list
