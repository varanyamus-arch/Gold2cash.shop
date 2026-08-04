const UPSTREAM = "https://gold22cash.vercel.app/api/market";

export async function POST(request: Request) {
  try {
    const snapshot = await request.json() as { isDemo?: boolean; source?: string };
    if (snapshot.isDemo || snapshot.source?.toLowerCase() !== "goldapi") {
      return Response.json({
        analysis: ["ยังไม่สร้างบทวิเคราะห์", "ระบบกำลังรอราคาจริงล่าสุดจาก GoldAPI"],
        source: "unavailable",
      }, { status: 503, headers: { "cache-control": "no-store" } });
    }
    const response = await fetch(UPSTREAM, { cache: "no-store" });
    if (!response.ok) throw new Error(`Analysis upstream returned ${response.status}`);
    const payload = await response.json() as {
      analyses?: Partial<Record<"XAU" | "XAG", { summary?: string; strategy?: string; model?: string }>>;
    };
    const gold = payload.analyses?.XAU;
    const silver = payload.analyses?.XAG;
    const analysis = [
      gold?.summary,
      gold?.strategy ? `กลยุทธ์ทอง: ${gold.strategy}` : undefined,
      silver?.summary ? `Silver Spot: ${silver.summary}` : undefined,
    ].filter((item): item is string => Boolean(item));
    if (!analysis.length) throw new Error("Analysis payload is empty");
    return Response.json({
      analysis,
      source: gold?.model === "openai" || silver?.model === "openai" ? "openai" : "deterministic",
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({
      analysis: ["ระบบวิเคราะห์ไม่พร้อมใช้งานชั่วคราว", "กรุณาตรวจสอบราคาตลาดล่าสุดก่อนตัดสินใจ"],
      source: "deterministic",
    }, { status: 503 });
  }
}
