import { type Token } from "@/types";
import { parseUnits, formatUnits, type Address } from "viem";
import { BIGINT_ZERO, GAS_CONSTANTS } from "./constants";

function hashStringToNumber(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function stringToGradient(str: string) {
  const hash = hashStringToNumber(str);
  const hue1 = hash % 360;
  const hue2 = (hash * 37) % 360;
  const saturation = 70;
  const lightness1 = 55;
  const lightness2 = 45;
  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness1}%)`;
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness2}%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export function formatBalance(
  balance: bigint | string | number,
  decimals: number,
  maxDecimals: number = 4
): string {
  const balanceString = formatUnits(BigInt(balance), decimals);
  const numericBalance = parseFloat(balanceString);

  if (numericBalance === 0) return "0";

  const formatted = numericBalance.toFixed(maxDecimals);

  return parseFloat(formatted).toString();
}

export function truncateAddress(address: Address, length: number = 4): string {
  if (!address) return "";
  const start = address.slice(0, 2 + length);
  const end = address.slice(-length);
  return `${start}...${end}`;
}

export const calculateUsdValue = (amount: string, selectedToken: Token) => {
  if (!selectedToken || !amount || isNaN(Number(amount))) return "0.00";

  const usdValue = Number(amount) * Number(selectedToken.usd_price);
  return usdValue.toFixed(2);
};

export function calculateRequiredGasAmount(
  gasEstimate: bigint,
  gasPrice: bigint
): bigint {
  const gasCost = gasEstimate * gasPrice;
  const percentBuffer = gasCost / GAS_CONSTANTS.BUFFER_PERCENT;
  const minimumBuffer = parseUnits(
    GAS_CONSTANTS.MINIMUM_BUFFER_NATIVE_TOKEN,
    GAS_CONSTANTS.NATIVE_TOKEN_DECIMALS
  );

  const buffer = percentBuffer > minimumBuffer ? percentBuffer : minimumBuffer;
  return gasCost + buffer;
}

export function computeMaxNativeInput(
  balance: bigint,
  gasAmount: bigint
): bigint {
  const max = balance - gasAmount;

  return max > BIGINT_ZERO ? max : BIGINT_ZERO;
}
