#!/bin/bash
set -e

echo ""
echo "  Possible Futures - Setup"
echo "  =============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  Node.js not found."
  echo "  Install it: https://nodejs.org or use nvm: https://github.com/nvm-sh/nvm"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "  Node.js $NODE_VERSION detected. Version 22+ required."
  if command -v nvm &> /dev/null; then
    echo "  Run: nvm install 22 && nvm use 22"
  elif [ -f "$HOME/.nvm/nvm.sh" ]; then
    echo "  Run: source ~/.nvm/nvm.sh && nvm install 22 && nvm use 22"
  fi
  exit 1
fi
echo "  Node.js $(node -v) OK"

# Install dependencies
echo ""
echo "  Installing dependencies..."
npm install --silent

# Create .env.local if missing
if [ ! -f .env.local ]; then
  echo ""
  echo "  Creating .env.local..."
  cp .env.local.example .env.local
  echo "  Created .env.local from template"
  echo "  Edit it to set your ANTHROPIC_API_KEY"
else
  echo ""
  echo "  .env.local already exists, skipping"
fi

# Done
echo ""
echo "  =============================="
echo "  Setup complete!"
echo ""
echo "  Start the app:"
echo "    npm run dev"
echo ""
echo "  Then open http://localhost:3000 and follow the first-run intake."
echo "  Five short chapters, about ten minutes. The intake generates your"
echo "  Book, Compass, and Playbook."
echo ""
echo "  To use AI features, either:"
echo "    1. Add your ANTHROPIC_API_KEY to .env.local (API mode)"
echo "    2. Switch to CLI mode in Settings (uses Claude Max/Pro subscription)"
echo ""
echo "  Already have existing markdown files? Run 'npm run seed' to migrate"
echo "  them into the database instead of using the in-app intake."
echo ""
