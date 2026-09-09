import { useEffect, useMemo, useState } from "react";
import type { InvoiceItem, Medicine, SaleUnit } from "../types";
import {
  fmtBreakdown,
  fmtMoney,
  fmtNum,
  medBreakdown,
  rowTotal,
  unitCostOf,
  unitLabel,
  unitPriceOf,
} from "../types";
import { BoxIcon, CalendarClockIcon, ChevronDownIcon, CoinsIcon, PlusIcon, XIcon } from "../icons";

interface Props {
  medicine: Medicine;
  availableStrips: number; // المتاح بعد خصم سلة الفاتورة الحالية
  initial?: { unit: SaleUnit; qty: number; price: number; discountPct: number };
  editMode?: boolean;
  onClose: () => void;
  onAdd: (item: InvoiceItem, keepOpen: boolean) => void;
}

const fieldCls =
  "w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/25";

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 text-[12px] font-extrabold tracking-wide text-slate-400">
      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[14px] text-slate-500">{icon}</span>
      {text}
      <span className="h-px flex-1 bg-slate-100" />
    </p>
  );
}

export function MaterialPicker({ medicine: m, availableStrips, initial, editMode, onClose, onAdd }: Props) {
  const [unit, setUnit] = useState<SaleUnit>(initial?.unit ?? "piece");
  const [qty, setQty] = useState(initial ? String(initial.qty) : "");
  const [price, setPrice] = useState(() => initial?.price ?? unitPriceOf(m, initial?.unit ?? "piece"));
  const [discountPct, setDiscountPct] = useState(initial && initial.discountPct > 0 ? String(initial.discountPct) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const changeUnit = (u: SaleUnit) => {
    setUnit(u);
    setPrice(unitPriceOf(m, u));
    setError("");
  };

  const calc = useMemo(() => {
    const q = Number(qty) || 0;
    const disc = Math.min(100, Math.max(0, Number(discountPct) || 0));
    const strips = unit === "piece" ? q * m.stripsPerPiece : q;
    const subtotal = q * price;
    const total = rowTotal(q, price, disc);
    const saved = subtotal - total;
    return { q, disc, strips, subtotal, total, saved };
  }, [unit, qty, price, discountPct, m]);

  const buildItem = (): InvoiceItem => ({
    medicineId: m.id,
    name: m.name,
    strength: m.strength,
    unit,
    qty: Number(qty),
    strips: calc.strips,
    price,
    cost: unitCostOf(m, unit),
    discountPct: calc.disc,
    total: calc.total,
  });

  const add = (keepOpen: boolean) => {
    const q = Number(qty);
    if (!q || q < 1) { setError("أدخل الكمية المطلوبة (1 على الأقل)"); return; }
    if (!price || price <= 0) { setError("أدخل سعر وحدة صحيحاً"); return; }
    if (calc.strips > availableStrips) {
      setError(`المتاح ${fmtNum(availableStrips)} شريط فقط (${medBreakdown(m, availableStrips)})`);
      return;
    }
    onAdd(buildItem(), keepOpen);
    if (keepOpen) {
      setQty("");
      setDiscountPct("");
      setError("");
    }
  };

  return (
    <div className="no-print fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/55 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="anim-pop-in flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ===== رأس ثابت ===== */}
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[21px] font-black leading-tight text-slate-900">
                {editMode ? "تعديل مادة بالقائمة" : "إضافة مادة للمباعة"}
              </h2>
              <p className="mt-1 text-[12.5px] font-medium text-slate-400">
                {m.name} · {m.strength} — {m.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-all hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
              title="إغلاق"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* ===== محتوى منزلق ===== */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* 1) معلومات المخزون */}
            <section>
              <SectionLabel icon={<BoxIcon />} text="معلومات المخزون" />
              <div className="space-y-2 rounded-2xl border-2 border-cyan-200/80 bg-cyan-50/70 px-4 py-3.5 text-[13.5px] leading-6">
                <p className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="font-medium text-slate-500">المادة</span>
                  <strong className="font-extrabold text-slate-900">{m.name} · {m.strength}</strong>
                </p>
                <p className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="font-medium text-slate-500">المخزون المتاح</span>
                  <span>
                    <strong className="font-extrabold text-emerald-700 tabular-nums">{fmtNum(availableStrips)} شريط</strong>
                    <span className="ms-1.5 text-[11.5px] font-bold text-emerald-700/70">({medBreakdown(m, availableStrips)})</span>
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="font-medium text-slate-500">التعبئة</span>
                  <span className="font-extrabold tabular-nums">
                    {fmtNum(m.piecesPerCarton)} قطعة/كارتون × {fmtNum(m.stripsPerPiece)} شريط/قطعة
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2 border-t border-cyan-200/60 pt-2 text-slate-700">
                  <span className="font-medium text-slate-500">رقم الباج</span>
                  <span className="rounded-md bg-cyan-100 px-2 py-0.5 font-mono text-[11.5px] font-bold text-cyan-800" dir="ltr">{m.batch}</span>
                </p>
              </div>
            </section>

            {/* 2) تفاصيل البيع */}
            <section>
              <SectionLabel icon={<CoinsIcon />} text="تفاصيل البيع" />
              <div className="space-y-3">
                <div>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-500">وحدة التجهيز</span>
                  <div className="relative">
                    <select
                      value={unit}
                      onChange={(e) => changeUnit(e.target.value as SaleUnit)}
                      className={`${fieldCls} cursor-pointer appearance-none border-cyan-300/70 pe-10 text-cyan-900 hover:border-cyan-400 focus:border-cyan-500`}
                    >
                      <option value="piece">التجهيز حسب القطعة — {fmtMoney(m.sellPrice)}</option>
                      <option value="strip">التجهيز حسب الشريط — {fmtMoney(unitPriceOf(m, "strip"))}</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-500">الكمية المطلوبة بال{unitLabel(unit)}</span>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => { setQty(e.target.value); setError(""); }}
                    placeholder="0"
                    autoFocus
                    className={`${fieldCls} border-slate-200 tabular-nums hover:border-slate-300 focus:border-cyan-500`}
                  />
                </div>

                <div>
                  <span className="mb-1.5 flex items-center justify-between text-[12px] font-bold text-slate-500">
                    نسبة الخصم % (اختياري)
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400">الحد الأقصى 100</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPct}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDiscountPct(raw === "" ? "" : String(Math.min(100, Math.max(0, Number(raw) || 0))));
                      setError("");
                    }}
                    placeholder="0"
                    className={`${fieldCls} border-slate-200 tabular-nums hover:border-slate-300 focus:border-cyan-500`}
                  />
                </div>

                <div>
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-500">سعر الوحدة (د.ع)</span>
                  <input
                    type="number"
                    min={0}
                    value={price || ""}
                    onChange={(e) => { setPrice(Number(e.target.value)); setError(""); }}
                    placeholder="0"
                    className={`${fieldCls} border-slate-200 tabular-nums hover:border-slate-300 focus:border-cyan-500`}
                  />
                </div>
              </div>
            </section>

            {/* 3) معاينة التجهيز */}
            <section>
              <SectionLabel icon={<CalendarClockIcon />} text="معاينة التجهيز" />
              {calc.q > 0 ? (
                <div className="anim-fade-in overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                  <div className="flex items-center justify-between px-4 py-3 text-[12.5px] font-bold">
                    <span className="text-slate-300">التجهيز من المخزون</span>
                    <span className="font-display text-[13px] text-cyan-200">{fmtBreakdown(calc.strips, m.stripsPerPiece, m.piecesPerCarton)}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/10 border-t border-white/10 text-center">
                    {(() => {
                      const { cartons, pieces, strips } = (() => {
                        const spp = Math.max(1, m.stripsPerPiece);
                        const spc = spp * Math.max(1, m.piecesPerCarton);
                        const t = Math.max(0, Math.floor(calc.strips));
                        return { cartons: Math.floor(t / spc), pieces: Math.floor((t % spc) / spp), strips: t % spp };
                      })();
                      return [
                        { l: "كارتون", v: cartons },
                        { l: "قطعة", v: pieces },
                        { l: "شريط", v: strips },
                      ].map((c) => (
                        <div key={c.l} className="py-2.5">
                          <p className="font-display text-lg font-black tabular-nums text-white">{fmtNum(c.v)}</p>
                          <p className="text-[10.5px] font-bold text-slate-400">{c.l}</p>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-[12px] font-bold text-slate-300">
                      {fmtNum(calc.q)} {unitLabel(unit)} × {fmtMoney(price)}
                      {calc.disc > 0 && <span className="ms-2 text-emerald-300">خصم {fmtNum(calc.disc)}٪</span>}
                    </span>
                    <span className="font-display text-lg font-black tabular-nums text-cyan-200">{fmtMoney(calc.total)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                  <p className="text-[12.5px] font-bold text-slate-400">أدخل الكمية لعرض تفاصيل التجهيز والإجمالي</p>
                </div>
              )}
            </section>

            {error && (
              <p className="anim-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-700">{error}</p>
            )}
          </div>
        </div>

        {/* ===== تذييل ثابت ===== */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              onClick={() => add(false)}
              className="rounded-xl bg-slate-900 px-6 py-3 font-display text-[15px] font-extrabold text-white shadow-md shadow-slate-900/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-lg active:translate-y-0"
            >
              {editMode ? "حفظ التعديل" : "تأكيد الاضافة"}
            </button>
            {!editMode && (
              <button
                onClick={() => add(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-[14px] font-bold text-white shadow-sm shadow-cyan-600/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0"
                title="إضافة السطر وإبقاء البطاقة مفتوحة لمادة أخرى"
              >
                <PlusIcon className="text-base" />
                اضافة ومتابعة
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[15px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              الغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
