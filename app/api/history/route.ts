import { readSupabase } from "../../lib/market-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 192));
    const data = await readSupabase<Array<{
      symbol: "XAU" | "XAG";
      price_usd: number | string;
      price_thb_per_gram: number | string;
      recorded_at: string;
      source: string;
      is_demo: boolean;
    }>>(
      `price_history?select=symbol,price_usd,price_thb_per_gram,recorded_at,source,is_demo&is_demo=eq.false&source=eq.goldapi&order=recorded_at.desc&limit=${limit}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    return Response.json({
      data: data.map((row) => ({
        ...row,
        price_usd: Number(row.price_usd),
        price_thb_per_gram: Number(row.price_thb_per_gram),
      })),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("History API error", error);
    return Response.json(
      { data: [], error: "History is temporarily unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

