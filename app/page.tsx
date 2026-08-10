"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MetalPriceBoard from "../components/MetalPriceBoard";
import TradeDiary from "../components/TradeDiary";



type Metal = "silver" | "gold";
type Range = "1D" | "7D" | "1M";
type SpotSymbol = "gold" | "silver";
type MetalSymbol = "XAU" | "XAG";
type MarketMetal = {
  symbol: MetalSymbol;
  name: string;
  priceUsd: number;
  priceThbPerGram: number;
  changePercent: number;
};
type MarketSnapshot = {
  metals: MarketMetal[];
  usdThb: number;
  source: string;
  isDemo: boolean;
  updatedAt: string;
  thaiGold: {
    signature: string;
    date: string;
    announcementNo: number | null;
    announcedAt: string;
    recordedAt: string;
    hasPrevious: boolean;
    goldBar: {
      buy: number;
      sell: number;
      buyChange: number | null;
      sellChange: number | null;
    };
    ornament: { buy: number; sell: number };
  };
  silverBar: {
    signature: string;
    date: string;
    recordedAt: string;
    hasPrevious: boolean;
    buy: number;
    sell: number;
    buyChange: number | null;
    sellChange: number | null;
  };
};
type HistoryRow = {
  symbol: MetalSymbol;
  price_usd: number;
  price_thb_per_gram: number;
  recorded_at: string;
  source?: string;
  is_demo?: boolean;
};

const defaultPurity = { silver: "99.99", gold: "96.5" };
const lineOaUrl = "https://lin.ee/sgjgisa";

