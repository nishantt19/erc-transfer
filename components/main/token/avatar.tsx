import Image from "next/image";
import { stringToColorPair } from "@/utils/utils";
import { type Token } from "@/types";

type AvatarProps = {
  token: Token;
  size: "sm" | "md";
  chainLogo?: string | null;
  isTestnet?: boolean;
};

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
} as const;

const CHAIN_BADGE_SIZE = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
} as const;

export default function TokenAvatar({ token, size, chainLogo, isTestnet = false }: AvatarProps) {
  const { symbol, logo, token_address } = token;

  const sizeClass = SIZE_CLASSES[size];
  const badgeSize = CHAIN_BADGE_SIZE[size];
  const initials = symbol?.slice(0, 3).toUpperCase() || "UNK";
  const colors = stringToColorPair(token_address || symbol || "unknown");

  const borderClass = isTestnet
    ? "border-2 border-dashed border-secondary"
    : "border border-gray-200/10";

  const ChainBadge = chainLogo ? (
    <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSize} rounded border border-black bg-white flex items-center justify-center p-0.5`}>
      <Image
        src={chainLogo}
        alt="chain"
        width={16}
        height={16}
        className="w-full h-full object-contain"
      />
    </div>
  ) : null;

  if (logo) {
    return (
      <div className={`relative ${sizeClass} rounded-full flex items-center justify-center ${borderClass}`}>
        <div className="w-full h-full rounded-full overflow-hidden">
          <Image
            src={logo}
            alt={symbol}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        {ChainBadge}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClass} rounded-full flex items-center justify-center ${borderClass}`}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-semibold text-xs"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {initials}
      </div>
      {ChainBadge}
    </div>
  );
}
