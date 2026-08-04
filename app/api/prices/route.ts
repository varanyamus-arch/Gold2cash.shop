const UPSTREAM = "https://gold22cash.vercel.app/api/market";

export async function GET() {
  try {
    const response = await fetch(UPSTREAM, { cache: "no-store" });
    if (!response.ok) throw new Error(`Price upstream returned ${response.status}`);
    const payload = await response.json() as {
      assets?: Array<{
        symbol?: "XAU" | "XAG";
        name?: string;
        price?: number;
        priceThbPerGram?: number;
        changePercent?: number | null;
        updatedAt?: string;
        source?: string;
        usdThb?: number;
      }>;
    };
    const assets = payload.assets ?? [];
    const hasValidPrices = assets.length === 2
      && assets.every((item) => Number.isFinite(item.price) && Number(item.price) > 0);
    const isGoldApi = assets.every((item) => item.source?.toLowerCase().replace("-", "") === "goldapi");
    if (!isGoldApi || !hasValidPrices) {
      return Response.json(
        { error: "Live GoldAPI data is unavailable", code: "LIVE_PRICE_UNAVAILABLE" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    const updatedAt = assets.reduce(
      (latest, item) => item.updatedAt && item.updatedAt > latest ? item.updatedAt : latest,
      "",
    );
    return Response.json({
      metals: assets.map((item) => ({
        symbol: item.symbol,
        name: item.name ?? (item.symbol === "XAU" ? "Gold Spot" : "Silver Spot"),
        priceUsd: item.price,
        priceThbPerGram: item.priceThbPerGram,
        changePercent: item.changePercent ?? 0,
      })),
      usdThb: assets.find((item) => Number.isFinite(item.usdThb))?.usdThb ?? 0,
      source: "goldapi",
      isDemo: false,
      updatedAt: updatedAt || new Date().toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Price service is temporarily unavailable" }, { status: 503 });
  }
}