function LineChart({ values, color, unit }: { values: number[]; color: string; unit: string }) {
  if (values.length === 0) {
    return <div className="chart-empty">ยังไม่มีข้อมูลจริงสำหรับสร้างกราฟ</div>;
  }
  // Duplicate single value to allow flat line rendering
  const chartValues = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...chartValues);
  const max = Math.max(...chartValues);
  const spread = Math.max(max - min, Math.abs(max) * 0.001, 0.01);
  const points = chartValues
    .map((value, index) => `${(index / (chartValues.length - 1)) * 100},${58 - ((value - min) / spread) * 48}`)
    .join(" ");
  return (
    <div className="chart" aria-label={`กราฟราคา ${unit}`}>
      <svg viewBox="0 0 100 64" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[10, 26, 42, 58].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} className="gridline" />
        ))}
        <polygon points={`0,64 ${points} 100,64`} fill={`url(#fill-${color.replace("#", "")})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-axis"><span>09:00</span><span>12:00</span><span>15:00</span><span>ขณะนี้</span></div>
    </div>
  );
}

function formatBaht(value: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
}

function formatPrice(value: number, prefix = "") {
  return value > 0 ? `${prefix}${formatBaht(value)}` : "—";
}

const tradingViewSymbols: Record<SpotSymbol, { symbol: string; label: string }> = {
  gold: { symbol: "OANDA:XAUUSD", label: "Gold Spot · XAU/USD" },
  silver: { symbol: "OANDA:XAGUSD", label: "Silver Spot · XAG/USD" },
};

function TradingViewChart({ market }: { market: SpotSymbol }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol: tradingViewSymbols[market].symbol,
      interval: "15",
      timezone: "Asia/Bangkok",
      theme: "dark",
      style: "1",
      locale: "th_TH",
      backgroundColor: "rgba(11, 36, 30, 1)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);
  }, [market]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      aria-label={`กราฟเรียลไทม์ ${tradingViewSymbols[market].label}`}
    />
  );
}

export default function Home() {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [analysisSource, setAnalysisSource] = useState("กำลังวิเคราะห์");
  const [priceError, setPriceError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [metal, setMetal] = useState<Metal>("silver");
  const [range, setRange] = useState<Range>("1D");
  const [spotSymbol, setSpotSymbol] = useState<SpotSymbol>("gold");
  const [weight, setWeight] = useState("100");
  const [purity, setPurity] = useState(defaultPurity.silver);
  const [menuOpen, setMenuOpen] = useState(false);
  const gold = market?.metals.find((item) => item.symbol === "XAU");
  const silver = market?.metals.find((item) => item.symbol === "XAG");
  const rates = {
    silver: silver?.priceThbPerGram ?? 0,
    gold: gold?.priceThbPerGram ?? 0,
  };
  const histories = useMemo(() => {
    const rangeMs = {
      "1D": 24 * 60 * 60 * 1000,
      "7D": 7 * 24 * 60 * 60 * 1000,
      "1M": 31 * 24 * 60 * 60 * 1000,
    }[range];
    const newestTimestamp = history.reduce(
      (latest, row) => Math.max(latest, new Date(row.recorded_at).getTime()),
      0,
    );
    const cutoff = newestTimestamp - rangeMs;
    const verifiedRows = history.filter((row) =>
      row.is_demo !== true
      && row.source?.toLowerCase() !== "demo"
      && new Date(row.recorded_at).getTime() >= cutoff
    );
    const values = {
      gold: verifiedRows.filter((row) => row.symbol === "XAU").reverse().map((row) => row.price_usd),
      silver: verifiedRows.filter((row) => row.symbol === "XAG").reverse().map((row) => row.price_usd),
    };
    return {
      gold: values.gold,
      silver: values.silver,
    };
  }, [history, range]);
  const goldPrice = gold?.priceUsd ?? 0;
  const silverPrice = silver?.priceUsd ?? 0;
  const goldChange = gold?.changePercent ?? 0;
  const silverChange = silver?.changePercent ?? 0;
  const goldBaht = (gold?.priceThbPerGram ?? 0) * 15.244;
  const recentGold = histories.gold.slice(-24);
  const recentLow = recentGold.length ? Math.min(...recentGold) : goldPrice;
  const recentHigh = recentGold.length ? Math.max(...recentGold) : goldPrice;
  const support1 = goldPrice ? Math.min(goldPrice * 0.9925, recentLow || goldPrice * 0.9925) : 0;
  const support2 = goldPrice ? Math.min(goldPrice * 0.985, support1 * 0.9925) : 0;
  const resistance1 = goldPrice ? Math.max(goldPrice * 1.0075, recentHigh || goldPrice * 1.0075) : 0;
  const resistance2 = goldPrice ? Math.max(goldPrice * 1.015, resistance1 * 1.0075) : 0;
  const trendUp = goldChange >= 0;
  const isLive = Boolean(market && !market.isDemo && market.source.toLowerCase() === "goldapi");
  const selectedRate = rates[metal];
  const total = useMemo(() => {
    const normalizedWeight = Math.max(0, Number(weight) || 0);
    const normalizedPurity = Math.min(100, Math.max(0, Number(purity) || 0));
    return normalizedWeight * (normalizedPurity / 100) * selectedRate;
  }, [weight, purity, selectedRate]);

  const selectMetal = (nextMetal: Metal) => {
    setMetal(nextMetal);
    setPurity(defaultPurity[nextMetal]);
  };

  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const response = await fetch(`/api/prices?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("price request failed");
        const snapshot = await response.json() as MarketSnapshot;
        if (
          snapshot.isDemo
          || snapshot.source?.toLowerCase() !== "goldapi"
          || !snapshot.metals?.length
          || snapshot.metals.some((item) => !Number.isFinite(item.priceUsd) || item.priceUsd <= 0)
        ) {
          throw new Error("invalid market snapshot");
        }
        if (cancelled) return;
        setMarket(snapshot);
        setPriceError("");
        try {
          const analysisResponse = await fetch("/api/ai-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshot),
          });
          if (!analysisResponse.ok) throw new Error("analysis request failed");
          const data = await analysisResponse.json() as { analysis?: string[]; source?: string };
          if (!cancelled) {
            setAnalysis(data.analysis ?? []);
            setAnalysisSource(data.source === "openai" ? "OpenAI" : "ระบบวิเคราะห์สำรอง");
          }
        } catch {
          if (!cancelled) {
            setAnalysis(["บทวิเคราะห์อัตโนมัติไม่พร้อมใช้งานชั่วคราว", "โปรดอ้างอิงราคาจริงและกราฟตลาดล่าสุด"]);
            setAnalysisSource("ไม่พร้อมใช้งาน");
          }
        }
      } catch {
        if (!cancelled) {
          setMarket(null);
          setAnalysis([]);
          setPriceError("ราคาจริง GoldAPI ไม่พร้อมใช้งาน");
          setAnalysisSource("รอราคาจริง");
        }
      }
    };
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/history?limit=96&t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("history request failed");
        const data = await response.json() as { data?: HistoryRow[] };
        if (!cancelled) {
          const verified = (data.data ?? []).filter((row) =>
            row.is_demo !== true && row.source?.toLowerCase() !== "demo"
          );
          setHistory(verified);
          setHistoryError(verified.length ? "" : "ยังไม่มีประวัติราคาจริงจาก GoldAPI");
        }
      } catch {
        if (!cancelled) setHistoryError("เชื่อมต่อประวัติราคาจาก Supabase ไม่สำเร็จ");
      }
    };
    void loadPrices();
    void loadHistory();
    const timer = window.setInterval(() => {
      void loadPrices();
      void loadHistory();
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main>
      <header className={`topbar ${menuOpen ? "menu-open" : ""}`}>
        <a className="brand" href="#top" aria-label="ทองแลกเงิน หน้าแรก">
          <span className="brand-mark"><img src="/gold2cash-logo.jpg" alt="" /></span>
          <span><b>ทองแลกเงิน</b><small>GOLD2CASH</small></span>
        </a>
        <nav aria-label="เมนูหลัก">
          <a href="#prices" onClick={() => setMenuOpen(false)}>ตารางราคา</a>
          <a href="#calculator" onClick={() => setMenuOpen(false)}>คำนวณราคา</a>
          <a href="#analysis" onClick={() => setMenuOpen(false)}>บทวิเคราะห์</a>
          <a href="#history" onClick={() => setMenuOpen(false)}>กราฟเทรด</a>
        </nav>
        <a className="contact-button" href="#calculator">ประเมินราคาขาย</a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
      </header>

      <MetalPriceBoard
        gold={market ? {
          buy: market.thaiGold.goldBar.buy,
          sell: market.thaiGold.goldBar.sell,
          buyChange: market.thaiGold.goldBar.buyChange,
          sellChange: market.thaiGold.goldBar.sellChange,
          hasPrevious: market.thaiGold.hasPrevious,
        } : undefined}
        silver={market ? {
          buy: market.silverBar.buy,
          sell: market.silverBar.sell,
          buyChange: market.silverBar.buyChange,
          sellChange: market.silverBar.sellChange,
          hasPrevious: market.silverBar.hasPrevious,
        } : undefined}
        goldMeta={market ? {
          date: market.thaiGold.date,
          announcementNo: market.thaiGold.announcementNo,
          announcedAt: market.thaiGold.announcedAt,
          ornamentBuy: market.thaiGold.ornament.buy,
          ornamentSell: market.thaiGold.ornament.sell,
        } : undefined}
        silverUpdatedAt={market?.silverBar.recordedAt}
        updatedAt={market?.updatedAt}
        loading={!market && !priceError}
      />

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className={`live-pill ${priceError ? "offline" : ""}`}><i /> {priceError || (isLive ? "LIVE DATA · ราคาจริงจาก GoldAPI" : "กำลังตรวจสอบข้อมูลตลาด")}</div>
          <p className="eyebrow">ซื้อ–ขายทองและเม็ดเงินอย่างมั่นใจ</p>
          <h1>เช็กราคาชัดเจน<br />ตัดสินใจได้ <em>ทันตลาด</em></h1>
          <p className="lead">ดู Gold Spot และ Silver Spot พร้อมราคาอ้างอิงในไทย บทวิเคราะห์รายวัน และเครื่องคำนวณราคารับซื้อในที่เดียว</p>
          <div className="hero-actions"><a className="primary" href="#prices">ดูราคาวันนี้</a><a className="secondary" href="tel:0959599936">โทร 095-959-9936</a></div>
          <div className="trust-row"><span>✓ ราคาโปร่งใส</span><span>✓ ประเมินฟรี</span><span>✓ ให้บริการโดยผู้เชี่ยวชาญ</span></div>
        </div>
        <div className="market-board">
          <div className="board-head"><span>ตลาดโลก</span><span className="market-open">● MARKET OPEN</span></div>
          <div className="spot-main"><div><small>GOLD SPOT / USD</small><strong>{formatPrice(goldPrice, "$")}</strong></div><b className={goldChange >= 0 ? "up" : "down"}>{isLive ? `${goldChange >= 0 ? "+" : ""}${goldChange.toFixed(2)}%` : "—"}</b></div>
          <LineChart values={histories.gold} color="#d5a62e" unit="Gold Spot" />
          <div className="spot-row"><span><i className="silver-dot" />SILVER SPOT</span><strong>{formatPrice(silverPrice, "$")}</strong><b className={silverChange >= 0 ? "up" : "down"}>{isLive ? `${silverChange >= 0 ? "+" : ""}${silverChange.toFixed(2)}%` : "—"}</b></div>
          <p className="data-note">{market ? `${isLive ? "ข้อมูลจริง" : "ข้อมูลสำรอง"}จาก ${market.source.toUpperCase()} · USD/THB ${market.usdThb.toFixed(2)}` : priceError || "กำลังเชื่อมต่อข้อมูลตลาด..."}</p>
        </div>
      </section>

      <section className="section" id="prices">
        <div className="section-heading"><div><p className="eyebrow">DASHBOARD</p><h2>ราคาทองและเม็ดเงินวันนี้</h2></div><div className="updated"><i /> อัปเดตล่าสุด<br /><b>{market ? new Date(market.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }) : "กำลังอัปเดต..."} น.</b></div></div>
        <div className="price-grid">
          <article className="price-card silver-card">
            <div className="card-title"><span className="metal-icon">Ag</span><div><small>ราคาเม็ดเงิน</small><h3>Silver 99.99%</h3></div><span className="trend">{silverChange >= 0 ? "↗" : "↘"} {silverChange.toFixed(2)}%</span></div>
            <div className="price-feature"><small>ราคาอ้างอิง / กิโลกรัม</small><strong>{formatPrice(rates.silver * 1000, "฿")}</strong><span>บาท</span></div>
            <div className="two-price"><div><small>ราคาอ้างอิง / กรัม</small><b>{formatPrice(rates.silver, "฿")}</b></div><div><small>ราคาโลก / ทรอยออนซ์</small><b>{formatPrice(silverPrice, "$")}</b></div></div>
            <div className="buyback"><span>มูลค่าเนื้อเงิน 99.99% / กรัม</span><b>{formatPrice(rates.silver * 0.9999, "฿")}</b></div>
          </article>
          <article className="price-card gold-card">
            <div className="card-title"><span className="metal-icon">Au</span><div><small>ราคาทองคำ</small><h3>Gold 96.5%</h3></div><span className="trend">{goldChange >= 0 ? "↗" : "↘"} {goldChange.toFixed(2)}%</span></div>
            <div className="price-feature"><small>ราคาอ้างอิง / บาททอง</small><strong>{formatPrice(goldBaht, "฿")}</strong><span>บาท</span></div>
            <div className="two-price"><div><small>มูลค่าเนื้อทอง 96.5%</small><b>{formatPrice(goldBaht * 0.965, "฿")}</b></div><div><small>ราคาอ้างอิง / กิโลกรัม</small><b>{formatPrice(rates.gold * 1000, "฿")}</b></div></div>
            <div className="buyback"><span>มูลค่าเนื้อทอง 96.5% / กรัม</span><b>{formatPrice(rates.gold * 0.965, "฿")}</b></div>
          </article>
        </div>
        <p className="vat-note">* ราคาขายออกยังไม่รวมภาษีมูลค่าเพิ่ม ราคาบนเว็บไซต์เป็นราคาอ้างอิง กรุณาติดต่อร้านเพื่อยืนยันราคาก่อนทำรายการ</p>
      </section>

      <section className="dark-section" id="history">
        <div className="section-heading light"><div><p className="eyebrow">TRADINGVIEW REAL-TIME CHART</p><h2>กราฟ Gold Spot และ Silver Spot</h2></div><span className="chart-source">แหล่งกราฟ: TradingView · OANDA</span></div>
        <div className="spot-chart-shell">
          <div className="spot-chart-tabs" role="tablist" aria-label="เลือกกราฟโลหะ">
            {(["gold", "silver"] as const).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={spotSymbol === item}
                className={spotSymbol === item ? "active" : ""}
                onClick={() => setSpotSymbol(item)}
              >
                <span className={`metal-tab-dot ${item}`} />
                {tradingViewSymbols[item].label}
              </button>
            ))}
          </div>
          <div className="spot-chart-frame">
            <TradingViewChart market={spotSymbol} />
          </div>
          <p className="tradingview-note">กราฟอัปเดตตามข้อมูลจาก TradingView และแหล่งราคา OANDA เวลาอาจแตกต่างจากราคาหน้าร้าน โปรดยืนยันราคาก่อนทำรายการ</p>
        </div>
        <div className="history-heading"><div><p className="eyebrow">PRICE HISTORY</p><h3>ภาพรวมราคาย้อนหลัง</h3></div><div className="range-buttons" aria-label="เลือกช่วงเวลา">{([["1D","1 วัน"],["7D","7 วัน"],["1M","1 เดือน"]] as const).map(([value,label]) => <button key={value} className={range === value ? "active" : ""} onClick={() => setRange(value)} aria-pressed={range === value}>{label}</button>)}</div></div>
        <div className="history-grid">
          <article className="history-card"><div className="history-head"><div><small>GOLD SPOT</small><h3>{formatPrice(goldPrice, "$")} <b>{isLive ? `${goldChange >= 0 ? "+" : ""}${goldChange.toFixed(2)}%` : "—"}</b></h3></div><span>USD / oz</span></div><LineChart values={histories.gold} color="#e0b342" unit="Gold Spot" /></article>
          <article className="history-card"><div className="history-head"><div><small>SILVER SPOT</small><h3>{formatPrice(silverPrice, "$")} <b>{isLive ? `${silverChange >= 0 ? "+" : ""}${silverChange.toFixed(2)}%` : "—"}</b></h3></div><span>USD / oz</span></div><LineChart values={histories.silver} color="#c9d0d6" unit="Silver Spot" /></article>
        </div>
      </section>

      <section className="section signal-section" id="analysis">
        <div className="section-heading">
          <div><p className="eyebrow">TECHNICAL SIGNALS</p><h2>สัญญาณและสถานะตลาด</h2></div>
          <span className={`demo-chip ${isLive ? "live" : ""}`}>{!market ? (priceError ? "LIVE UNAVAILABLE" : "LOADING") : isLive ? "LIVE DATA" : "DATA DELAYED"}</span>
        </div>
        <div className="signal-grid">
          <article className="bias-card buy"><small>สถานะหลัก</small><strong>{!isLive ? "WAIT" : trendUp ? "BUY BIAS" : "WAIT"}</strong><p>{!isLive ? "รอราคาจริงล่าสุดก่อนประเมินสัญญาณ" : trendUp ? "แนวโน้มระยะสั้นเป็นบวก แต่ควรรอจังหวะย่อตัวใกล้แนวรับ" : "ตลาดกำลังพักฐาน ควรรอการยืนยันแนวโน้มก่อนตัดสินใจ"}</p></article>
          <article className="indicator-card"><small>Gold Change</small><strong>{goldChange.toFixed(2)}%</strong><span className={goldChange >= 0 ? "positive" : "warning-text"}>รายวัน</span></article>
          <article className="indicator-card"><small>Silver Change</small><strong>{silverChange.toFixed(2)}%</strong><span>รายวัน</span></article>
          <article className="indicator-card"><small>USD / THB</small><strong>{market?.usdThb.toFixed(2) ?? "—"}</strong><span className="positive">อัตราอ้างอิง</span></article>
          <article className="indicator-card"><small>แหล่งข้อมูล</small><strong>{market?.source.toUpperCase() ?? "—"}</strong><span className="positive">{market?.isDemo ? "ข้อมูลสำรอง" : "ข้อมูลจริง"}</span></article>
        </div>
        <div className="alert-row" aria-label="คำเตือนตลาด">
          <span className="alert active">BUY Bias</span>
          <span className="alert">SELL Bias</span>
          <span className="alert">WAIT</span>
          <span className="alert active warning">High Volatility</span>
          <span className="alert">Oversold Warning</span>
          <span className="alert">Overbought Warning</span>
          <span className="alert active muted-alert">Data Delayed</span>
        </div>
        <div className="level-grid">
          <article><small>แนวรับที่ 1</small><b>${formatBaht(support1)}</b><span>โซนเฝ้าระวังแรงซื้อ</span></article>
          <article><small>แนวรับที่ 2</small><b>${formatBaht(support2)}</b><span>แนวรับเชิงโครงสร้าง</span></article>
          <article><small>แนวต้านที่ 1</small><b>${formatBaht(resistance1)}</b><span>แนวต้านระยะสั้น</span></article>
          <article><small>แนวต้านที่ 2</small><b>${formatBaht(resistance2)}</b><span>เป้าหมายถัดไป</span></article>
        </div>
      </section>

      <section className="section analysis-section">
        <div className="ai-card">
          <div className="ai-badge">AI</div>
          <div className="ai-copy"><p className="eyebrow">บทวิเคราะห์ประจำวัน</p><h2>{analysis[0] ?? "กำลังประมวลผลภาพรวมตลาด..."}</h2><p>{analysis.slice(1).join(" ") || "ระบบกำลังรวบรวมราคาล่าสุดและข้อมูลตลาดเพื่อจัดทำบทวิเคราะห์"}</p><div className="levels"><span><small>แนวรับทอง</small><b>${formatBaht(support1)}</b></span><span><small>แนวต้านทอง</small><b>${formatBaht(resistance1)}</b></span><span><small>แหล่งวิเคราะห์</small><b>{analysisSource}</b></span></div></div>
          <a className="ask-button" href={lineOaUrl} target="_blank" rel="noopener noreferrer">รับคำปรึกษาผ่าน LINE <span>→</span></a>
        </div>
        <div className="report-status">
          <div><i className="status-dot" /><span><small>สถานะรายงาน</small><b>ระบบวิเคราะห์พร้อมใช้งาน</b></span></div>
          <div><small>ข้อมูลราคา</small><b>{!market ? "กำลังเชื่อมต่อ" : market.isDemo ? "ข้อมูลสำรอง" : "GoldAPI ราคาจริง"}</b></div>
          <div><small>AI Analysis</small><b>{analysisSource}</b></div>
          <div><small>การบันทึกราคา</small><b>ทุก 15 นาที</b></div>
        </div>
        <div className="report-history">
          <div className="report-history-head"><div><p className="eyebrow">PRICE RECORDS</p><h3>ข้อมูลราคาที่บันทึกล่าสุด</h3></div><span>ข้อมูลจาก Supabase</span></div>
          <div className="report-list">
            {history.slice(0, 3).map((row) => <article key={`${row.symbol}-${row.recorded_at}`}><time>{new Date(row.recorded_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</time><b>{row.symbol}</b><p>USD {formatBaht(row.price_usd)} · ฿{formatBaht(row.price_thb_per_gram)} / กรัม</p><span>บันทึกอัตโนมัติ ✓</span></article>)}
            {!history.length && <article><time>{historyError ? "ตรวจสอบการเชื่อมต่อ" : "กำลังโหลด"}</time><b className="wait">PRICE HISTORY</b><p>{historyError || "กำลังดึงข้อมูลราคาที่บันทึกล่าสุด"}</p><span>{historyError ? "ไม่ใช้ข้อมูลตัวอย่างแทนข้อมูลจริง" : "โปรดรอสักครู่"}</span></article>}
          </div>
        </div>
      </section>

      <TradeDiary currentPrice={goldPrice || undefined} />

      <section className="calculator-wrap" id="calculator">
        <div className="calculator-copy"><p className="eyebrow">PRICE CALCULATOR</p><h2>คำนวณราคารับซื้อ<br />เงินหลอม / ทองหลอม</h2><p>ประเมินจากราคามาตรฐาน น้ำหนัก และเปอร์เซ็นต์ความบริสุทธิ์ โดยไม่มีค่าตรวจเช็กสินค้า ราคาสุดท้ายยืนยันตามน้ำหนักและผลตรวจความบริสุทธิ์ที่หน้างาน</p></div>
        <div className="calculator">
          <div className="tabs"><button className={metal === "silver" ? "active" : ""} onClick={() => selectMetal("silver")}>เงินหลอม</button><button className={metal === "gold" ? "active" : ""} onClick={() => selectMetal("gold")}>ทองหลอม</button></div>
          <label>น้ำหนัก <span>กรัม</span><input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} aria-label="น้ำหนักกรัม" /></label>
          <label>ความบริสุทธิ์ <span>เปอร์เซ็นต์ (%)</span><input inputMode="decimal" value={purity} onChange={(e) => setPurity(e.target.value)} aria-label="เปอร์เซ็นต์ความบริสุทธิ์" /></label>
          <div className="calc-rate"><span>ราคามาตรฐานโลหะบริสุทธิ์ / กรัม</span><b>฿{formatBaht(rates[metal])}</b></div>
          <div className="formula-note">สูตร: น้ำหนัก × ความบริสุทธิ์ ÷ 100 × ราคามาตรฐาน</div>
          <div className="calc-result"><small>ราคารับซื้อโดยประมาณ</small><strong>{selectedRate > 0 ? `฿${formatBaht(total)}` : "รอราคาจริง"}</strong><span>{selectedRate > 0 ? "บาท" : "ระบบจะคำนวณเมื่อเชื่อมต่อข้อมูลสำเร็จ"}</span></div>
          <p className="inspection-note">ไม่มีค่าตรวจเช็กสินค้า · ตรวจสอบและยืนยันราคาที่หน้างาน</p>
          <a className="line-add-button" href="https://lin.ee/sgjgisa" target="_blank" rel="noopener noreferrer">
            <img src="https://scdn.line-apps.com/n/line_add_friends/btn/th.png" alt="เพิ่มเพื่อน" height="36" />
          </a>
        </div>
      </section>

      <section className="section about" id="about">
        <div className="about-copy"><p className="eyebrow">GOLD2CASH</p><h2>บริการด้วยความจริงใจ<br />ให้ราคาตรงไปตรงมา</h2><p>ร้านทองแลกเงินรับซื้อทองคำ เม็ดเงิน เงินรูปพรรณ และโลหะมีค่า ตรวจสอบด้วยเครื่องมือมาตรฐาน พร้อมอธิบายทุกขั้นตอนก่อนตกลงราคา</p><div className="stats"><span><b>โปร่งใส</b><small>ชั่งต่อหน้า</small></span><span><b>รวดเร็ว</b><small>รู้ราคาทันที</small></span><span><b>ปลอดภัย</b><small>ข้อมูลเป็นส่วนตัว</small></span></div></div>
        <div className="shop-visual"><div className="shop-sign"><span className="brand-mark large"><img src="/gold2cash-logo.jpg" alt="" /></span><b>ทองแลกเงิน</b><small>GOLD2CASH</small></div><p>พื้นที่สำหรับภาพบรรยากาศร้านจริง</p></div>
      </section>

      <section className="contact-section">
        <div className="contact-panel"><p className="eyebrow">ติดต่อเรา</p><h2>พร้อมให้คำปรึกษาและประเมินราคา</h2><div className="contact-list"><a href="tel:0959599936"><small>โทรศัพท์</small><b>095-959-9936</b></a><a href={lineOaUrl} target="_blank" rel="noopener noreferrer"><small>LINE Official</small><b>เพิ่มเพื่อนผ่าน LINE OA</b></a><span><small>เวลาทำการ</small><b>09:00–19:00 น.</b><em>หยุดทุกวันอาทิตย์</em></span></div></div>
        <div className="map-embed">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.401802227494!2d99.86913887382602!3d13.814894795832144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e31d61f061560f%3A0xa7bfff108acf59bb!2z4Lij4LmJ4Liy4LiZIOC4l-C4reC4h-C5geC4peC4geC5gOC4h-C4tOC4mQ!5e0!3m2!1sth!2sth!4v1785123787380!5m2!1sth!2sth"
            title="แผนที่ร้านทองแลกเงิน"
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>

      <aside className="risk-notice"><b>คำเตือนความเสี่ยง</b><p>ข้อมูลราคา อินดิเคเตอร์ และบทวิเคราะห์บนเว็บไซต์จัดทำเพื่อเป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่คำแนะนำด้านการลงทุน ราคาหน้าร้านอาจเปลี่ยนแปลงตามตลาด ค่าเงินบาท คุณภาพโลหะ และผลการตรวจจริง กรุณายืนยันราคากับร้านก่อนทำรายการทุกครั้ง</p></aside>

      <footer><div className="brand"><span className="brand-mark"><img src="/gold2cash-logo.jpg" alt="" /></span><span><b>ทองแลกเงิน</b><small>GOLD2CASH</small></span></div><p>ราคาโปร่งใส บริการจริงใจ อัปเดตทันตลาด</p><small>© 2026 GOLD2CASH. ข้อมูลบนเว็บไซต์ไม่ใช่คำแนะนำด้านการลงทุน</small></footer>
    </main>
  );
}
