import Image from "next/image";
import { stringToGradient } from "@/utils/utils";
import { type Token } from "@/types";

type AvatarProps = {
  token: Token;
  size: "sm" | "md";
};

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
} as const;

export default function TokenAvatar({ token, size }: AvatarProps) {
  const { symbol, logo, token_address } = token;

  const sizeClass = SIZE_CLASSES[size];
  const initials = symbol?.slice(0, 3).toUpperCase() || "UNK";
  const background = stringToGradient(token_address || symbol || "unknown");

  if (logo) {
    return (
      <div className={`relative ${sizeClass} rounded-full flex items-center justify-center overflow-hidden border border-gray-200/10`}>
        <Image
          src={logo}
          alt={symbol}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center border border-gray-200/10 font-semibold text-white text-xs`}
      style={{ background }}
    >
      {initials}
    </div>
  );
}
