export const MORALIS_CHAIN_MAP: Record<number, string> = {
  1: "eth",
  11155111: "sepolia",
  42161: "arbitrum",
  10: "optimism",
  100: "gnosis",
  84532: "base sepolia",
  10200: "gnosis testnet",
};

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  11155111: "Sepolia",
  42161: "Arbitrum",
  10: "Optimism",
  100: "Gnosis",
  84532: "Base Sepolia",
  10200: "Gnosis Chiado",
};

export const GAS_CONSTANTS = {
  STANDARD_TRANSFER_GAS: BigInt(21000),
  ERC20_TRANSFER_GAS: BigInt(65000),
  BUFFER_PERCENT: BigInt(10),
  MINIMUM_BUFFER_NATIVE_TOKEN: "0.002",
  FALLBACK_RESERVE_NATIVE_TOKEN: "0.01",
  NATIVE_TOKEN_DECIMALS: 18,
} as const;

export const BIGINT_ZERO = BigInt(0);

export const PERCENTAGE_OPTIONS = [25, 50, 75, 100] as const;
