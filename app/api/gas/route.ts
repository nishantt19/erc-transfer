import { NextResponse } from "next/server";
import axios from "axios";
import { type InfuraGasResponse } from "@/types";

/**
 * Fetches real-time gas metrics from Infura Gas API
 * Returns low/medium/high gas price estimates and network congestion data
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  if (!chainId) {
    return NextResponse.json(
      { error: "Missing chainId" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get<InfuraGasResponse>(
      `https://gas.api.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}/networks/${chainId}/suggestedGasFees`
    );

    return NextResponse.json<InfuraGasResponse>(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Infura API error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to fetch gas metrics" },
      { status: 500 }
    );
  }
}
