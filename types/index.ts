import { type Address } from "viem";

export type Token = {
  token_address: Address;
  name: string;
  symbol: string;
  logo: string | null;
  decimals: number;
  balance?: string;
  usd_price: string;
  native_token?: boolean;
};

export type CHAIN_ID = 1 | 11155111 | 100 | 8453 | 84532;

export type NetworkCongestionLevel = "low" | "medium" | "high";

export type { GasFeeEstimate, GasTier, InfuraGasResponse } from "./gas";
export type { API_RESPONSE, MoralisTokenPriceResponse } from "./api";
export type {
  TransactionAction,
  TransactionEstimate,
  TransactionFlow,
  TransactionStatusType,
} from "./transaction";
