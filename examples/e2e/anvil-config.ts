// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Anvil fork configuration for E2E testing.
 *
 * This configuration provides access to a local Anvil fork of Sepolia
 * with real EAS contracts and pre-funded test accounts.
 */

/**
 * Anvil test account with pre-funded ETH.
 */
export interface AnvilAccount {
  readonly address: `0x${string}`;
  readonly privateKey: `0x${string}`;
}

/**
 * Configuration for the local Anvil fork.
 */
export interface AnvilConfig {
  /** Local RPC URL */
  readonly rpcUrl: string;
  /** Chain ID (31337 for Anvil) */
  readonly chainId: number;
  /** Pre-funded test accounts (10000 ETH each) */
  readonly accounts: readonly AnvilAccount[];
  /** EAS contract address (forked from Sepolia) */
  readonly eas: `0x${string}`;
  /** SchemaRegistry contract address (forked from Sepolia) */
  readonly schemaRegistry: `0x${string}`;
}

/**
 * Anvil's default pre-funded accounts.
 * Each account has 10000 ETH.
 * These are deterministic and the same for every Anvil instance.
 */
const ANVIL_ACCOUNTS: readonly AnvilAccount[] = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  },
] as const;

/**
 * Sepolia EAS contract addresses.
 * These are the real deployed contracts that get forked.
 */
const SEPOLIA_EAS_ADDRESSES = {
  eas: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e' as const,
  schemaRegistry: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0' as const,
};

/**
 * Default Anvil configuration for E2E testing.
 */
export const ANVIL_CONFIG: AnvilConfig = {
  rpcUrl: 'http://127.0.0.1:8545',
  chainId: 31337,
  accounts: ANVIL_ACCOUNTS,
  eas: SEPOLIA_EAS_ADDRESSES.eas,
  schemaRegistry: SEPOLIA_EAS_ADDRESSES.schemaRegistry,
};

/**
 * Get the primary test account (first Anvil account).
 */
export function getPrimaryAccount(): AnvilAccount {
  return ANVIL_CONFIG.accounts[0];
}

/**
 * Get a test account by index.
 * @param index - Account index (0-4)
 */
export function getAccount(index: number): AnvilAccount {
  if (index < 0 || index >= ANVIL_CONFIG.accounts.length) {
    throw new Error(
      `Invalid account index: ${index}. Valid range: 0-${ANVIL_CONFIG.accounts.length - 1}`
    );
  }
  return ANVIL_CONFIG.accounts[index];
}
