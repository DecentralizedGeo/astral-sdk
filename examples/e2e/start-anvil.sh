#!/bin/bash
# E2E Testing: Start Anvil fork of Sepolia
# This provides a local fork with real EAS contracts and unlimited ETH

set -e

# Load environment variables
if [ -f .env ]; then
  source .env
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
  echo "Error: SEPOLIA_RPC_URL not set"
  echo "Please set it in .env or export it:"
  echo "  export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY"
  exit 1
fi

echo "Starting Anvil fork of Sepolia..."
echo "RPC URL: $SEPOLIA_RPC_URL"
echo ""
echo "EAS Contracts (forked from Sepolia):"
echo "  EAS:            0xC2679fBD37d54388Ce493F1DB75320D236e1815e"
echo "  SchemaRegistry: 0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"
echo ""
echo "Default accounts have 10000 ETH each"
echo "Press Ctrl+C to stop"
echo ""

anvil \
  --fork-url "$SEPOLIA_RPC_URL" \
  --chain-id 31337 \
  --block-time 1 \
  --host 127.0.0.1 \
  --port 8545
