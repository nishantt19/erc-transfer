import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { gnosis, mainnet, sepolia, baseSepolia, base } from "viem/chains";
import { getAlchemyTransport } from "@/lib/getAlchemyRPC";

const chains = [sepolia, mainnet, gnosis, base, baseSepolia];

export const config = getDefaultConfig({
  appName: "erc20-transfer",
  chains: [sepolia, mainnet, gnosis, base, baseSepolia],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  transports: chains.reduce(
    (acc, chain) => ({
      ...acc,
      [chain.id]: getAlchemyTransport(chain.id),
    }),
    {}
  ),
  ssr: true,
});
