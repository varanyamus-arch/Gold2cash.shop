"use client";

import { useMemo, useState } from "react";

type Volatility = "low" | "normal" | "high";
type MacdState = "bullish" | "bearish" | "neutral";
type Histogram = "expanding" | "contracting" | "flat";

type Report = {
  price: string;
  oi: string;
  volatility: string;
  macd: string;
  strategy: string;
};

function asPositive(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default function TradeDiary({ currentPrice }: { currentPrice?: number }) {
  const [source, setSource] = useState<"spot" | "future">("spot");
  const [price, setPrice] = useState("");
  const [callWall, setCallWall] = useState("");
  const [putWall, setPutWall] = useState("");
  const [volatility, setVolatility] = useState<Volatility>("normal");
  const [macd, setMacd] = useState<MacdState>("neutral");
  const [histogram, setHistogram] = useState<Histogram>("flat");
  const [report, setReport] = useState<Report | null>(null);

  const effectivePrice = useMemo(() => asPositive(price) ?? currentPrice ?? null, [price, currentPrice]);

  const analyze = () => {
    const marketPrice = effectivePrice;
    const call = asPositive(callWall);
    const put = asPositive(putWall);
    if (!marketPrice || !call || !put || put >= call) {
      setReport(null);
      return;
    }

    const range = call - put;
    const callDistance = call - marketPrice;
    const putDistance = marketPrice - put;
    const nearCall = callDistance >= 0 && callDistance <= range * 0.2;
    const nearPut = putDistance >= 0 && putDistance <= range * 0.2;
    const aboveCall = marketPrice > call;
    const belowPut = marketPrice < put;

    const priceView = aboveCall
      ? `ราคา ${formatUsd(marketPrice)} ยืนเหนือ Call Wall ${formatUsd(call)} โครงสร้างมีแรงส่งเชิงบวก แต่ต้องรอยืนยันการยืนเหนือแนวต้าน`
      : belowPut
        ? `ราคา ${formatUsd(marketPrice)} หลุด Put Wall ${formatUsd(put)} โครงสร้างอ่อนแรงและต้องระวังการเร่งตัวลง`
        : nearCall
          ? `ราคา ${formatUsd(marketPrice)} เข้าใกล้ Call Wall ${formatUsd(call)} ซึ่งเป็นแนวต้านหลักของกรอบปัจจุบัน`
          : nearPut
            ? `ราคา ${formatUsd(marketPrice)} เข้าใกล้ Put Wall ${formatUsd(put)} ซึ่งเป็นแนวรับหลักของกรอบปัจจุบัน`
            : `ราคา ${formatUsd(marketPrice)} เคลื่อนไหวกลางกรอบ ${formatUsd(put)}–${formatUsd(call)} ยังไม่มีการยืนยัน Breakout`;

    const volatilityView = volatility === "high"
      ? "ความผันผวนสูง ระยะ Stop Loss ต้องเผื่อกว้างขึ้นและควรลดขนาดสถานะ"
      : volatility === "low"
        ? "ความผันผวนต่ำ ตลาดอาจอยู่ในช่วงสะสมแรง ควรรอการขยายตัวของกรอบราคา"
        : "ความผันผวนอยู่ในระดับปกติ ใช้แนวรับ–แนวต้านและสัญญาณยืนยันตามแผนได้";

    const macdView = macd === "bullish"
      ? `MACD อยู่ฝั่งบวก${histogram === "contracting" ? " แต่ Histogram หดตัว แรงส่งขาขึ้นกำลังชะลอ" : histogram === "expanding" ? " และ Histogram ขยายตัว สนับสนุนโมเมนตัมขาขึ้น" : " แต่ Histogram ทรงตัว จึงควรรอการเร่งตัว"}`
      : macd === "bearish"
        ? `MACD อยู่ฝั่งลบ${histogram === "contracting" ? " แต่ Histogram หดตัว แรงขายเริ่มลดลง" : histogram === "expanding" ? " และ Histogram ขยายตัว ยืนยันแรงกดดันขาลง" : " โดย Histogram ทรงตัว ยังไม่เกิดแรงเร่งใหม่"}`
        : "MACD ยังเป็นกลางและไม่ยืนยันโมเมนตัม ควรรอการตัดเส้นพร้อมทิศทาง Histogram";

    let strategy = "WAIT: รอราคาเลือกทางและรอสัญญาณ MACD ยืนยันก่อนเปิดสถานะ";
    if ((aboveCall || nearPut) && macd === "bullish" && histogram !== "contracting") {
      strategy = `LONG BIAS: พิจารณาฝั่งซื้อเมื่อราคายืนยันเหนือ ${aboveCall ? formatUsd(call) : formatUsd(put)} และกำหนดความเสี่ยงตาม Volatility`;
    } else if ((belowPut || nearCall) && macd === "bearish" && histogram !== "contracting") {
      strategy = `SHORT/TAKE PROFIT BIAS: ระวังแรงขายบริเวณ ${belowPut ? formatUsd(put) : formatUsd(call)} และไม่ไล่ราคา`;
    }

    setReport({
      price: priceView,
      oi: `Call Wall ${formatUsd(call)} เป็นแนวต้านหลัก และ Put Wall ${formatUsd(put)} เป็นแนวรับหลัก ระยะกรอบ ${formatUsd(range)} จุด`,
      volatility: volatilityView,
      macd: macdView,
      strategy,
    });
  };

  const inputValid = Boolean(effectivePrice && asPositive(callWall) && asPositive(putWall) && Number(putWall) < Number(callWall));

  return (
    <section className="trade-diary" id="trade-diary">
      <div className="trade-diary-intro">
        <p className="eyebrow">GOLD2CASH TRADE DIARY</p>
        <h2>ผู้ช่วยวิเคราะห์เทคนิค XAUUSD</h2>
        <p>กรอกข้อมูลตลาดจริงเพื่อสร้างรายงานทีละขั้นตอน ระบบจะไม่สร้างค่า OI, Volatility หรือ MACD ขึ้นเอง</p>
        <div className="engine-status"><i /> Technical Rule Engine พร้อมใช้งาน · OpenAI ยังไม่เชื่อมต่อ</div>
      </div>

      <div className="trade-diary-grid">
        <div className="trade-form">
          <div className="source-toggle" role="group" aria-label="แหล่งราคาปัจจุบัน">
            <button className={source === "spot" ? "active" : ""} onClick={() => setSource("spot")}>Spot</button>
            <button className={source === "future" ? "active" : ""} onClick={() => setSource("future")}>Future</button>
          </div>
          <label>ราคาปัจจุบัน ({source === "spot" ? "Spot" : "Future"})<input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={currentPrice ? formatUsd(currentPrice) : "เช่น 4390"} /></label>
          <div className="trade-field-pair">
            <label>Call Wall<input inputMode="decimal" value={callWall} onChange={(event) => setCallWall(event.target.value)} placeholder="เช่น 4400" /></label>
            <label>Put Wall<input inputMode="decimal" value={putWall} onChange={(event) => setPutWall(event.target.value)} placeholder="เช่น 4350" /></label>
          </div>
          <label>Volatility<select value={volatility} onChange={(event) => setVolatility(event.target.value as Volatility)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
          <div className="trade-field-pair">
            <label>สถานะ MACD<select value={macd} onChange={(event) => setMacd(event.target.value as MacdState)}><option value="bullish">ตัดขึ้น / Bullish</option><option value="bearish">ตัดลง / Bearish</option><option value="neutral">ยังไม่ยืนยัน</option></select></label>
            <label>Histogram<select value={histogram} onChange={(event) => setHistogram(event.target.value as Histogram)}><option value="expanding">ขยายตัว</option><option value="contracting">หดตัว</option><option value="flat">ทรงตัว</option></select></label>
          </div>
          <button className="analyze-button" type="button" onClick={analyze} disabled={!inputValid}>สร้างรายงานวิเคราะห์</button>
          {!inputValid && <p className="trade-form-help">กรอก Call Wall และ Put Wall ด้วยข้อมูลจริง โดย Put Wall ต้องต่ำกว่า Call Wall</p>}
        </div>

        <div className="trade-report" aria-live="polite">
          {!report ? (
            <div className="trade-empty"><b>รอข้อมูลตลาด</b><p>รายงานจะแสดงเมื่อข้อมูลสำคัญครบ โดยไม่มีการจำลองตัวเลขอัตโนมัติ</p></div>
          ) : (
            <>
              <h3>รายงานการวิเคราะห์เทคนิค XAUUSD</h3>
              {[report.price, report.oi, report.volatility, report.macd].map((text, index) => (
                <article key={text}><span>STEP {index + 1}</span><b>{["Price Action", "Options OI", "Volatility", "MACD & Momentum"][index]}</b><p>{text}</p></article>
              ))}
              <div className="strategy-summary"><small>สรุปกลยุทธ์ตามกฎระบบ</small><strong>{report.strategy}</strong></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

