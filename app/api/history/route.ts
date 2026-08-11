import { readSupabase } from "../../lib/market-data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 192));
    type HistoryRow = {
      symbol: "XAU" | "XAG";
      price_usd: number | string;
      price_thb_per_gram: number | string;
      recorded_at: string;
      source: string;
      is_demo: boolean;
    };
    const select = "select=symbol,price_usd,price_thb_per_gram,recorded_at,source,is_demo";
    const [goldRows, silverRows] = await Promise.all([
      readSupabase<HistoryRow[]>(
        `price_history?${select}&symbol=eq.XAU&is_demo=eq.false&source=eq.goldapi&order=recorded_at.desc&limit=${limit}`,
        { signal: AbortSignal.timeout(10_000) },
      ),
      readSupabase<HistoryRow[]>(
        `price_history?${select}&symbol=eq.XAG&is_demo=eq.false&source=eq.goldapi&order=recorded_at.desc&limit=${limit}`,
        { signal: AbortSignal.timeout(10_000) },
      ),
    ]);
    const data = [...goldRows, ...silverRows]
      .sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at));

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
