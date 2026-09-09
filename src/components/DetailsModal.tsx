import { useEffect } from "react";
import type { Medicine } from "../types";
import {
  STATUS_META,
  daysUntil,
  expiryLabel,
  fmtDate,
  fmtMoney,
  fmtNum,
  getStatus,
  medBreakdown,
  shelfLife,
  stripPriceOf,
} from "../types";
import { CalendarClockIcon, PencilIcon, TrashIcon, XIcon } from "../icons";

interface Props {
  medicine: Medicine | null;
  onClose: () => void;
  onEdit: (m: Medicine) => void;
  onDelete: (m: Medicine) => void;
}

function Tile({ label, value, sub, mono, tone }: { label: string; value: string; sub?: string; mono?: boolean; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 transition-colors hover:border-cyan-200 hover:bg-cyan-50/40">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-extrabold text-slate-800 ${mono ? "font-mono tabular-nums" : ""} ${tone ?? ""}`} dir={mono ? "ltr" : undefined} style={mono ? { textAlign: "right" } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export function DetailsModal({ medicine, onClose, onEdit, onDelete }: Props) {
  useEffect(() => {
    if (!medicine) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [medicine, onClose]);

  if (!medicine) return null;

  const m = medicine;
  const st = getStatus(m);
  const meta = STATUS_META[st];
  const d = daysUntil(m.expiry);
  const margin = m.sellPrice - m.buyPrice;
  const stockValue = m.qty * m.sellPrice;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="anim-pop-in w-full max-w-xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* الرأس */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-6 py-5 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='white'%3E%3Cpath d='M21 12h6v9h9v6h-9v9h-6v-9h-9v-6h9z'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/12 font-display text-base font-black text-cyan-200 ring-1 ring-white/25">
                {m.name.slice(0, 2)}
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold leading-tight">
                  {m.name} <span className="text-cyan-200/90">· {m.strength}</span>
                </h2>
                <p className="mt-1 text-[13px] text-cyan-100/85">{m.scientific}</p>
                <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${meta.badge}`}>
                  <span className={`size-1.5 rounded-full ${meta.dot} ${st === "expired" ? "pulse-danger" : ""}`} />
                  {meta.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-white/70 transition-all hover:rotate-90 hover:bg-white/15 hover:text-white"
              title="إغلاق"
            >
              <XIcon className="text-lg" />
            </button>
          </div>
        </div>

        {/* التفاصيل */}
        <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Tile label="التصنيف" value={m.category} />
            <Tile label="الشركة المنتجة" value={m.company} />
            <Tile label="الشكل الصيدلاني" value={m.form} />
            <Tile label="رقم الباج" value={m.batch} mono />
            <Tile label="تاريخ الإنتاج" value={fmtDate(m.prodDate)} sub={`مدة الصلاحية: ${shelfLife(m.prodDate, m.expiry)}`} />
            <Tile
              label="تاريخ الانتهاء"
              value={fmtDate(m.expiry)}
              sub={expiryLabel(m.expiry)}
              tone={d < 0 ? "text-rose-600" : d <= 90 ? "text-orange-600" : ""}
            />
            <Tile
              label="الكمية الحالية (شريط)"
              value={fmtNum(m.qty)}
              sub={`التجهيز: ${medBreakdown(m, m.qty)} · حد الطلب ${fmtNum(m.minQty)}`}
              tone={m.qty === 0 ? "text-rose-600" : m.qty <= m.minQty ? "text-amber-600" : ""}
            />
            <Tile
              label="التغليف"
              value={`${fmtNum(m.stripsPerPiece)} شريط / قطعة`}
              sub={`${fmtNum(m.piecesPerCarton)} قطعة / كارتون = ${fmtNum(m.stripsPerPiece * m.piecesPerCarton)} شريط`}
            />
            <Tile label="سعر القطعة (بيع)" value={fmtMoney(m.sellPrice)} sub={`الشريط ≈ ${fmtMoney(stripPriceOf(m))}`} />
            <Tile label="سعر الشراء" value={fmtMoney(m.buyPrice)} />
          </div>

          {/* شريط مالي */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${margin > 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <span className={`text-[12px] font-bold ${margin > 0 ? "text-emerald-700" : "text-rose-700"}`}>ربح القطعة</span>
              <span className={`font-display text-sm font-extrabold tabular-nums ${margin > 0 ? "text-emerald-800" : "text-rose-700"}`}>
                {margin > 0 ? "+" : ""}{fmtNum(margin)} د.ع
                {m.buyPrice > 0 && margin > 0 && (
                  <span className="ms-1 text-[11px] font-bold opacity-70">({Math.round((margin / m.buyPrice) * 100)}%)</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
              <span className="text-[12px] font-bold text-cyan-700">قيمة الكمية الموجودة</span>
              <span className="font-display text-sm font-extrabold text-cyan-900 tabular-nums">{fmtMoney(stockValue)}</span>
            </div>
          </div>

          {/* مؤشر الصلاحية */}
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center justify-between text-[12px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CalendarClockIcon className="text-base text-cyan-700" />
                خط الصلاحية الزمني
              </span>
              <span className={d < 0 ? "text-rose-600" : d <= 90 ? "text-orange-600" : "text-emerald-600"}>
                {d < 0 ? "منتهي" : d <= 90 ? "مرحلة حرجة" : "سليم"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${d < 0 ? "bg-rose-500" : d <= 90 ? "bg-orange-500" : "bg-gradient-to-l from-emerald-500 to-cyan-500"}`}
                style={{ width: `${Math.max(4, Math.min(100, (d / 730) * 100 + (d < 0 ? 0 : 4)))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-400 tabular-nums">
              <span>الإنتاج: {fmtDate(m.prodDate)}</span>
              <span>الانتهاء: {fmtDate(m.expiry)}</span>
            </div>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={() => onDelete(m)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition-all hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-0"
          >
            <TrashIcon className="text-base" />
            حذف
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              إغلاق
            </button>
            <button
              onClick={() => onEdit(m)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-md active:translate-y-0"
            >
              <PencilIcon className="text-base" />
              تعديل البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

