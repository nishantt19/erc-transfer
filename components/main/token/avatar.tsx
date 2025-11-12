import Image from "next/image";

import { stringToGradient } from "@/utils/utils";
import { type Token } from "@/types";

type AvatarProps = {
  token: Token;
  size: "sm" | "md";
};

export default function TokenAvatar({ token, size }: AvatarProps) {
  const { symbol, logo, token_address } = token;
  const initials = symbol?.slice(0, 3).toUpperCase() || "UNK";
  const background = stringToGradient(token_address || symbol || "unknown");

  if (logo) {
    return (
      <div
        className={`relative ${
          size === "sm" ? "w-8 h-8" : "w-10 h-10"
        } rounded-full flex items-center justify-center overflow-hidden border border-gray-200/10`}
      >
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
      className={`${
        size === "sm" ? "w-8 h-8" : "w-10 h-10"
      } rounded-full flex items-center justify-center border border-gray-200/10 font-semibold text-white text-xs`}
      style={{ background }}
    >
      {initials}
    </div>
  );
}
