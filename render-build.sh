#!/usr/bin/env bash
set -e

# 1. Install elan & Lean 4 if not already installed
if [ ! -f "$HOME/.elan/bin/lake" ]; then
  echo "==> Installing elan and Lean 4..."
  curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain leanprover/lean4:v4.16.0
fi

export PATH="$HOME/.elan/bin:$PATH"

# 2. Build Lean 4 library
echo "==> Building Lean 4 library..."
cd lean
lake build
cd ..

# 3. Build Client
echo "==> Building frontend client..."
cd client
npm install
npm run build
cd ..

# 4. Build Server
echo "==> Building backend server..."
cd server
npm install
npm run build
cd ..

echo "==> ProofQuest build complete!"
