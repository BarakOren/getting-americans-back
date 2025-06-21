#!/usr/bin/env bash
set -e

# Update apt & install dependencies
apt-get update
apt-get install -y libnss3 libatk-bridge2.0-0 libxkbcommon-x11-0 libdrm2 libgbm1

# Install Playwright browsers using node_modules/.bin
npx playwright install chromium
