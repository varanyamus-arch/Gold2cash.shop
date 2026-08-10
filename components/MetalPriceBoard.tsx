"use client";

export type PriceChange = number | null | undefined;

export interface MetalPriceItem {
  buy: number;
  sell: number;
  buyChange?: PriceChange;
  sellChange?: PriceChange;
  hasPrevious?: boolean;
}

export interface ThaiGoldMeta {
  date?: string;
  announcementNo?: number | null;
  announcedAt?: string;
  ornamentBuy?: number;
  ornamentSell?: number;
}

export interface MetalPriceBoardProps {
  gold?: MetalPriceItem;
  silver?: MetalPriceItem;
  goldMeta?: ThaiGoldMeta;
  silverUpdatedAt?: string;
  updatedAt?: string;
  loading?: boolean;
}

function formatBaht(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function ChangeIndicator({ value, hasPrevious }: { value: PriceChange; hasPrevious?: boolean }) {
  if (!hasPrevious || value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="board-change waiting">รอราคาก่อนหน้า</span>;
  }

  if (value === 0) {
    return <span className="board-change unchanged" aria-label="ราคาไม่เปลี่ยนแปลง">• 0 บาท</span>;
  }

  const isUp = value > 0;
  return (
    <span
      className={`board-change ${isUp ? "positive" : "negative"}`}
      aria-label={`${isUp ? "ราคาปรับขึ้น" : "ราคาปรับลง"} ${formatBaht(Math.abs(value))} บาท`}
    >
      <span aria-hidden="true">{isUp ? "▲" : "▼"}</span> {formatBaht(Math.abs(value))} บาท
    </span>
  );
}

function PriceColumn({
  label,
  value,
  change,
  hasPrevious,
}: {
  label: string;
  value?: number;
  change?: PriceChange;
  hasPrevious?: boolean;
}) {
  return (
    <div className="board-price-column">
      <span className="board-price-label">{label}</span>
      <strong className="board-price-value">{formatBaht(value)}</strong>
      <ChangeIndicator value={change} hasPrevious={hasPrevious} />
    </div>
  );
}

function formatUpdatedAt(value?: string) {
  if (!value) return "กำลังอัปเดต";
  return new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

export default function MetalPriceBoard({
  gold,
  silver,
  goldMeta,
  silverUpdatedAt,
  updatedAt,
  loading = false,
}: MetalPriceBoardProps) {
  return (
    <section className="metal-price-board-container" id="price-board" aria-label="Price Board ราคาทองและเงินแท่งวันนี้">
      <header className="board-header-row">
        <div>
          <p className="board-kicker">PRICE BOARD · LIVE PRECIOUS METALS</p>
          <h1 className="board-title">Price Board ราคาทองและเงินแท่ง <span>(บาทละ)</span> วันนี้</h1>
          <p className="board-description">ราคาอ้างอิงจริง รับซื้อ–ขายออก และผลต่างจากข้อมูลก่อนหน้า</p>
        </div>
        <div className="board-live-block" role="status">
          <span className={`live-status-pill ${loading ? "loading" : ""}`}><i />{loading ? "CONNECTING" : "LIVE"}</span>
          <small>อัปเดตล่าสุด</small>
          <strong>{formatUpdatedAt(updatedAt)} น.</strong>
        </div>
      </header>

      <div className="metal-price-grid" aria-busy={loading}>
        <article className="metal-card" data-metal="gold">
          <div className="metal-card-head">
            <span className="metal-ingot-icon gold" aria-hidden="true">Au</span>
            <div>
              <h2>ทองคำแท่ง 96.5%</h2>
              <p>อ้างอิงสมาคมค้าทองคำไทย · บาทละ</p>
            </div>
          </div>

          <div className="board-price-pair">
            <PriceColumn label="รับซื้อ" value={gold?.buy} change={gold?.buyChange} hasPrevious={gold?.hasPrevious} />
            <PriceColumn label="ขายออก" value={gold?.sell} change={gold?.sellChange} hasPrevious={gold?.hasPrevious} />
          </div>

          <div className="gold-announcement">
            <span><small>วันที่ประกาศ</small><b>{goldMeta?.date || "รอข้อมูล"}</b></span>
            <span><small>ประกาศล่าสุด</small><b>{goldMeta?.announcementNo ? `ครั้งที่ ${goldMeta.announcementNo}` : "รอข้อมูล"}</b></span>
            <span className="announcement-time"><small>เวลา</small><b>{goldMeta?.announcedAt || "รอข้อมูล"}</b></span>
          </div>

          <div className="ornament-row">
            <span>ทองรูปพรรณ</span>
            <span><small>รับซื้อ</small><b>{formatBaht(goldMeta?.ornamentBuy)}</b></span>
            <span><small>ขายออก</small><b>{formatBaht(goldMeta?.ornamentSell)}</b></span>
          </div>
        </article>

        <article className="metal-card" data-metal="silver">
          <div className="metal-card-head">
            <span className="metal-ingot-icon silver" aria-hidden="true">Ag</span>
            <div>
              <h2>เงินแท่ง 99.99%</h2>
              <p>อ้างอิง Silver Spot · บาทละ</p>
            </div>
          </div>

          <div className="board-price-pair">
            <PriceColumn label="รับซื้อ" value={silver?.buy} change={silver?.buyChange} hasPrevious={silver?.hasPrevious} />
            <PriceColumn label="ขายออก" value={silver?.sell} change={silver?.sellChange} hasPrevious={silver?.hasPrevious} />
          </div>

          <div className="silver-live-row">
            <span><i /> LIVE · อัปเดตวันละ 1 ครั้ง</span>
            <b>{formatUpdatedAt(silverUpdatedAt)} น.</b>
          </div>
          <p className="board-source-note">ระบบจะแสดงทิศทางเมื่อมีราคาจริงก่อนหน้าเท่านั้น และไม่สร้างตัวเลขจำลอง</p>
        </article>
      </div>
    </section>
  );
}

