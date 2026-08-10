import { finiteNumber, readSupabase } from "../../lib/market-data";

type GoldAnnouncement = {
  signature: string;
  source_date: string;
  announcement_no: number | null;
  announced_at: string;
  gold_bar_buy: number | string;
  gold_bar_sell: number | string;
  ornament_buy: number | string;
  ornament_sell: number | string;
  recorded_at: string;
};

type SilverDaily = {
  signature: string;
  price_date: string;
  buy_price: number | string;
  sell_price: number | string;
  spot_usd: number | string;
  usd_thb: number | string;
  recorded_at: string;
};

type SpotRow = {
  symbol: "XAU" | "XAG";
  price_usd: number | string;
  price_thb_per_gram: number | string;
  usd_thb: number | string;
  recorded_at: string;
};

export async function GET() {
  try {
    const timeout = AbortSignal.timeout(10_000);
    const [goldRows, silverRows, spotRows] = await Promise.all([
      readSupabase<GoldAnnouncement[]>(
        "thai_gold_announcements?select=signature,source_date,announcement_no,announced_at,gold_bar_buy,gold_bar_sell,ornament_buy,ornament_sell,recorded_at&order=recorded_at.desc&limit=2",
        { signal: timeout },
      ),
      readSupabase<SilverDaily[]>(
        "silver_daily_prices?select=signature,price_date,buy_price,sell_price,spot_usd,usd_thb,recorded_at&order=recorded_at.desc&limit=2",
        { signal: timeout },
      ),
      readSupabase<SpotRow[]>(
        "price_history?select=symbol,price_usd,price_thb_per_gram,usd_thb,recorded_at&is_demo=eq.false&source=eq.goldapi&order=recorded_at.desc&limit=240",
        { signal: timeout },
      ),
    ]);

    const currentGold = goldRows[0];
    const previousGold = goldRows[1];
    const currentSilver = silverRows[0];
    const previousSilver = silverRows[1];
    const latestGoldSpot = spotRows.find((row) => row.symbol === "XAU");
    const latestSilverSpot = spotRows.find((row) => row.symbol === "XAG");

    if (!currentGold || !currentSilver || !latestGoldSpot || !latestSilverSpot) {
      return Response.json(
        { error: "Price history is not ready", code: "PRICE_HISTORY_NOT_READY" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }

    const usdThb = finiteNumber(latestGoldSpot.usd_thb || currentSilver.usd_thb);
    const updatedAt = [currentGold.recorded_at, currentSilver.recorded_at, latestGoldSpot.recorded_at]
      .sort()
      .at(-1) ?? currentGold.recorded_at;

    return Response.json({
      metals: [
        {
          symbol: "XAU",
          name: "Gold Spot",
          priceUsd: finiteNumber(latestGoldSpot.price_usd),
          priceThbPerGram: finiteNumber(latestGoldSpot.price_thb_per_gram),
          changePercent: 0,
        },
        {
          symbol: "XAG",
          name: "Silver Spot",
          priceUsd: finiteNumber(latestSilverSpot.price_usd),
          priceThbPerGram: finiteNumber(latestSilverSpot.price_thb_per_gram),
          changePercent: 0,
        },
      ],
      usdThb,
      source: "goldapi",
      isDemo: false,
      updatedAt,
      thaiGold: {
        signature: currentGold.signature,
        date: currentGold.source_date,
        announcementNo: currentGold.announcement_no,
        announcedAt: currentGold.announced_at,
        recordedAt: currentGold.recorded_at,
        hasPrevious: Boolean(previousGold),
        goldBar: {
          buy: finiteNumber(currentGold.gold_bar_sell) - 200,
          sell: finiteNumber(currentGold.gold_bar_sell),
          buyChange: previousGold
            ? finiteNumber(currentGold.gold_bar_sell) - finiteNumber(previousGold.gold_bar_sell)
            : null,
          sellChange: previousGold
            ? finiteNumber(currentGold.gold_bar_sell) - finiteNumber(previousGold.gold_bar_sell)
            : null,
        },
        ornament: {
          buy: finiteNumber(currentGold.ornament_buy),
          sell: finiteNumber(currentGold.ornament_sell),
        },
      },
      silverBar: {
        signature: currentSilver.signature,
        date: currentSilver.price_date,
        recordedAt: currentSilver.recorded_at,
        hasPrevious: Boolean(previousSilver),
        buy: finiteNumber(currentSilver.sell_price) - 80,
        sell: finiteNumber(currentSilver.sell_price),
        buyChange: previousSilver
          ? finiteNumber(currentSilver.sell_price) - finiteNumber(previousSilver.sell_price)
          : null,
        sellChange: previousSilver
          ? finiteNumber(currentSilver.sell_price) - finiteNumber(previousSilver.sell_price)
          : null,
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Price API error", error);
    return Response.json(
      { error: "Price service is temporarily unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

