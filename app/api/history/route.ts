const UPSTREAM = "https://gold22cash.vercel.app/api/market";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 96));
    const response = await fetch(UPSTREAM, { cache: "no-store" });
    if (!response.ok) throw new Error(`History upstream returned ${response.status}`);
    const payload = await response.json() as {
      assets?: Array<{ symbol?: "XAU" | "XAG"; usdThb?: number }>;
      history?: Partial<Record<"XAU" | "XAG", Array<{
        symbol?: "XAU" | "XAG";
        price?: number;
        capturedAt?: string;
      }>>>;
    };
    const usdThb = payload.assets?.find((item) => Number.isFinite(item.usdThb))?.usdThb ?? 0;
    const data = (["XAU", "XAG"] as const).flatMap((symbol) =>
      (payload.history?.[symbol] ?? []).slice(-limit).map((row) => ({
        symbol,
        price_usd: row.price,
        price_thb_per_gram: Number(row.price) * usdThb / 31.1034768,
        recorded_at: row.capturedAt,
        source: "goldapi",
        is_demo: false,
      })),
    ).filter((row) => Number.isFinite(row.price_usd) && Boolean(row.recorded_at))
      .sort((a, b) => String(b.recorded_at).localeCompare(String(a.recorded_at)));
    return Response.json({ data }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ data: [], error: "History is temporarily unavailable" }, { status: 503 });
  }
}
