import { useMemo, useRef, useState } from "react";
import type { Customer, Invoice, Medicine, Purchase } from "../types";
import { fmtMoney, fmtNum, getStatus, isApproved } from "../types";
import { BarChart, DonutChart } from "./Charts";
import { ChartIcon, CoinsIcon, DownloadIcon, PrinterIcon, ReceiptIcon, RestoreIcon, CartIcon } from "../icons";

interface Props {
  medicines: Medicine[];
  invoices: Invoice[];
  purchases: Purchase[];
  customers: Customer[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  restoreSeed: () => void;
  pushToast: (type: "success" | "error" | "info", msg: string) => void;
}

function toCSV(head: string[], rows: (string | number)[][]): string {
  return "\uFEFF" + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Reports({ medicines, invoices, purchases, customers, setMedicines, setInvoices, setPurchases, setCustomers, restoreSeed, pushToast }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const s30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    const recent = invoices.filter((i) => isApproved(i) && new Date(i.date).getTime() >= cutoff);
    const revenue = recent.reduce((s, i) => s + i.total, 0);
    const profit = recent.reduce((s, i) => s + i.items.reduce((x, it) => x + (it.total - it.cost * it.qty), 0), 0);
    const soldUnits = recent.reduce((s, i) => s + i.items.reduce((x, it) => x + it.strips, 0), 0);
    return { revenue, profit, count: recent.length, soldUnits };
  }, [invoices]);

