import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { gnosis, mainnet, sepolia, baseSepolia, base } from "viem/chains";
import { getAlchemyTransport } from "@/lib/getAlchemyRPC";

const chains = [sepolia, mainnet, gnosis, base, baseSepolia];

/**
 * Wagmi configuration with RainbowKit
 * Supports multiple chains with Alchemy RPC endpoints
 * SSR enabled for Next.js server-side rendering
 */
export const config = getDefaultConfig({
  appName: "erc20-transfer",
  chains: [sepolia, mainnet, gnosis, base, baseSepolia],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  // Map each chain to its Alchemy RPC transport
  transports: chains.reduce(
    (acc, chain) => ({
      ...acc,
      [chain.id]: getAlchemyTransport(chain.id),
    }),
    {}
  ),
  ssr: true,
});
