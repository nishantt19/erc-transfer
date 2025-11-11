import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  gnosis,
  mainnet,
  optimism,
  sepolia,
  baseSepolia,
} from "viem/chains";

export const config = getDefaultConfig({
  appName: "erc20-transfer",
  chains: [sepolia, mainnet, arbitrum, gnosis, optimism, baseSepolia],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  ssr: true,
});
