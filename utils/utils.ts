import { type Token } from "@/types";
import { parseUnits, formatUnits, type Address, type Hash } from "viem";
import { BIGINT_ZERO, GAS_CONSTANTS, TESTNET_CHAIN_IDS } from "./constants";

const COLORS = [
  { h: 262 },
  { h: 217 },
  { h: 240 },
  { h: 290 },
  { h: 330 },
  { h: 3 },
  { h: 27 },
  { h: 45 },
];

const hashStringToNumber = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const stringToColorPair = (
  str: string
): { bg: string; text: string } => {
  const hash = hashStringToNumber(str);
  const { h } = COLORS[hash % COLORS.length];
  return {
    bg: `hsl(${h} ${50}% 7%)`,
    text: `hsl(${h} ${50}% 42%)`,
  };
};

export const formatBalance = (
  balance: bigint | string | number,
  decimals: number,
  maxDecimals: number = 6
): string => {
  const balanceString = formatUnits(BigInt(balance), decimals);
  const numericBalance = parseFloat(balanceString);

  if (numericBalance === 0) return "0";

  return parseFloat(numericBalance.toFixed(maxDecimals)).toString();
};

export const truncateAddress = (
  address: Address,
  length: number = 4
): string => {
  if (!address) return "";
  return `${address.slice(0, 2 + length)}...${address.slice(-length)}`;
};

export const calculateUsdValue = (
  amount: string,
  selectedToken: Token
): string => {
  if (!selectedToken || !amount || isNaN(Number(amount))) return "0.00";
  return (Number(amount) * Number(selectedToken.usd_price)).toFixed(2);
};

export const calculateRequiredGasAmount = (
  gasEstimate: bigint,
  gasPrice: bigint
): bigint => {
  const gasCost = gasEstimate * gasPrice;
  const percentBuffer = gasCost / GAS_CONSTANTS.BUFFER_PERCENT;
  const minimumBuffer = parseUnits(
    GAS_CONSTANTS.MINIMUM_BUFFER_NATIVE_TOKEN,
    GAS_CONSTANTS.NATIVE_TOKEN_DECIMALS
  );

  return (
    gasCost + (percentBuffer > minimumBuffer ? percentBuffer : minimumBuffer)
  );
};

export const computeMaxNativeInput = (
  balance: bigint,
  gasAmount: bigint
): bigint => {
  const max = balance - gasAmount;
  return max > BIGINT_ZERO ? max : BIGINT_ZERO;
};

export const truncateHash = (hash: Hash): string => {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

export const formatSeconds = (seconds: number): string => {
  if (seconds < 1) return `${seconds.toFixed(2)}s`;

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
};

export const isTestnetChain = (chainId: number): boolean => {
  return TESTNET_CHAIN_IDS.includes(chainId);
};
