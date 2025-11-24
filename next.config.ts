import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.moralis.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "logo.moralis.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
    ],
    qualities: [100, 75],
  },
};

export default nextConfig;
