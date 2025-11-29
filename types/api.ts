import { Token } from ".";

export type API_RESPONSE = {
  cursor: string | null;
  page: number;
  page_size: number;
  block_number: number;
  result: Token[];
};

export type MoralisTokenPriceResponse = {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string | null;
  tokenDecimals: string;
  usdPriceFormatted: string;
  tokenAddress: string;
};
