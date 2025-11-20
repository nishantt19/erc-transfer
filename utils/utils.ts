import { type Token } from "@/types";
import { parseUnits, formatUnits, type Address, type Hash } from "viem";
import { BIGINT_ZERO, GAS_CONSTANTS } from "./constants";

const GRADIENT_SATURATION = 70;
const GRADIENT_LIGHTNESS_1 = 55;
const GRADIENT_LIGHTNESS_2 = 45;
const GRADIENT_HUE_MULTIPLIER = 37;

const hashStringToNumber = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const stringToGradient = (str: string): string => {
  const hash = hashStringToNumber(str);
  const hue1 = hash % 360;
  const hue2 = (hash * GRADIENT_HUE_MULTIPLIER) % 360;
  const color1 = `hsl(${hue1}, ${GRADIENT_SATURATION}%, ${GRADIENT_LIGHTNESS_1}%)`;
  const color2 = `hsl(${hue2}, ${GRADIENT_SATURATION}%, ${GRADIENT_LIGHTNESS_2}%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
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
