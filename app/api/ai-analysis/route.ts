type Snapshot = {
  isDemo?: boolean;
  source?: string;
  metals?: Array<{
    symbol?: "XAU" | "XAG";
    priceUsd?: number;
    changePercent?: number;
  }>;
};

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export async function POST(request: Request) {
  try {
    const snapshot = await request.json() as Snapshot;
    if (snapshot.isDemo || snapshot.source?.toLowerCase() !== "goldapi") {
      return Response.json({
        analysis: ["ยังไม่สร้างบทวิเคราะห์", "ระบบกำลังรอราคาจริงจาก GoldAPI"],
        source: "unavailable",
      }, { status: 503, headers: { "cache-control": "no-store" } });
    }

    const gold = snapshot.metals?.find((item) => item.symbol === "XAU");
    const silver = snapshot.metals?.find((item) => item.symbol === "XAG");
    if (!validPrice(gold?.priceUsd) || !validPrice(silver?.priceUsd)) {
      return Response.json({
        analysis: ["ยังไม่สร้างบทวิเคราะห์", "ข้อมูลราคาจริงไม่ครบ จึงไม่ใช้ค่า 0 หรือข้อมูลจำลองแทน"],
        source: "unavailable",
      }, { status: 503, headers: { "cache-control": "no-store" } });
    }

    const goldDirection = (gold.changePercent ?? 0) > 0 ? "ปรับขึ้น" : (gold.changePercent ?? 0) < 0 ? "ปรับลง" : "ทรงตัว";
    const silverDirection = (silver.changePercent ?? 0) > 0 ? "ปรับขึ้น" : (silver.changePercent ?? 0) < 0 ? "ปรับลง" : "ทรงตัว";

    return Response.json({
      analysis: [
        `Gold Spot ${goldDirection} ที่ประมาณ $${formatUsd(gold.priceUsd)}`,
        `Silver Spot ${silverDirection} ที่ประมาณ $${formatUsd(silver.priceUsd)}`,
        "รายงาน OI, Volatility และ MACD จะสร้างเมื่อผู้ใช้กรอกข้อมูลจริงใน Gold2Cash Trade Diary",
      ],
      source: "deterministic",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Analysis API error", error);
    return Response.json({
      analysis: ["ระบบวิเคราะห์ไม่พร้อมใช้งานชั่วคราว", "กรุณาตรวจสอบราคาตลาดล่าสุดก่อนตัดสินใจ"],
      source: "unavailable",
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

