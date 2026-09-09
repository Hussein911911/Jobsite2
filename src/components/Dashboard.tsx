import { useMemo } from "react";
import type { Invoice, Medicine, Page, Status, User } from "../types";
import { STATUS_META, fmtDate, fmtMoney, fmtNum, getStatus, isApproved } from "../types";
import { StatCard } from "./Stats";
import { BarChart } from "./Charts";
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarClockIcon,
  CoinsIcon,
  PillIcon,
  ReceiptIcon,
} from "../icons";

interface Props {
  user: User;
  medicines: Medicine[];
  invoices: Invoice[];
  goTo: (page: Page, status?: Status | "all") => void;
}

function last7Days(invoices: Invoice[]) {
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 86_400_000;
    const value = invoices
      .filter((inv) => {
        if (!isApproved(inv)) return false;
        const t = new Date(inv.date).getTime();
        return t >= d.getTime() && t < next;
      })
      .reduce((s, inv) => s + inv.total, 0);
    days.push({ label: d.toLocaleDateString("ar", { weekday: "short" }), value });
  }
  return days;
}

export function Dashboard({ user, medicines, invoices, goTo }: Props) {
  const stats = useMemo(() => {
    let value = 0;
    let low = 0;
    let risk = 0;
    for (const m of medicines) {
      value += m.qty * m.sellPrice;
      const st = getStatus(m);
      if (st === "low" || st === "out") low++;
      if (st === "soon" || st === "expired") risk++;
    }
    return { value, low, risk };
  }, [medicines]);

  const weekSales = useMemo(() => last7Days(invoices), [invoices]);
  const weekTotal = weekSales.reduce((s, d) => s + d.value, 0);

  const critical = useMemo(
    () =>
      medicines
        .filter((m) => getStatus(m) !== "ok")
        .sort((a, b) => STATUS_META[getStatus(a)].rank - STATUS_META[getStatus(b)].rank)
        .slice(0, 6),
    [medicines]
  );

  const recent = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [invoices]
  );
  const unapprovedCount = invoices.filter((i) => !isApproved(i)).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "طاب يومك" : "مساء الخير";

  return (
    <div className="space-y-5">
      {/* ترحيب */}
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {greeting}، {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            هذه نظرة سريعة على حالة المخزون والمبيعات اليوم —{" "}
            {new Date().toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => goTo("sales")}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0"
        >
          <ReceiptIcon className="text-base" />
          فاتورة جديدة
        </button>
      </div>

      {/* تنبيه عاجل */}
      {stats.low + stats.risk > 0 && (
        <button
          onClick={() => goTo("alerts")}
          className="anim-fade-up flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-l from-amber-50 to-orange-50 px-4 py-3 text-start text-sm text-amber-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ animationDelay: "80ms" }}
        >
          <span className="flex items-center gap-3">
            <span className="pulse-danger grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-lg text-amber-600">
              <AlertIcon />
            </span>
            <span>
              <strong className="font-extrabold">{fmtNum(stats.low + stats.risk)} صنف يحتاج إجراءً عاجلاً</strong>
              <span className="text-amber-700/80"> — {fmtNum(stats.low)} منخفض/نافد و {fmtNum(stats.risk)} مشكلة صلاحية</span>
            </span>
          </span>
          <ArrowLeftIcon className="shrink-0 text-amber-500" />
        </button>
      )}

      {/* البطاقات */}
      <section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button onClick={() => goTo("inventory")} className="text-start">
          <StatCard title="إجمالي الأصناف" value={medicines.length} hint="اضغط لفتح سجل المخزون" icon={<PillIcon />} tone="cyan" />
        </button>
        <button onClick={() => goTo("reports")} className="text-start">
          <StatCard title="قيمة المخزون البيعية" value={stats.value} money hint="مجموع الكمية × سعر البيع" icon={<CoinsIcon />} tone="emerald" delay={60} />
        </button>
        <button onClick={() => goTo("inventory", "low")} className="text-start">
          <StatCard title="منخفض / نافد" value={stats.low} hint="أصناف بلغت حد الطلب أو نفدت" icon={<AlertIcon />} tone="amber" delay={120} />
        </button>
        <button onClick={() => goTo("inventory", "expired")} className="text-start">
          <StatCard title="مخاطر الصلاحية" value={stats.risk} hint="منتهية أو تنتهي خلال 90 يوماً" icon={<CalendarClockIcon />} tone="rose" delay={180} />
        </button>
      </section>

      {/* الرسوم والقوائم */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-3" style={{ animationDelay: "160ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900">مبيعات آخر 7 أيام</h2>
              <p className="mt-0.5 text-xs text-slate-400">إجمالي الفواتير اليومية</p>
            </div>
            <span className="rounded-lg bg-cyan-50 px-3 py-1.5 font-display text-sm font-extrabold text-cyan-800 ring-1 ring-cyan-200/70 tabular-nums">
              {fmtMoney(weekTotal)}
            </span>
          </div>
          <BarChart data={weekSales} />
        </div>

        <div className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2" style={{ animationDelay: "220ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-slate-900">أصناف تحتاج متابعة</h2>
            <button onClick={() => goTo("alerts")} className="text-xs font-bold text-cyan-700 underline-offset-4 transition-colors hover:text-cyan-800 hover:underline">
              عرض الكل
            </button>
          </div>
          {critical.length === 0 ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-6 text-center text-sm font-bold text-emerald-700">
              كل الأصناف بحالة ممتازة
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {critical.map((m) => {
                const st = getStatus(m);
                const meta = STATUS_META[st];
                return (
                  <li key={m.id} className="group flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0">
                    <span className={`size-2 shrink-0 rounded-full ${meta.dot} ${st === "expired" ? "pulse-danger" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {st === "low" || st === "out" ? `الكمية: ${fmtNum(m.qty)} · حد الطلب ${fmtNum(m.minQty)}` : fmtDate(m.expiry)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ring-1 ${meta.badge}`}>{meta.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* آخر الفواتير */}
      <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "280ms" }}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold text-slate-900">آخر الفواتير</h2>
          <div className="flex items-center gap-2">
            {unapprovedCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 tabular-nums">
                {fmtNum(unapprovedCount)} بانتظار الاعتماد
              </span>
            )}
            <button onClick={() => goTo("sales")} className="text-xs font-bold text-cyan-700 underline-offset-4 transition-colors hover:text-cyan-800 hover:underline">
              إدارة المبيعات
            </button>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">لا توجد فواتير بعد — أنشئ أول فاتورة من قسم المبيعات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-cyan-50/40">
                    <td className="px-5 py-3">
                      <p className="font-display font-extrabold text-slate-800 tabular-nums">#{inv.number}</p>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">{inv.customer}</td>
                    <td className="px-3 py-3 text-slate-400">{fmtNum(inv.items.length)} مادة</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{fmtDate(inv.date)}</td>
                    <td className="px-3 py-3">
                      {!isApproved(inv) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          غير معتمدة
                        </span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${inv.payment === "نقدي" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
                          {inv.payment}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-left font-display font-extrabold text-slate-900 tabular-nums">{fmtMoney(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
