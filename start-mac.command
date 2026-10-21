#!/bin/bash
cd "$(dirname "$0")"
clear
echo ""
echo "  Starting ITEMO..."
echo ""
if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js is not installed."
  echo "  Install the LTS version from https://nodejs.org then run this again."
  echo ""
  read -p "  Press enter to close."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "  First run — installing. This takes a few minutes. Please wait."
  echo ""
  npm install --no-audit --no-fund || { echo "  Install failed."; read -p "  Press enter to close."; exit 1; }
fi
npm run demo
read -p "  Press enter to close."
