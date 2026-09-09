import { useEffect, useState } from "react";
import type { Customer, CustomerKind } from "../types";
import { CUSTOMER_KIND_META } from "../types";
import { BoxIcon, PillIcon, PlusIcon, TrashIcon, UserIcon, XIcon } from "../icons";

interface Props {
  open: boolean;
  customers: Customer[];
  onClose: () => void;
  onAdd: (c: Omit<Customer, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25";

export function CustomersModal({ open, customers, onClose, onAdd, onDelete }: Props) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CustomerKind>("pharmacy");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmId(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 2600);
    return () => clearTimeout(t);
  }, [confirmId]);

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) { setError("اسم الجهة مطلوب"); return; }
    if (customers.some((c) => c.name.trim() === name.trim())) { setError("توجد جهة مسجلة بنفس الاسم"); return; }
    onAdd({ name: name.trim(), kind, phone: phone.trim(), city: city.trim() || "غير محددة" });
    setName("");
    setPhone("");
    setCity("");
    setError("");
  };

  const pharmacies = customers.filter((c) => c.kind === "pharmacy");
  const warehouses = customers.filter((c) => c.kind === "warehouse");

  return (
    <div className="no-print fixed inset-0 z-[55] flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onClose}>
      <div className="anim-pop-in w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-white/12 text-xl text-cyan-200 ring-1 ring-white/20">
              <UserIcon />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">المذاخر والصيدليات</h2>
              <p className="text-xs text-cyan-200/80">{customers.length} جهة مسجلة — تُختار منها عند البيع</p>
            </div>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-white/70 transition-all hover:rotate-90 hover:bg-white/15 hover:text-white" title="إغلاق">
            <XIcon className="text-lg" />
          </button>
        </div>

        {/* إضافة جهة */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-200/70 p-1">
            {(["pharmacy", "warehouse"] as CustomerKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-extrabold transition-all ${
                  kind === k ? "bg-white text-cyan-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {k === "pharmacy" ? <PillIcon className="text-base" /> : <BoxIcon className="text-base" />}
                {CUSTOMER_KIND_META[k].label}
              </button>
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder={`اسم ال${CUSTOMER_KIND_META[kind].label} *`} />
            <input className={`${inputCls} tabular-nums`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الهاتف" dir="ltr" style={{ textAlign: "right" }} />
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="المحافظة" />
          </div>
          {error && <p className="anim-fade-in mt-2 text-xs font-bold text-rose-600">{error}</p>}
          <button
            onClick={submit}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0"
          >
            <PlusIcon />
            إضافة الجهة
          </button>
        </div>

        {/* القائمة */}
        <div className="max-h-[42vh] overflow-y-auto px-5 py-3">
          {[
            { title: "المذاخر", list: warehouses },
            { title: "الصيدليات", list: pharmacies },
          ].map((g) => (
            <div key={g.title} className="mb-2">
              <p className="mb-1.5 mt-2 text-[11px] font-extrabold text-slate-400">
                {g.title} <span className="tabular-nums">({g.list.length})</span>
              </p>
              {g.list.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-300">لا توجد جهات</p>
              ) : (
                <ul className="space-y-1.5">
                  {g.list.map((c) => {
                    const meta = CUSTOMER_KIND_META[c.kind];
                    return (
                      <li key={c.id} className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 transition-all hover:border-cyan-200 hover:shadow-sm">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-lg ring-1 ${c.kind === "pharmacy" ? "bg-emerald-50 text-emerald-600 ring-emerald-200/70" : "bg-sky-50 text-sky-600 ring-sky-200/70"}`}>
                          {c.kind === "pharmacy" ? <PillIcon /> : <BoxIcon />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{c.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {c.city} {c.phone && <span className="tabular-nums" dir="ltr">· {c.phone}</span>}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ring-1 ${meta.badge}`}>{meta.label}</span>
                        {confirmId === c.id ? (
                          <button
                            onClick={() => { onDelete(c.id); setConfirmId(null); }}
                            className="shrink-0 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-extrabold text-white transition-all hover:bg-rose-700"
                          >
                            متأكد؟
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmId(c.id)}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                            title="حذف"
                          >
                            <TrashIcon className="text-base" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
