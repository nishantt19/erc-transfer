import { NextResponse } from "next/server";
import axios from "axios";
import { type API_RESPONSE } from "@/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const chain = searchParams.get("chain");

  if (!address || !chain) {
    return NextResponse.json(
      { error: "Missing address or chain" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get<API_RESPONSE>(
      `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens`,
      {
        params: { chain, max_token_inactivity: 60 },
        headers: {
          accept: "application/json",
          "X-API-Key": process.env.MORALIS_API_KEY!,
        },
      }
    );

    return NextResponse.json<API_RESPONSE>(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Moralis API error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