  const week = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = d.getTime() + 86_400_000;
      const value = invoices
        .filter((inv) => isApproved(inv) && new Date(inv.date).getTime() >= d.getTime() && new Date(inv.date).getTime() < next)
        .reduce((s, inv) => s + inv.total, 0);
      days.push({ label: d.toLocaleDateString("ar", { weekday: "short" }), value });
    }
    return days;
  }, [invoices]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of medicines) map.set(m.category, (map.get(m.category) ?? 0) + m.qty * m.sellPrice);
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [medicines]);

  const topSelling = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const inv of invoices)
      if (isApproved(inv))
      for (const it of inv.items) {
        const cur = map.get(it.medicineId) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.strips;
        cur.revenue += it.total;
        map.set(it.medicineId, cur);
      }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [invoices]);

  const invValue = medicines.reduce((s, m) => s + m.qty * m.sellPrice, 0);
  const maxSold = Math.max(1, ...topSelling.map((t) => t.qty));

  const exportInventoryCSV = () => {
    const csv = toCSV(
      ["الاسم التجاري", "التركيز", "التصنيف", "الشركة", "رقم الباج", "تاريخ الإنتاج", "تاريخ الانتهاء", "الكمية", "سعر القطعة", "الاسم العلمي", "الشكل", "حد الطلب", "سعر الشراء", "الحالة"],
      medicines.map((m) => [m.name, m.strength, m.category, m.company, m.batch, m.prodDate, m.expiry, m.qty, m.sellPrice, m.scientific, m.form, m.minQty, m.buyPrice,
        { expired: "منتهي", out: "نافد", low: "منخفض", soon: "قرب الانتهاء", ok: "متوفر" }[getStatus(m)]])
    );
    download(csv, `alfayd-inventory-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    pushToast("success", "تم تصدير سجل المخزون بصيغة CSV");
  };

  const exportInvoicesCSV = () => {
    const csv = toCSV(
      ["رقم الفاتورة", "التاريخ", "الجهة", "طريقة الدفع", "الاعتماد", "عدد المواد", "الإجمالي (د.ع)"],
      invoices.map((i) => [i.number, new Date(i.date).toLocaleString("ar-IQ"), i.customer, i.payment, isApproved(i) ? "معتمدة" : "غير معتمدة", i.items.length, i.total])
    );
    download(csv, `alfayd-invoices-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    pushToast("success", "تم تصدير سجل الفواتير بصيغة CSV");
  };

  const exportBackup = () => {
    download(
      JSON.stringify({ exportedAt: new Date().toISOString(), medicines, invoices, purchases, customers }, null, 2),
      `alfayd-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
    pushToast("success", "تم تنزيل النسخة الاحتياطية (JSON)");
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.medicines) || !Array.isArray(data.invoices)) throw new Error("bad");
        setMedicines(data.medicines);
        setInvoices(data.invoices);
        if (Array.isArray(data.purchases)) setPurchases(data.purchases);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        pushToast("success", `تم استيراد النسخة الاحتياطية: ${fmtNum(data.medicines.length)} صنف و ${fmtNum(data.invoices.length)} فاتورة`);
      } catch {
        pushToast("error", "ملف غير صالح — تأكد أنه نسخة احتياطية من النظام");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">التقارير والتحليل</h1>
          <p className="mt-1 text-sm text-slate-400">أرقام المبيعات والأرباح وتوزيع المخزون — مع تصدير وطباعة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700 active:translate-y-0">
            <PrinterIcon className="text-base" /> طباعة المخزون
          </button>
          <button onClick={exportInventoryCSV} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700">
            <DownloadIcon className="text-base" /> CSV المخزون
          </button>
          <button onClick={exportInvoicesCSV} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700">
            <DownloadIcon className="text-base" /> CSV الفواتير
          </button>
          <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700">
            <DownloadIcon className="text-base" /> نسخة احتياطية
          </button>
        </div>
      </div>

      {/* ملخص 30 يوم */}
      <section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "إيراد آخر 30 يوماً", value: fmtMoney(s30.revenue), icon: <CoinsIcon />, chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/70" },
          { label: "الربح التقديري", value: fmtMoney(s30.profit), icon: <ChartIcon />, chip: "bg-cyan-50 text-cyan-700 ring-cyan-200/70" },
          { label: "فواتير الشهر", value: fmtNum(s30.count), icon: <ReceiptIcon />, chip: "bg-sky-50 text-sky-700 ring-sky-200/70" },
          { label: "أشرطة مباعة", value: fmtNum(s30.soldUnits), icon: <CartIcon />, chip: "bg-amber-50 text-amber-700 ring-amber-200/70" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className={`grid size-11 shrink-0 place-items-center rounded-lg text-[22px] ring-1 ${s.chip}`}>{s.icon}</span>
            <div>
              <p className="text-[13px] font-medium text-slate-400">{s.label}</p>
              <p className="font-display text-lg font-extrabold text-slate-900 tabular-nums xl:text-xl">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm" style={{ animationDelay: "120ms" }}>
          <h2 className="font-display text-lg font-extrabold text-slate-900">مبيعات آخر 7 أيام</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-400">بالدينار العراقي — يمرر فوق الأعمدة للتفاصيل</p>
          <BarChart data={week} />
        </div>

        <div className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm" style={{ animationDelay: "180ms" }}>
          <h2 className="font-display text-lg font-extrabold text-slate-900">توزيع المخزون حسب التصنيف</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-400">نسبة القيمة البيعية لكل تصنيف · الإجمالي {fmtMoney(invValue)}</p>
          {byCategory.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">لا توجد بيانات مخزون</p>
          ) : (
            <DonutChart slices={byCategory} centerValue={fmtNum(medicines.length)} centerLabel="صنف" />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* الأكثر مبيعاً */}
        <div className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm" style={{ animationDelay: "240ms" }}>
          <h2 className="font-display text-lg font-extrabold text-slate-900">الأكثر مبيعاً</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-400">حسب عدد الوحدات المباعة في كل الفواتير</p>
          {topSelling.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">لا توجد مبيعات بعد</p>
          ) : (
            <ul className="space-y-3.5">
              {topSelling.map((t, i) => (
                <li key={i}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-bold text-slate-700">
                      <span className="ms-0 inline-grid size-5 place-items-center rounded-md bg-slate-100 font-display text-[11px] font-extrabold text-slate-500">{i + 1}</span>
                      <span className="ms-2">{t.name}</span>
                    </span>
                    <span className="font-display font-extrabold text-slate-800 tabular-nums">{fmtNum(t.qty)} شريط</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-cyan-600 to-sky-500 transition-all duration-700"
                      style={{ width: `${(t.qty / maxSold) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* استيراد + استعادة */}
        <div className="anim-fade-up space-y-4" style={{ animationDelay: "300ms" }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) importBackup(f);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              dragOver ? "border-cyan-500 bg-cyan-50/70 scale-[1.01]" : "border-slate-200 bg-white"
            }`}
          >
            <DownloadIcon className={`mx-auto text-3xl transition-colors ${dragOver ? "text-cyan-600" : "text-slate-300"}`} />
            <p className="mt-2 text-sm font-bold text-slate-700">استيراد نسخة احتياطية</p>
            <p className="mt-1 text-xs text-slate-400">اسحب ملف JSON هنا أو اضغط للاختيار</p>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }} />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700"
            >
              اختيار ملف
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-700">استعادة البيانات التجريبية</p>
              <p className="mt-0.5 text-xs text-slate-400">يعيد المخزون والفواتير الافتراضية — يستبدل البيانات الحالية</p>
            </div>
            <button
              onClick={restoreSeed}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-500 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
            >
              <RestoreIcon className="text-base" />
              استعادة
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
