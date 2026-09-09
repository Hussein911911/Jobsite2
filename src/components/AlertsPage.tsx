import { useMemo } from "react";
import type { Medicine, Page, Status } from "../types";
import { STATUS_META, daysUntil, expiryLabel, fmtDate, fmtNum, getStatus } from "../types";
import { AlertIcon, ArrowLeftIcon, CalendarClockIcon, CheckIcon } from "../icons";

interface Props {
  medicines: Medicine[];
  goTo: (page: Page, status?: Status | "all") => void;
}

interface Group {
  key: Status;
  title: string;
  desc: string;
  icon: React.ReactNode;
  head: string;
  items: Medicine[];
}

export function AlertsPage({ medicines, goTo }: Props) {
  const groups = useMemo<Group[]>(() => {
    const buckets: Record<Status, Medicine[]> = { ok: [], low: [], out: [], soon: [], expired: [] };
    for (const m of medicines) buckets[getStatus(m)].push(m);
    const sortExp = (a: Medicine, b: Medicine) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
    return [
      {
        key: "expired",
        title: "منتهية الصلاحية",
        desc: "يجب سحبها من التداول فوراً وإتلافها حسب الأصول",
        icon: <AlertIcon />,
        head: "border-rose-200 bg-rose-50 text-rose-800",
        items: [...buckets.expired].sort(sortExp),
      },
      {
        key: "soon",
        title: "تنتهي خلال 90 يوماً",
        desc: "رشّحها للعروض أو أعدها للمجهز قبل انتهاء صلاحيتها",
        icon: <CalendarClockIcon />,
        head: "border-orange-200 bg-orange-50 text-orange-800",
        items: [...buckets.soon].sort(sortExp),
      },
      {
        key: "out",
        title: "نافدة من المخزون",
        desc: "الكمية صفر — مطلوب طلبية شراء عاجلة",
        icon: <AlertIcon />,
        head: "border-rose-200 bg-rose-50/70 text-rose-700",
        items: [...buckets.out],
      },
      {
        key: "low",
        title: "بلغت حد الطلب",
        desc: "الكمية عند حد الطلب أو دونه — خطط لإعادة التزويد",
        icon: <AlertIcon />,
        head: "border-amber-200 bg-amber-50 text-amber-800",
        items: [...buckets.low],
      },
    ];
  }, [medicines]);

  const totalAlerts = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="space-y-5">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">مركز التنبيهات</h1>
          <p className="mt-1 text-sm text-slate-400">كل الأصناف التي تحتاج إجراءً مرتبة حسب الخطورة</p>
        </div>
        <span className={`rounded-full px-4 py-2 font-display text-sm font-extrabold ring-1 ${totalAlerts > 0 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
          {totalAlerts > 0 ? `${fmtNum(totalAlerts)} تنبيه نشط` : "لا تنبيهات — ممتاز"}
        </span>
      </div>

      {totalAlerts === 0 && (
        <div className="anim-pop-in rounded-xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-[30px] text-emerald-600 ring-1 ring-emerald-200">
            <CheckIcon />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-slate-900">المخزون بحالة صحية</h2>
          <p className="mt-1.5 text-sm text-slate-400">لا توجد أصناف منتهية أو منخفضة أو قرب الانتهاء حالياً.</p>
        </div>
      )}

      <div className="space-y-4">
        {groups.filter((g) => g.items.length > 0).map((g, gi) => (
          <section key={g.key} className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: `${gi * 70}ms` }}>
            <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5 ${g.head}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{g.icon}</span>
                <div>
                  <h2 className="font-display text-[15px] font-extrabold">{g.title}</h2>
                  <p className="text-[11px] opacity-75">{g.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-extrabold tabular-nums ring-1 ring-current/15">
                  {fmtNum(g.items.length)} صنف
                </span>
                <button
                  onClick={() => goTo("inventory", g.key)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-extrabold ring-1 ring-current/15 transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  فتح في المخزون
                  <ArrowLeftIcon className="text-sm" />
                </button>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {g.items.map((m) => {
                const d = daysUntil(m.expiry);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80">
                    <span className={`size-2 shrink-0 rounded-full ${STATUS_META[g.key].dot} ${g.key === "expired" ? "pulse-danger" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {m.name} <span className="font-normal text-slate-400">· {m.strength} · {m.company}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        <span className="font-mono text-cyan-700/80 tabular-nums" dir="ltr">باج {m.batch}</span>
                        {" — "}
                        {g.key === "low" || g.key === "out"
                          ? `الكمية الحالية ${fmtNum(m.qty)} — حد الطلب ${fmtNum(m.minQty)}`
                          : `الصلاحية: ${fmtDate(m.expiry)} (${expiryLabel(m.expiry)})`}
                      </p>
                    </div>
                    {g.key === "soon" && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums ring-1 ${d <= 30 ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-orange-50 text-orange-700 ring-orange-200"}`}>
                        {fmtNum(d)} يوم
                      </span>
                    )}
                    {g.key === "expired" && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold text-rose-800 ring-1 ring-rose-200 tabular-nums">
                        منتهي منذ {fmtNum(Math.abs(d))} يوم
                      </span>
                    )}
                    <span className="font-display text-sm font-extrabold text-slate-700 tabular-nums">كمية: {fmtNum(m.qty)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
