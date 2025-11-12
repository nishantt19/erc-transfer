import { type Address } from "viem";

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
  balance: string | number,
  decimals: number,
  maxDecimals: number = 4
): string {
  const numericBalance = Number(balance) / 10 ** decimals;

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
