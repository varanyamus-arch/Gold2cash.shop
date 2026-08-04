"use client";

import { useEffect, useRef, useState } from "react";

export interface MetalPriceItem {
  buy: number;
  sell: number;
  buyChange?: number;
  sellChange?: number;
}

export interface MetalPriceBoardProps {
  gold?: MetalPriceItem;
  silver?: MetalPriceItem;
  updatedAt?: string;
  loading?: boolean;
}

function formatBaht(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(value);
}

const THAI_BAHT_WEIGHT_GRAMS = 15.244;
const GRAMS_PER_KILOGRAM = 1000;

function silverPerKilogramToPerBaht(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return value * (THAI_BAHT_WEIGHT_GRAMS / GRAMS_PER_KILOGRAM);
}

function ChangeIndicator({ value = 0 }: { value?: number }) {
  if (!Number.isFinite(value) || value === 0) {
    return (
      <span className="change neutral" aria-label="ราคาไม่เปลี่ยนแปลง">
        — 0 บาท
      </span>
    );
  }

  const isUp = value > 0;
  const amount = formatBaht(Math.abs(value));

  return (
    <span
      className={`change ${isUp ? "positive" : "negative"}`}
      aria-label={`${isUp ? "ราคาสูงขึ้น" : "ราคาลดลง"} ${amount} บาท`}
    >
      {isUp ? "▲ +" : "▼ "}
      {amount} บาท
    </span>
  );
}

export default function MetalPriceBoard({
  gold,
  silver,
  updatedAt,
  loading = false,
}: MetalPriceBoardProps) {
  const [goldFlash, setGoldFlash] = useState<"up" | "down" | null>(null);
  const [silverFlash, setSilverFlash] =
    useState<"up" | "down" | null>(null);

  const previousGoldBuy = useRef<number | undefined>(undefined);
  const previousSilverBuy = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentPrice = gold?.buy;
    const previousPrice = previousGoldBuy.current;

    if (currentPrice === undefined) return;

    if (previousPrice !== undefined) {
      if (currentPrice > previousPrice) {
        setGoldFlash("up");
      } else if (currentPrice < previousPrice) {
        setGoldFlash("down");
      } else {
        setGoldFlash(null);
      }
    }

    previousGoldBuy.current = currentPrice;

    const timer = window.setTimeout(() => {
      setGoldFlash(null);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [gold?.buy]);

  useEffect(() => {
    const currentPrice = silver?.buy;
    const previousPrice = previousSilverBuy.current;

    if (currentPrice === undefined) return;

    if (previousPrice !== undefined) {
      if (currentPrice > previousPrice) {
        setSilverFlash("up");
      } else if (currentPrice < previousPrice) {
        setSilverFlash("down");
      } else {
        setSilverFlash(null);
      }
    }

    previousSilverBuy.current = currentPrice;

    const timer = window.setTimeout(() => {
      setSilverFlash(null);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [silver?.buy]);

  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    })
    : null;

  if (loading || (!gold && !silver)) {
    return (
      <section
        className="metal-price-board-container"
        id="price-board"
        aria-busy="true"
        aria-label="กำลังโหลดราคาทองและเงินแท่ง"
      >
        <div className="board-header-row">
          <div className="board-title-group">
            <span className="live-status-pill">
              <span className="pulse-dot" aria-hidden="true" />
              LIVE
            </span>

            <h1 className="board-title">
              ราคาทองและเงินแท่ง (บาทละ) วันนี้
            </h1>
          </div>

          <div
            className="board-timestamp skeleton-box"
            style={{ width: 160, height: 24 }}
            aria-hidden="true"
          />
        </div>

        <div className="metal-price-grid">
          {[0, 1].map((item) => (
            <div
              className="metal-card skeleton-card"
              key={item}
              aria-hidden="true"
            >
              <div
                className="skeleton-line"
                style={{ width: "50%", height: 24 }}
              />
              <div
                className="skeleton-line"
                style={{ width: "100%", height: 40, margin: "14px 0" }}
              />
              <div
                className="skeleton-line"
                style={{ width: "100%", height: 40 }}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const goldBuyChange = gold?.buyChange ?? 0;
  const goldSellChange = gold?.sellChange ?? goldBuyChange;
  const silverBuyPerBaht = silverPerKilogramToPerBaht(silver?.buy);
  const silverSellPerBaht = silverPerKilogramToPerBaht(silver?.sell);

  const silverBuyChangePerBaht = silverPerKilogramToPerBaht(silver?.buyChange) ?? 0;

  const silverSellChangePerBaht = silverPerKilogramToPerBaht(silver?.sellChange ?? silver?.buyChange) ?? 0;
  const silverSellChange = silver?.sellChange ?? silverBuyChange;

  return (
    <section
      className="metal-price-board-container"
      id="price-board"
      aria-label="ตารางราคาทองและเงินแท่ง"
    >
      <div className="board-header-row">
        <div className="board-title-group">
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            LIVE
          </span>

          <h1 className="board-title">
            ราคาทองและเงินแท่ง (บาทละ) วันนี้
          </h1>

          <p className="board-description">
            ราคารับซื้อ / ขายออก พร้อมส่วนต่างจากราคาก่อนหน้า
          </p>
        </div>

        {formattedTime && (
          <div className="board-timestamp" role="status">
            <span>อัปเดตล่าสุด</span>
            <strong>{formattedTime} น.</strong>
          </div>
        )}
      </div>

      <div className="metal-price-grid">
        <article
          className={`metal-card metal-card-gold ${goldFlash ? `flash-${goldFlash}` : ""
            }`}
        >
          <div className="metal-heading">
            <h2>🟡 ทองคำแท่ง 96.5%</h2>
            <span className="unit-badge">บาทละ</span>
          </div>

          <div className="price-rows">
            <div className="price-row">
              <span className="row-label">รับซื้อ</span>
              <strong className="row-price">
                {formatBaht(gold?.buy)}
              </strong>
              <ChangeIndicator value={goldBuyChange} />
            </div>

            <div className="price-divider-h" aria-hidden="true" />

            <div className="price-row">
              <span className="row-label">ขายออก</span>
              <strong className="row-price">
                {formatBaht(gold?.sell)}
              </strong>
              <ChangeIndicator value={goldSellChange} />
            </div>
          </div>
        </article>

        <article
          className={`metal-card metal-card-silver ${silverFlash ? `flash-${silverFlash}` : ""
            }`}
        >
          <div className="metal-heading">
            <h2>⚪ เงินแท่ง 99.99%</h2>
            <span className="unit-badge">บาทละ</span>
          </div>

          <div className="price-rows">
            <div className="price-row">
              <span className="row-label">รับซื้อ</span>
              <strong className="row-price">
                {formatBaht(silverBuyPerBaht)}
              </strong>
              <ChangeIndicator value={silverBuyChangePerBaht} />
            </div>

            <div className="price-divider-h" aria-hidden="true" />

            <div className="price-row">
              <span className="row-label">ขายออก</span>
              <strong className="row-price">
                {formatBaht(silverSellPerBaht)}
              </strong>
              <ChangeIndicator value={silverSellChangePerBaht} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}