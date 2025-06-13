/**
 * Interface for EAS schema configuration
 */
export interface EASSchemaConfig {
  interface: Record<string, string>;
  rawString: string;
}

/**
 * Interface for EAS chain configuration
 */
export interface EASChainConfig {
  chain: string;
  deploymentBlock: number;
  rpcUrl: string;
  easContractAddress: string;
  schemaUID: string;
}

/**
 * Interface for version-specific EAS configuration
 */
export interface EASVersionConfig {
  schema: EASSchemaConfig;
  chains: Record<string, EASChainConfig>;
}

/**
 * Complete EAS configuration with version support
 */
export interface EASConfig {
  [version: string]: EASVersionConfig;
}

export const EAS_CONFIG: EASConfig = {
  'v0.1': {
    schema: {
      interface: {
        eventTimestamp: 'uint256',
        srs: 'string',
        locationType: 'string',
        location: 'string',
        recipeType: 'string[]',
        recipePayload: 'bytes[]',
        mediaType: 'string[]',
        mediaData: 'string[]',
        memo: 'string',
      },
      rawString:
        'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo',
    },
    chains: {
      '42220': {
        chain: 'celo',
        deploymentBlock: 26901063,
        rpcUrl: 'https://celo-mainnet.infura.io/v3/',
        easContractAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '42161': {
        chain: 'arbitrum',
        deploymentBlock: 243446573,
        rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/',
        easContractAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '11155111': {
        chain: 'sepolia',
        deploymentBlock: 6269763,
        rpcUrl: 'https://sepolia.infura.io/v3/',
        easContractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '8453': {
        chain: 'base',
        deploymentBlock: 25903221,
        rpcUrl: 'https://base-mainnet.infura.io/v3/',
        easContractAddress: '0x4200000000000000000000000000000000000021',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
    },
  },
};
