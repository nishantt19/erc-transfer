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

export const TESTNET_CHAIN_IDS: readonly number[] = [
  sepolia.id,
  baseSepolia.id,
];

export const IS_BROWSER = typeof window !== "undefined";
