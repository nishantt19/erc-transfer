import { http } from "viem";
import { CHAIN_CONFIG } from "@/utils/constants";

export const getAlchemyTransport = (chainId: number) => {
  const slug = CHAIN_CONFIG[chainId].ALCHEMY_SLUG;

  if (!slug) {
    throw new Error(`Missing Alchemy slug for chain id ${chainId}`);
  }

  return http(
    `https://${slug}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
  );
};
