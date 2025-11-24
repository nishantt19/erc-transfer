import { NextResponse } from "next/server";
import axios from "axios";
import { type Address, isAddress } from "viem";
import type { MoralisTokenPriceResponse, Token } from "@/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenAddress = searchParams.get("tokenAddress");
  const chain = searchParams.get("chain");

  if (!tokenAddress || !chain) {
    return NextResponse.json(
      { error: "Missing tokenAddress or chain" },
      { status: 400 }
    );
  }

  if (!isAddress(tokenAddress)) {
    return NextResponse.json(
      { error: "Invalid token address format" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get<MoralisTokenPriceResponse>(
      `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price`,
      {
        params: { chain },
        headers: {
          accept: "application/json",
          "X-API-Key": process.env.MORALIS_API_KEY!,
        },
      }
    );

    const data = response.data;

    const normalizedResponse: Token = {
      name: data.tokenName,
      symbol: data.tokenSymbol,
      logo: data.tokenLogo,
      decimals: parseInt(data.tokenDecimals),
      token_address: data.tokenAddress as Address,
      usd_price: data.usdPriceFormatted,
    };

    return NextResponse.json<Token>(normalizedResponse);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      "Moralis token price API error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: "Token not found on this chain" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch token metadata" },
      { status: 500 }
    );
  }
}
