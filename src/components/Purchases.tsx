import { useMemo, useState } from "react";
import type { Medicine, Purchase, PurchaseItem } from "../types";
import { COMPANIES, fmtDateTime, fmtMoney, fmtNum, medBreakdown, newId } from "../types";
import { CartIcon, CashIcon, CheckIcon, ChevronDownIcon, PlusIcon, TruckIcon, XIcon } from "../icons";

interface Props {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  pushToast: (type: "success" | "error" | "info", msg: string) => void;
}

export function Purchases({ medicines, setMedicines, purchases, setPurchases, pushToast }: Props) {
  const [company, setCompany] = useState(COMPANIES[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selId, setSelId] = useState("");
  const [qty, setQty] = useState(50);
  const [cost, setCost] = useState(0);
  const [formError, setFormError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [purchases]
  );

  const stats = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    let month = 0;
    let pendingCount = 0;
    let pendingValue = 0;
    for (const p of purchases) {
      if (new Date(p.date).getTime() >= cutoff) month += p.total;
      if (!p.received) {
        pendingCount++;
        pendingValue += p.total;
      }
    }
    return { month, pendingCount, pendingValue };
  }, [purchases]);

  const companyMeds = useMemo(() => medicines.filter((m) => m.company === company), [medicines, company]);
  const total = items.reduce((s, i) => s + i.qty * i.cost, 0);

  const pickMed = (id: string) => {
    setSelId(id);
    const m = medicines.find((x) => x.id === id);
    if (m) setCost(m.buyPrice);
  };

  const addItem = () => {
    setFormError("");
    if (!selId) { setFormError("اختر دواءً من القائمة"); return; }
    const m = medicines.find((x) => x.id === selId);
    if (!m) return;
    if (qty < 1) { setFormError("الكمية يجب أن تكون 1 على الأقل"); return; }
    if (cost < 0) { setFormError("أدخل كلفة صحيحة"); return; }
    setItems((list) => {
      const existing = list.find((i) => i.medicineId === selId);
      if (existing) return list.map((i) => (i.medicineId === selId ? { ...i, qty: i.qty + qty, cost } : i));
      return [...list, { medicineId: m.id, name: m.name, strength: m.strength, qty, cost }];
    });
    setSelId("");
    setQty(50);
  };

  const saveOrder = () => {
    setFormError("");
    if (items.length === 0) { setFormError("أضف مادة واحدة على الأقل للطلبية"); return; }
    const nextNumber = purchases.reduce((mx, p) => Math.max(mx, p.number), 500) + 1;
    const order: Purchase = {
      id: newId(),
      number: nextNumber,
      date: new Date().toISOString(),
      company,
      items,
      total,
      received: false,
    };
    setPurchases((list) => [order, ...list]);
    pushToast("success", `تم إنشاء الطلبية #${fmtNum(nextNumber)} من ${company} — بانتظار الاستلام`);
    setItems([]);
  };

  const receive = (p: Purchase) => {
    setPurchases((list) => list.map((x) => (x.id === p.id ? { ...x, received: true } : x)));
    setMedicines((list) =>
      list.map((m) => {
        const line = p.items.find((i) => i.medicineId === m.id);
        return line ? { ...m, qty: m.qty + line.qty, buyPrice: line.cost * m.stripsPerPiece } : m;
      })
    );
    pushToast("success", `تم استلام الطلبية #${fmtNum(p.number)} وإضافة ${fmtNum(p.items.reduce((s, i) => s + i.qty, 0))} قطعة للمخزون`);
  };

  return (
    <div className="space-y-5">
      <div className="anim-fade-up">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">المشتريات وطلبيات التجهيز</h1>
        <p className="mt-1 text-sm text-slate-400">اطلب من الشركات الأربع، وعند الاستلام تُضاف الكميات ويحدّث سعر الشراء تلقائياً</p>
      </div>

      {/* أرقام سريعة */}
      <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "مشتريات آخر 30 يوماً", value: fmtMoney(stats.month), icon: <TruckIcon />, chip: "bg-cyan-50 text-cyan-700 ring-cyan-200/70" },
          { label: "طلبات معلّقة", value: fmtNum(stats.pendingCount), icon: <CartIcon />, chip: "bg-amber-50 text-amber-700 ring-amber-200/70" },
          { label: "قيمة المعلّق", value: fmtMoney(stats.pendingValue), icon: <CashIcon />, chip: "bg-rose-50 text-rose-700 ring-rose-200/70" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className={`grid size-11 shrink-0 place-items-center rounded-lg text-[22px] ring-1 ${s.chip}`}>{s.icon}</span>
            <div>
              <p className="text-[13px] font-medium text-slate-400">{s.label}</p>
              <p className="font-display text-xl font-extrabold text-slate-900 tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* ===== طلبية جديدة ===== */}
        <section className="anim-fade-up self-start rounded-xl border border-slate-200/80 bg-white shadow-sm xl:col-span-2" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-2.5 rounded-t-xl border-b border-slate-100 bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-5 py-4 text-white">
            <TruckIcon className="text-xl text-cyan-200" />
            <div>
              <h2 className="font-display text-base font-extrabold">طلبية شراء جديدة</h2>
              <p className="text-[11px] text-cyan-200/80">تُحفظ كمعلّقة حتى تأكيد الاستلام</p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-slate-600">الشركة المجهّزة</span>
              <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-slate-100 p-1">
                {COMPANIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCompany(c); setSelId(""); }}
                    className={`rounded-md py-2 text-[12.5px] font-extrabold transition-all ${
                      company === c ? "bg-white text-cyan-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-slate-600">
                إضافة مادة <span className="font-normal text-slate-400">({fmtNum(companyMeds.length)} صنف من {company})</span>
              </span>
              <div className="relative">
                <select
                  value={selId}
                  onChange={(e) => pickMed(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/60 py-2.5 pe-9 ps-3.5 text-sm outline-none transition-all hover:border-slate-300 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                >
                  <option value="">— اختر دواءً من {company} —</option>
                  {companyMeds.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.strength} (المخزون: {fmtNum(m.qty)} شريط)
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="mt-2 flex gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] font-bold text-slate-400">الكمية (شريط)</span>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-center text-sm font-bold tabular-nums outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] font-bold text-slate-400">كلفة الشريط (د.ع)</span>
                  <input
                    type="number"
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-center text-sm font-bold tabular-nums outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                  />
                </label>
                <button
                  onClick={addItem}
                  className="mt-[22px] grid size-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg text-white transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0"
                  title="إضافة للطلبية"
                >
                  <PlusIcon />
                </button>
              </div>
              {selId && qty > 0 && (
                <p className="anim-fade-in mt-1.5 text-[11.5px] font-bold text-cyan-800">
                  التجهيز: {medBreakdown(medicines.find((x) => x.id === selId)!, qty)}
                </p>
              )}
            </div>

            {formError && (
              <p className="anim-fade-in rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-bold text-rose-700">{formError}</p>
            )}

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-7 text-center">
                <TruckIcon className="mx-auto text-2xl text-slate-300" />
                <p className="mt-2 text-[13px] font-medium text-slate-400">لم تُضف أي مادة للطلبية بعد</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {items.map((i) => (
                  <li key={i.medicineId} className="anim-fade-in flex items-center gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{i.name}</p>
                      <p className="text-[11px] text-slate-400">{i.strength} · كلفة {fmtMoney(i.cost)} × {fmtNum(i.qty)}</p>
                    </div>
                    <span className="font-display text-sm font-extrabold text-slate-900 tabular-nums">{fmtMoney(i.qty * i.cost)}</span>
                    <button
                      onClick={() => setItems((list) => list.filter((x) => x.medicineId !== i.medicineId))}
                      className="grid size-7 place-items-center rounded-md text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="إزالة"
                    >
                      <XIcon className="text-sm" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
              <span className="text-sm font-bold text-slate-300">إجمالي الطلبية</span>
              <span className="font-display text-lg font-extrabold tabular-nums">{fmtMoney(total)}</span>
            </div>

            <button
              onClick={saveOrder}
              disabled={items.length === 0}
              className="w-full rounded-xl bg-cyan-600 py-3 font-display text-[15px] font-bold text-white shadow-md shadow-cyan-600/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              حفظ الطلبية (معلّقة)
            </button>
          </div>
        </section>

        {/* ===== سجل الطلبيات ===== */}
        <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm xl:col-span-3" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold text-slate-900">سجل الطلبيات</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500 tabular-nums">{fmtNum(sorted.length)} طلبية</span>
          </div>

          {sorted.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">لا توجد طلبيات — أنشئ أول طلبية من النموذج المجاور</p>
          ) : (
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 bg-slate-50 text-right text-xs font-bold text-slate-500">
                    <th className="px-5 py-3">الرقم</th>
                    <th className="px-3 py-3">الشركة</th>
                    <th className="px-3 py-3">التاريخ</th>
                    <th className="px-3 py-3">الحالة</th>
                    <th className="px-3 py-3 text-left">الإجمالي</th>
                    <th className="px-3 py-3 text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <PurchaseRow key={p.id} p={p} expanded={expanded === p.id} onToggle={() => setExpanded(expanded === p.id ? null : p.id)} onReceive={() => receive(p)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PurchaseRow({ p, expanded, onToggle, onReceive }: { p: Purchase; expanded: boolean; onToggle: () => void; onReceive: () => void }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-cyan-50/40 ${expanded ? "bg-cyan-50/50" : ""}`}
        title="اضغط لعرض التفاصيل"
      >
        <td className="px-5 py-3 font-display font-extrabold text-slate-800 tabular-nums">#{p.number}</td>
        <td className="px-3 py-3">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200/70">{p.company}</span>
        </td>
        <td className="px-3 py-3 text-xs text-slate-400">{fmtDateTime(p.date)}</td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${p.received ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
            <span className={`size-1.5 rounded-full ${p.received ? "bg-emerald-500" : "bg-amber-500 pulse-danger"}`} style={p.received ? { animation: "none" } : undefined} />
            {p.received ? "مستلمة" : "معلّقة"}
          </span>
        </td>
        <td className="px-3 py-3 text-left font-display font-extrabold text-slate-900 tabular-nums">{fmtMoney(p.total)}</td>
        <td className="px-3 py-3 text-left">
          {p.received ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckIcon className="text-sm" />
              أُضيفت للمخزون
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onReceive(); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11.5px] font-extrabold text-white shadow-sm shadow-emerald-600/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
            >
              <TruckIcon className="text-sm" />
              استلام
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={6} className="px-6 py-4">
            <div className="anim-fade-in rounded-lg border border-slate-200/70 bg-white p-3">
              <p className="mb-2 text-[11px] font-extrabold text-slate-400">مواد الطلبية #{p.number} — {p.company}</p>
              <div className="space-y-1.5">
                {p.items.map((i) => (
                  <div key={i.medicineId} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="font-bold text-slate-700">
                      {i.name} <span className="font-normal text-slate-400">({i.strength})</span>
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {fmtNum(i.qty)} شريط × {fmtMoney(i.cost)}
                    </span>
                    <span className="font-display font-extrabold text-slate-800 tabular-nums">{fmtMoney(i.qty * i.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
