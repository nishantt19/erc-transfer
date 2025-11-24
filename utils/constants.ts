import { sepolia, mainnet, gnosis, base, baseSepolia } from "viem/chains";

type ChainConfig = {
  NAME: string;
  MORALIS_ID: string;
  ALCHEMY_SLUG: string;
  LOGO: string;
};

export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  [mainnet.id]: {
    NAME: "Ethereum",
    MORALIS_ID: "eth",
    ALCHEMY_SLUG: "eth-mainnet",
    LOGO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
  [sepolia.id]: {
    NAME: "Sepolia",
    MORALIS_ID: "sepolia",
    ALCHEMY_SLUG: "eth-sepolia",
    LOGO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
  [gnosis.id]: {
    NAME: "Gnosis",
    MORALIS_ID: "gnosis",
    ALCHEMY_SLUG: "gnosis-mainnet",
    LOGO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png",
  },
  [base.id]: {
    NAME: "Base",
    MORALIS_ID: "base",
    ALCHEMY_SLUG: "base-mainnet",
    LOGO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  },
  [baseSepolia.id]: {
    NAME: "Base Sepolia",
    MORALIS_ID: "base sepolia",
    ALCHEMY_SLUG: "base-sepolia",
    LOGO: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  },
} as const;

export const GAS_CONSTANTS = {
  STANDARD_TRANSFER_GAS: BigInt(21000),
  ERC20_TRANSFER_GAS: BigInt(65000),
  BUFFER_PERCENT: BigInt(3),
  MINIMUM_BUFFER_NATIVE_TOKEN: "0.0001",
  FALLBACK_RESERVE_NATIVE_TOKEN: "0.001",
  NATIVE_TOKEN_DECIMALS: 18,
} as const;

export const BIGINT_ZERO = BigInt(0);

export const PERCENTAGE_OPTIONS = [25, 50, 75, 100] as const;

export const COPY_RESET_DELAY = 2000;

export const TRANSACTION_POLL_INTERVAL = 3000;

export const TESTNET_CHAIN_IDS: readonly number[] = [
  sepolia.id,
  baseSepolia.id,
];
