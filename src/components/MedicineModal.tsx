import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Medicine } from "../types";
import { CATEGORIES, COMPANIES, FORMS, fmtMoney, fmtNum } from "../types";
import { PillIcon, XIcon } from "../icons";

interface Props {
  open: boolean;
  editing: Medicine | null;
  onClose: () => void;
  onSave: (data: Omit<Medicine, "id" | "createdAt">, id?: string) => void;
}

type FormState = Omit<Medicine, "id" | "createdAt">;

const EMPTY: FormState = {
  name: "",
  scientific: "",
  category: CATEGORIES[0],
  form: FORMS[0],
  strength: "",
  batch: "",
  prodDate: "",
  expiry: "",
  qty: 0,
  minQty: 0,
  buyPrice: 0,
  sellPrice: 0,
  company: COMPANIES[0],
  stripsPerPiece: 10,
  piecesPerCarton: 12,
};

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-bold text-slate-600">{label}</span>
      {children}
      {error && <span className="anim-fade-in mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25 ${
    err ? "border-rose-400 bg-rose-50/40" : "border-slate-200 hover:border-slate-300"
  }`;

export function MedicineModal({ open, editing, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      editing
        ? {
            name: editing.name,
            scientific: editing.scientific,
            category: editing.category,
            form: editing.form,
            strength: editing.strength,
            batch: editing.batch,
            prodDate: editing.prodDate,
            expiry: editing.expiry,
            qty: editing.qty,
            minQty: editing.minQty,
            buyPrice: editing.buyPrice,
            sellPrice: editing.sellPrice,
            company: editing.company,
            stripsPerPiece: editing.stripsPerPiece,
            piecesPerCarton: editing.piecesPerCarton,
          }
        : EMPTY
    );
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "اسم الدواء مطلوب";
    if (!form.scientific.trim()) errs.scientific = "الاسم العلمي مطلوب";
    if (!form.strength.trim()) errs.strength = "التركيز مطلوب";
    if (!form.batch.trim()) errs.batch = "رقم الباج مطلوب";
    if (!form.prodDate) errs.prodDate = "تاريخ الإنتاج مطلوب";
    if (!form.expiry) errs.expiry = "تاريخ الانتهاء مطلوب";
    if (form.prodDate && form.expiry && new Date(form.prodDate).getTime() >= new Date(form.expiry).getTime())
      errs.expiry = "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإنتاج";
    if (form.qty < 0) errs.qty = "الكمية لا يمكن أن تكون سالبة";
    if (form.sellPrice <= 0) errs.sellPrice = "أدخل سعر بيع صحيحاً";
    if (form.buyPrice < 0) errs.buyPrice = "سعر غير صالح";
    if (!form.stripsPerPiece || form.stripsPerPiece < 1) errs.stripsPerPiece = "قيمة غير صالحة";
    if (!form.piecesPerCarton || form.piecesPerCarton < 1) errs.piecesPerCarton = "قيمة غير صالحة";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(
      {
        ...form,
        name: form.name.trim(),
        scientific: form.scientific.trim(),
        batch: form.batch.trim(),
        company: form.company.trim() || COMPANIES[0],
      },
      editing?.id
    );
  };

  const margin = form.sellPrice - form.buyPrice;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="anim-pop-in w-full max-w-2xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-white/12 text-xl text-cyan-200 ring-1 ring-white/20">
              <PillIcon />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">
                {editing ? "تعديل دواء" : "إضافة دواء جديد"}
              </h2>
              <p className="text-xs text-cyan-200/80">
                {editing ? `تحديث بيانات «${editing.name}»` : "أدخل بيانات الصنف لإدراجه في المخزون"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-white/70 transition-all hover:rotate-90 hover:bg-white/15 hover:text-white"
            title="إغلاق"
          >
            <XIcon className="text-lg" />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="الاسم التجاري *" error={errors.name}>
              <input className={inputCls(errors.name)} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثال: بانادول إكسترا" />
            </Field>
            <Field label="الاسم العلمي *" error={errors.scientific}>
              <input className={inputCls(errors.scientific)} value={form.scientific} onChange={(e) => set("scientific", e.target.value)} placeholder="مثال: باراسيتامول" />
            </Field>
            <Field label="التركيز *" error={errors.strength}>
              <input className={inputCls(errors.strength)} value={form.strength} onChange={(e) => set("strength", e.target.value)} placeholder="مثال: 500 ملغ" />
            </Field>
            <Field label="التصنيف">
              <select className={inputCls()} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="الشركة المنتجة">
              <select className={inputCls()} value={form.company} onChange={(e) => set("company", e.target.value)}>
                {COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="الشكل الصيدلاني">
              <select className={inputCls()} value={form.form} onChange={(e) => set("form", e.target.value)}>
                {FORMS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="رقم الباج *" error={errors.batch}>
              <input className={`${inputCls(errors.batch)} font-mono tabular-nums`} value={form.batch} onChange={(e) => set("batch", e.target.value)} placeholder="مثال: 240312" dir="ltr" style={{ textAlign: "right" }} />
            </Field>
            <Field label="الكمية الحالية" error={errors.qty}>
              <input type="number" min={0} className={`${inputCls(errors.qty)} tabular-nums`} value={form.qty} onChange={(e) => set("qty", Number(e.target.value))} />
            </Field>
            <Field label="تاريخ الإنتاج *" error={errors.prodDate}>
              <input type="date" className={`${inputCls(errors.prodDate)} tabular-nums`} value={form.prodDate} onChange={(e) => set("prodDate", e.target.value)} />
            </Field>
            <Field label="تاريخ انتهاء الصلاحية *" error={errors.expiry}>
              <input type="date" className={`${inputCls(errors.expiry)} tabular-nums`} value={form.expiry} onChange={(e) => set("expiry", e.target.value)} />
            </Field>
            <Field label="حد الطلب (أدنى كمية)">
              <input type="number" min={0} className={`${inputCls()} tabular-nums`} value={form.minQty} onChange={(e) => set("minQty", Number(e.target.value))} />
            </Field>
            <Field label="سعر الشراء — للقطعة (د.ع)" error={errors.buyPrice}>
              <input type="number" min={0} step="any" className={`${inputCls(errors.buyPrice)} tabular-nums`} value={form.buyPrice} onChange={(e) => set("buyPrice", Number(e.target.value))} />
            </Field>
            <Field label="سعر القطعة — للبيع (د.ع) *" error={errors.sellPrice}>
              <input type="number" min={0} step="any" className={`${inputCls(errors.sellPrice)} tabular-nums`} value={form.sellPrice} onChange={(e) => set("sellPrice", Number(e.target.value))} />
            </Field>
            <Field label="أشرطة داخل القطعة *" error={errors.stripsPerPiece}>
              <input type="number" min={1} className={`${inputCls(errors.stripsPerPiece)} tabular-nums`} value={form.stripsPerPiece} onChange={(e) => set("stripsPerPiece", Number(e.target.value))} />
            </Field>
            <Field label="قطع داخل الكارتون *" error={errors.piecesPerCarton}>
              <input type="number" min={1} className={`${inputCls(errors.piecesPerCarton)} tabular-nums`} value={form.piecesPerCarton} onChange={(e) => set("piecesPerCarton", Number(e.target.value))} />
            </Field>
          </div>

          <p className="mt-3 rounded-lg bg-cyan-50 px-4 py-2.5 text-[12px] font-bold text-cyan-900 ring-1 ring-cyan-100">
            الكارتون الواحد = {fmtNum(Math.max(1, form.stripsPerPiece) * Math.max(1, form.piecesPerCarton))} شريط
            {form.sellPrice > 0 && (
              <span className="ms-2 text-cyan-700">· سعر الشريط ≈ {fmtMoney(Math.round(form.sellPrice / Math.max(1, form.stripsPerPiece)))}</span>
            )}
          </p>

          {/* هامش الربح الحي */}
          <div
            className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${
              margin > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : margin < 0
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span className="font-medium">هامش الربح للقطعة</span>
            <span className="font-display font-bold tabular-nums">
              {margin > 0 ? "+" : ""}
              {fmtNum(margin)} د.ع
              {form.buyPrice > 0 && margin > 0 && (
                <span className="ms-2 text-xs font-medium opacity-70">({Math.round((margin / form.buyPrice) * 100)}%)</span>
              )}
            </span>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-md active:translate-y-0"
          >
            {editing ? "حفظ التعديلات" : "إضافة الدواء"}
          </button>
        </div>
      </div>
    </div>
  );
}
