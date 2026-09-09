/* ===== صفحة المبيعات والفواتير — جداول بنمط Excel ===== */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Invoice, InvoiceItem, InvoiceLine, Medicine, Customer, CustomerKind } from "../types";
import {
  daysUntil, expiryLabel, fmtDate, fmtDateTime, fmtMoney, fmtNum, fmtTime,
  isApproved, newId, unitLabel,
} from "../types";
import { StatCard } from "./Stats";
import { MaterialPicker } from "./MaterialPicker";
import { CustomersModal } from "./CustomersModal";
import {
  BoxIcon, CartIcon, CashIcon, CheckIcon, ChevronDownIcon, CoinsIcon,
  PencilIcon, PillIcon, PlusIcon, PrinterIcon, ReceiptIcon, SearchIcon, SortIcon, UserIcon, XIcon,
} from "../icons";
import { CUSTOMER_KIND_META } from "../types";

interface Props {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  items: InvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  pushToast: (t: "success" | "error" | "info", m: string) => void;
  onPrintInvoice: (inv: Invoice) => void;
  userName: string;
}

/* ---------- أنماط خلايا Excel ---------- */
const EX_HEAD = "border border-slate-300 bg-slate-100 px-3 py-2.5 text-[11px] font-extrabold text-slate-600";
const EX_CELL = "border border-slate-200 px-3 py-2.5 align-middle";

/* ---------- التجهيز المدموج: كارتون + قطعة حسب الكمية الكلية ---------- */
function Breakdown({ m, strips }: { m: Medicine; strips: number }) {
  const spp = Math.max(1, m.stripsPerPiece);
  const spc = spp * Math.max(1, m.piecesPerCarton);
  const t = Math.max(0, Math.floor(strips));
  const cartons = Math.floor(t / spc);
  const pieces = Math.floor((t % spc) / spp);
  const rem = t % spp;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-[10px] font-extrabold leading-4">
      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-white tabular-nums">{fmtNum(cartons)} كارتون</span>
      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-700 tabular-nums">{fmtNum(pieces)} قطعة</span>
      {rem > 0 && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-700 ring-1 ring-cyan-100 tabular-nums">{fmtNum(rem)} شريط</span>}
    </span>
  );
}

/* ---------- قيمة مكدّسة (فوق/تحت) مع خط فاصل — نمط النسخ المؤكدة ---------- */
function Stacked({ values, format }: { values: number[]; format: (v: number) => React.ReactNode }) {
  if (values.length < 2) return <>{format(values[0] ?? 0)}</>;
  return (
    <span className="inline-flex flex-col items-center">
      {values.map((v, idx) => (
        <span key={idx} className="flex w-full flex-col items-center">
          {idx > 0 && <span aria-hidden className="my-1 h-px w-9 bg-slate-400/80" />}
          <span className={`tabular-nums leading-5 ${idx === 0 ? "font-extrabold text-slate-900" : "font-bold text-slate-500"}`}>
            {format(v)}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ---------- ساعة حية ---------- */
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/* ---------- صف سجل الفواتير ---------- */
function InvoiceRow({
  inv, expanded, onToggle, onPrint, onSettle, onApprove, zebra, medicines,
}: {
  inv: Invoice; expanded: boolean; onToggle: () => void;
  onPrint: () => void; onSettle: () => void; onApprove: () => void; zebra: boolean; medicines: Medicine[];
}) {
  const isCredit = inv.payment === "آجل";
  const approved = isApproved(inv);
  return (
    <>
      <tr
        onClick={onToggle}
        className={`group cursor-pointer transition-colors duration-150 ${
          expanded ? "bg-cyan-100/50" : zebra ? "bg-slate-50/70" : "bg-white"
        } hover:bg-cyan-50`}
        title="اضغط لعرض تفاصيل المواد"
      >
        <td className={`${EX_CELL} font-display text-[13px] font-extrabold tabular-nums text-slate-800`}>#{fmtNum(inv.number)}</td>
        <td className={`${EX_CELL} max-w-[150px] truncate text-[13px] font-bold text-slate-700`}>{inv.customer}</td>
        <td className={`${EX_CELL} text-[12px] tabular-nums text-slate-500`}>{fmtDateTime(inv.date)}</td>
        <td className={`${EX_CELL} text-center text-[11.5px] font-bold tabular-nums text-slate-500`}>{fmtTime(inv.saleTime)}</td>
        <td className={`${EX_CELL} text-center text-[11.5px] font-bold tabular-nums text-slate-500`}>{fmtTime(inv.prepTime)}</td>
        <td className={`${EX_CELL} max-w-[110px] truncate text-[11.5px] font-medium text-slate-500`}>{inv.preparedBy || "—"}</td>
        <td className={`${EX_CELL} text-center`}>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ring-1 ${inv.payment === "نقدي" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
            {inv.payment}
          </span>
        </td>
        <td className={`${EX_CELL} text-center`}>
          {approved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
              <CheckIcon className="text-[10px]" /> معتمدة
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-800 ring-1 ring-amber-200">
              <span className="pulse-danger size-1.5 rounded-full bg-amber-500" /> غير معتمدة
            </span>
          )}
        </td>
        <td className={`${EX_CELL} text-left font-display text-[13px] font-extrabold tabular-nums text-slate-900`}>{fmtMoney(inv.total)}</td>
        <td className={`${EX_CELL} text-center`} onClick={(e) => e.stopPropagation()}>
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-extrabold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-700 hover:shadow-sm active:translate-y-0"
              title="طباعة الفاتورة"
            >
              <PrinterIcon className="text-[13px]" /> طباعة
            </button>
            {!approved ? (
              <button
                onClick={onApprove}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[10.5px] font-extrabold text-white shadow-sm shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
                title="اعتماد وخصم من المخزون"
              >
                <CheckIcon className="text-[12px]" /> اعتماد
              </button>
            ) : isCredit && !inv.settled ? (
              <button
                onClick={onSettle}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-extrabold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
                title="تسجيل التحصيل"
              >
                <CashIcon className="text-[12px]" /> تحصيل
              </button>
            ) : null}
          </div>
        </td>
        <td className={`${EX_CELL} w-9 px-2 text-center`}>
          <ChevronDownIcon className={`inline text-sm text-slate-300 transition-transform duration-300 ${expanded ? "rotate-180 text-cyan-600" : "group-hover:text-slate-500"}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-100/70">
          <td colSpan={11} className="border border-slate-200 px-4 py-4">
            <div className="anim-fade-in overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-400">
                <span>القائمة <strong className="tabular-nums text-slate-700">#{fmtNum(inv.number)}</strong></span>
                <span>الجهة: <strong className="text-slate-700">{inv.customer}</strong></span>
                <span>التاريخ: <strong className="text-slate-700">{inv.listDate ? fmtDate(inv.listDate) : fmtDate(inv.date)}</strong></span>
                {inv.prepTime && <span>التجهيز: <strong className="tabular-nums text-slate-700">{fmtTime(inv.prepTime)}</strong></span>}
                {inv.saleTime && <span>البيع: <strong className="tabular-nums text-slate-700">{fmtTime(inv.saleTime)}</strong></span>}
                {inv.preparedBy && <span>المصمم: <strong className="text-slate-700">{inv.preparedBy}</strong></span>}
              </div>
              {inv.notes && (
                <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-[12.5px] font-bold leading-6 text-amber-900">
                  <span className="text-amber-600">الملاحظات: </span>{inv.notes}
                </div>
              )}
              <div className="overflow-x-auto p-4 pt-3">
                <table className="w-full min-w-[640px] border-collapse border border-slate-300 text-[12.5px]">
                  <thead>
                    <tr>
                      {["المادة والتركيز", "الشركة والباج", "الانتهاء", "العدد", "التجهيز", "الخصم", "سعر القطعة", "الكلي"].map((h, i) => (
                        <th key={h} className={`${EX_HEAD} ${i <= 1 ? "text-right" : i === 7 ? "text-left" : "text-center"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((i, idx) => (
                      <tr key={`${i.medicineId}-${idx}`} className={idx % 2 ? "bg-slate-50/60" : "bg-white"}>
                        <td className={`${EX_CELL} text-right`}>
                          <span className="font-bold text-slate-800">{i.name}</span>
                          <span className="ms-1.5 text-[11px] text-slate-400">{i.strength}</span>
                        </td>
                        <td className={`${EX_CELL} text-right`}>
                          {(() => {
                            const md = medicines.find((m) => m.id === i.medicineId);
                            return md ? (
                              <>
                                <span className="block text-[11.5px] font-bold text-slate-700">{md.company}</span>
                                <span className="rounded bg-cyan-50 px-1 py-0.5 font-mono text-[9.5px] font-bold text-cyan-800 ring-1 ring-cyan-100" dir="ltr">{md.batch}</span>
                              </>
                            ) : "—";
                          })()}
                        </td>
                        <td className={`${EX_CELL} text-center text-[11px] font-bold tabular-nums text-slate-600`}>
                          {(() => {
                            const md = medicines.find((m) => m.id === i.medicineId);
                            return md ? fmtDate(md.expiry) : "—";
                          })()}
                        </td>
                        <td className={`${EX_CELL} text-center`}>
                          <span className="inline-flex flex-col items-center gap-1">
                            <Stacked values={i.lines?.map((l) => l.qty) ?? [i.qty]} format={(v) => <span className="font-extrabold">{fmtNum(v)}</span>} />
                            <span className="text-[9.5px] font-extrabold text-slate-400">{unitLabel(i.unit)}</span>
                          </span>
                        </td>
                        <td className={`${EX_CELL} text-center`}>
                          {(() => {
                            const md = medicines.find((m) => m.id === i.medicineId);
                            return md ? <Breakdown m={md} strips={i.strips} /> : <span className="text-[11px] font-bold tabular-nums text-slate-500">{fmtNum(i.strips)} شريط</span>;
                          })()}
                        </td>
                        <td className={`${EX_CELL} text-right tabular-nums text-slate-600`}>{fmtMoney(i.price)}</td>
                        <td className={`${EX_CELL} text-center tabular-nums`}>
                          <Stacked
                            values={i.lines?.map((l) => l.discountPct) ?? [i.discountPct]}
                            format={(v) => (v > 0 ? <span className="text-emerald-700">{fmtNum(v)}%</span> : <>0%</>)}
                          />
                        </td>
                        <td className={`${EX_CELL} text-left font-display font-extrabold tabular-nums text-slate-900`}>{fmtMoney(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={3} className={`${EX_CELL} border-t-2 border-slate-300 text-right text-[11px] text-slate-500`}>Σ الإجمالي</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-center tabular-nums text-slate-800`}>{fmtNum(inv.items.reduce((s, i) => s + i.qty, 0))}</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-center tabular-nums text-cyan-800`}>{fmtNum(inv.items.reduce((s, i) => s + i.strips, 0))}</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300`} />
                      <td className={`${EX_CELL} border-t-2 border-slate-300`} />
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-left font-display text-[14px] font-black tabular-nums text-cyan-800`}>{fmtMoney(inv.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type SortKey = "number" | "customer" | "date" | "total";

/* ================= الصفحة ================= */
export function Sales({
  medicines, setMedicines, invoices, setInvoices, items, setItems,
  customers, onAddCustomer, onDeleteCustomer, pushToast, onPrintInvoice, userName,
}: Props) {
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState<Invoice["payment"]>("نقدي");
  const [picker, setPicker] = useState<{ med: Medicine; edit?: InvoiceItem } | null>(null);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  const [custTab, setCustTab] = useState<CustomerKind>("pharmacy");
  const [medQuery, setMedQuery] = useState("");
  const [medOpen, setMedOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [formError, setFormError] = useState("");
  const custRef = useRef<HTMLDivElement>(null);
  const medRef = useRef<HTMLDivElement>(null);

  /* إغلاق القوائم المنسدلة عند النقر خارجها */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (custOpen && custRef.current && !custRef.current.contains(t)) setCustOpen(false);
      if (medOpen && medRef.current && !medRef.current.contains(t)) setMedOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [custOpen, medOpen]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [histQuery, setHistQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const now = useLiveClock();

  /* تفاصيل القائمة */
  const [prepTime, setPrepTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [saleTime, setSaleTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [listDate, setListDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [preparedBy, setPreparedBy] = useState(userName);
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    let today = 0, week = 0, receivables = 0, unapproved = 0;
    for (const inv of invoices) {
      if (!isApproved(inv)) { unapproved++; continue; }
      const t = new Date(inv.date).getTime();
      if (t >= todayStart.getTime()) today += inv.total;
      if (t >= weekStart.getTime()) week += inv.total;
      if (inv.payment === "آجل" && !inv.settled) receivables += inv.total;
    }
    return { today, week, receivables, unapproved };
  }, [invoices]);

  const total = items.reduce((s, i) => s + i.total, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discountTotal = subtotal - total;
  const totalStrips = items.reduce((s, i) => s + i.strips, 0);
  const totalUnits = items.reduce((s, i) => s + i.qty, 0);
  const stripsInCart = (medId: string) => items.filter((i) => i.medicineId === medId).reduce((s, i) => s + i.strips, 0);
  const pharmacies = customers.filter((c) => c.kind === "pharmacy");
  const warehouses = customers.filter((c) => c.kind === "warehouse");

  /* سجل الفواتير: بحث + فرز */
  const visibleInvoices = useMemo(() => {
    const q = histQuery.trim().toLowerCase();
    const list = invoices.filter((i) =>
      !q || i.customer.toLowerCase().includes(q) || String(i.number).includes(q) || (i.preparedBy || "").toLowerCase().includes(q)
    );
    const dir = sortDir;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "number": return (a.number - b.number) * dir;
        case "customer": return a.customer.localeCompare(b.customer, "ar") * dir;
        case "total": return (a.total - b.total) * dir;
        default: return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
    });
  }, [invoices, histQuery, sortKey, sortDir]);

  const visSum = visibleInvoices.reduce((s, i) => s + i.total, 0);
  const visAvg = visibleInvoices.length ? Math.round(visSum / visibleInvoices.length) : 0;

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(k === "customer" || k === "number" ? 1 : -1); }
  };

  /* ---------- إضافة مادة (مع الدمج: قيم مكدّسة فوق/تحت) ---------- */
  const addItem = (item: InvoiceItem, keepOpen: boolean) => {
    setFormError("");
    const existing = items.find((x) => x.medicineId === item.medicineId && x.unit === item.unit);
    const med = medicines.find((m) => m.id === item.medicineId);
    const spp = med?.stripsPerPiece ?? 1;
    if (existing) {
      const prevLines: InvoiceLine[] = existing.lines ?? [
        { qty: existing.qty, price: existing.price, discountPct: existing.discountPct, total: existing.total },
      ];
      const lines = [...prevLines, { qty: item.qty, price: item.price, discountPct: item.discountPct, total: item.total }];
      setItems((list) => list.map((x) => {
        if (x.medicineId !== item.medicineId || x.unit !== item.unit) return x;
        const qty = lines.reduce((s, l) => s + l.qty, 0);
        const tot = lines.reduce((s, l) => s + l.total, 0);
        const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
        return {
          ...x,
          qty,
          lines,
          strips: item.unit === "piece" ? qty * spp : qty,
          total: tot,
          discountPct: sub > 0 ? Math.round((1 - tot / sub) * 1000) / 10 : 0,
        };
      }));
      pushToast("info", `تم دمج «${item.name}» — الكمية الكلية الآن ${fmtNum(existing.qty + item.qty)} ${unitLabel(item.unit)}`);
    } else {
      setItems((list) => [...list, item]);
      pushToast("info", keepOpen
        ? `أُضيف «${item.name}» — تابع إضافة مواد أخرى`
        : `أُضيف «${item.name}» — ${fmtNum(item.qty)} ${unitLabel(item.unit)} إلى القائمة`);
    }
    if (!keepOpen) setPicker(null);
  };

  /* حفظ من البطاقة: إضافة جديدة أو تعديل سطر موجود */
  const handlePickerAdd = (item: InvoiceItem, keepOpen: boolean) => {
    const editing = picker?.edit;
    if (editing) {
      setItems((list) => [
        ...list.filter((x) => !(x.medicineId === editing.medicineId && x.unit === editing.unit)),
        item,
      ]);
      pushToast("success", `تم تعديل «${item.name}» في القائمة`);
      setPicker(null);
      return;
    }
    addItem(item, keepOpen);
  };

  /* نتائج بحث المواد */
  const medResults = useMemo(() => {
    const q = medQuery.trim().toLowerCase();
    if (!q) return [];
    return medicines
      .filter((m) => `${m.name} ${m.scientific} ${m.company} ${m.batch} ${m.strength} ${m.category}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [medicines, medQuery]);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  /* إضافة زبون سريع من لوحة الاختيار وتحديدِه فوراً */
  const quickAddCustomer = () => {
    const name = quickName.trim();
    if (!name) return;
    if (customers.some((c) => c.name === name)) {
      pushToast("error", "توجد جهة مسجلة بنفس الاسم");
      return;
    }
    const c: Customer = { id: newId(), name, kind: custTab, phone: "", city: "غير محددة", createdAt: Date.now() };
    onAddCustomer(c);
    setCustomerId(c.id);
    setQuickName("");
    setCustOpen(false);
    pushToast("success", `تمت إضافة «${name}» ${custTab === "pharmacy" ? "كالصيدلية" : "كالمذخر"} واختيارها للفاتورة`);
  };

  const settle = (inv: Invoice) => {
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, settled: true } : x)));
    pushToast("success", `تم تسجيل تحصيل الفاتورة #${fmtNum(inv.number)} من ${inv.customer}`);
  };

  const approveInvoice = (inv: Invoice) => {
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, approved: true } : x)));
    setMedicines((list) => list.map((m) => {
      const st = inv.items.filter((i) => i.medicineId === m.id).reduce((s, i) => s + i.strips, 0);
      return st > 0 ? { ...m, qty: Math.max(0, m.qty - st) } : m;
    }));
    pushToast("success", `تم اعتماد الفاتورة #${fmtNum(inv.number)} وخصم ${fmtNum(inv.items.reduce((s, i) => s + i.strips, 0))} شريط`);
  };

  const saveInvoice = (mode: "print-approve" | "print-only" | "approve-only") => {
    setFormError("");
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) { setFormError("اختر الجهة المشترية من المذاخر أو الصيدليات المسجلة"); return; }
    if (items.length === 0) { setFormError("أضف مادة واحدة على الأقل للقائمة"); return; }
    const approve = mode !== "print-only";
    const nextNumber = invoices.reduce((mx, i) => Math.max(mx, i.number), 1000) + 1;
    const invoice: Invoice = {
      id: newId(), number: nextNumber, date: new Date().toISOString(),
      customerId: cust.id, customer: cust.name, payment, approved: approve,
      prepTime, saleTime, listDate,
      preparedBy: preparedBy.trim() || userName,
      notes: notes.trim() || undefined,
      items, total,
    };
    setInvoices((list) => [invoice, ...list]);
    if (approve) {
      setMedicines((list) => list.map((m) => {
        const st = items.filter((i) => i.medicineId === m.id).reduce((s, i) => s + i.strips, 0);
        return st > 0 ? { ...m, qty: Math.max(0, m.qty - st) } : m;
      }));
    }
    const clearForm = () => {
      setCustomerId(""); setItems([]); setPayment("نقدي");
      setPrepTime(new Date().toTimeString().slice(0, 5));
      setSaleTime(new Date().toTimeString().slice(0, 5));
      setListDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    };
    if (mode === "print-approve") {
      pushToast("success", `تم اعتماد القائمة #${fmtNum(nextNumber)} وخصم الكميات — جاهزة للطباعة`);
      clearForm(); onPrintInvoice(invoice);
    } else if (mode === "print-only") {
      pushToast("info", `طُبعت القائمة #${fmtNum(nextNumber)} دون اعتماد — اعتمدها لاحقاً من السجل`);
      clearForm(); onPrintInvoice(invoice);
    } else {
      pushToast("success", `تم اعتماد القائمة #${fmtNum(nextNumber)} وخصم الكميات من المخزون`);
      clearForm();
    }
  };

  const fieldCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25";

  const HTh = ({ label, k, className = "" }: { label: string; k?: SortKey; className?: string }) => (
    <th className={`${EX_HEAD} ${className}`}>
      {k ? (
        <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 transition-colors hover:text-cyan-700" title="فرز">
          {label}
          <SortIcon dir={sortKey === k ? (sortDir === 1 ? "asc" : "desc") : null}
            className={`text-[12px] ${sortKey === k ? "text-cyan-600" : "text-slate-300"}`} />
        </button>
      ) : label}
    </th>
  );

  return (
    <div className="space-y-5">
      {/* ===== رأس الصفحة ===== */}
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">المبيعات والفواتير</h1>
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold tabular-nums text-slate-500 shadow-sm sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              {now.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">قوائم بيع للمذاخر والصيدليات — تجهيز، خصم، اعتماد وطباعة</p>
        </div>
        <button
          onClick={() => setCustomersOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg active:translate-y-0"
        >
          <UserIcon className="text-base" />
          المذاخر والصيدليات
          <span className="rounded-full bg-white/15 px-2 py-px text-[11px] font-extrabold tabular-nums">{fmtNum(customers.length)}</span>
        </button>
      </div>

      {/* ===== بطاقات الإحصاء ===== */}
      <section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="مبيعات اليوم" value={stats.today} money hint="فواتير معتمدة منذ منتصف الليل" icon={<CoinsIcon />} tone="emerald" />
        <StatCard title="مبيعات آخر 7 أيام" value={stats.week} money hint="إجمالي الفواتير المعتمدة" icon={<CartIcon />} tone="cyan" delay={60} />
        <StatCard title="عدد الفواتير" value={invoices.length} hint={stats.unapproved > 0 ? `منها ${fmtNum(stats.unapproved)} بانتظار الاعتماد` : "كلها معتمدة"} icon={<ReceiptIcon />} tone={stats.unapproved > 0 ? "amber" : "cyan"} delay={120} />
        <StatCard title="ذمم آجلة معلّقة" value={stats.receivables} money hint="مبالغ غير محصّلة بعد" icon={<CashIcon />} tone="rose" delay={180} />
      </section>

      {/* ===== نموذج قائمة جديدة ===== */}
      <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "120ms" }}>
        <div className="relative flex items-center gap-3 bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-5 py-4 text-white">
          <span className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='white'%3E%3Cpath d='M21 12h6v9h9v6h-9v9h-6v-9h-9v-6h9z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <span className="relative grid size-10 place-items-center rounded-lg bg-white/12 text-xl text-cyan-200 ring-1 ring-white/20">
            <ReceiptIcon />
          </span>
          <div className="relative">
            <h2 className="font-display text-base font-extrabold">قائمة بيع جديدة</h2>
            <p className="text-[11px] text-cyan-200/80">اختر المواد من بطاقة التجهيز ثم اعتمد أو اطبع</p>
          </div>
          {items.length > 0 && (
            <span className="relative ms-auto rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-extrabold text-emerald-200 ring-1 ring-emerald-300/30 tabular-nums">
              {fmtNum(items.length)} مادة بالقائمة
            </span>
          )}
        </div>

        <div className="space-y-4 p-5">
          {/* صف الاختيارات */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1.3fr]">
            <div>
              <span className="mb-1.5 flex items-center justify-between text-[13px] font-bold text-slate-600">
                الزبون (مذخر / صيدلية) *
                <button onClick={() => setCustomersOpen(true)} className="text-[11px] font-extrabold text-cyan-700 underline-offset-4 transition-colors hover:text-cyan-800 hover:underline">+ إضافة جهة</button>
              </span>
              <div className="relative" ref={custRef}>
                <button
                  onClick={() => { setCustOpen((o) => !o); setFormError(""); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-start text-sm font-bold outline-none transition-all ${
                    selectedCustomer
                      ? "border-emerald-300 bg-emerald-50/60 text-slate-800 hover:border-emerald-400"
                      : "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {selectedCustomer ? (
                    <>
                      <span className={`grid size-7 shrink-0 place-items-center rounded-md text-[14px] ring-1 ${selectedCustomer.kind === "pharmacy" ? "bg-emerald-100 text-emerald-600 ring-emerald-200" : "bg-sky-100 text-sky-600 ring-sky-200"}`}>
                        {selectedCustomer.kind === "pharmacy" ? <PillIcon /> : <BoxIcon />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{selectedCustomer.name}</span>
                        <span className="block text-[10.5px] font-bold text-slate-400">
                          {CUSTOMER_KIND_META[selectedCustomer.kind].label} · {selectedCustomer.city}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-[14px] text-slate-400 ring-1 ring-slate-200">
                        <UserIcon />
                      </span>
                      <span className="flex-1">اختر الزبون — مذخر أو صيدلية</span>
                    </>
                  )}
                  <ChevronDownIcon className={`shrink-0 text-slate-400 transition-transform duration-200 ${custOpen ? "rotate-180" : ""}`} />
                </button>

                {custOpen && (
                  <div className="anim-pop-in absolute right-0 left-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="flex gap-1 border-b border-slate-100 bg-slate-50 p-1.5">
                      {(["warehouse", "pharmacy"] as CustomerKind[]).map((k) => (
                        <button
                          key={k}
                          onClick={() => setCustTab(k)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-extrabold transition-all ${
                            custTab === k ? "bg-white text-cyan-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {k === "pharmacy" ? <PillIcon className="text-sm" /> : <BoxIcon className="text-sm" />}
                          {CUSTOMER_KIND_META[k].label === "صيدلية" ? "الصيدليات" : "المذاخر"}
                          <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-black tabular-nums text-slate-500">
                            {fmtNum(k === "pharmacy" ? pharmacies.length : warehouses.length)}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1.5">
                      {(custTab === "pharmacy" ? pharmacies : warehouses).length === 0 ? (
                        <p className="px-3 py-5 text-center text-[12px] font-bold text-slate-400">
                          لا توجد {custTab === "pharmacy" ? "صيدليات" : "مذاخر"} مسجلة
                        </p>
                      ) : (
                        (custTab === "pharmacy" ? pharmacies : warehouses).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setCustomerId(c.id); setCustOpen(false); }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start transition-colors ${customerId === c.id ? "bg-cyan-50 ring-1 ring-cyan-200" : "hover:bg-slate-50"}`}
                          >
                            <span className={`grid size-7 shrink-0 place-items-center rounded-md text-[13px] ring-1 ${c.kind === "pharmacy" ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-sky-50 text-sky-600 ring-sky-200"}`}>
                              {c.kind === "pharmacy" ? <PillIcon /> : <BoxIcon />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-bold text-slate-800">{c.name}</span>
                              <span className="block text-[10.5px] font-medium text-slate-400">{c.city}{c.phone && <span className="tabular-nums" dir="ltr"> · {c.phone}</span>}</span>
                            </span>
                            {customerId === c.id && <CheckIcon className="shrink-0 text-sm text-cyan-600" />}
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/80 p-2.5">
                      <div className="flex gap-2">
                        <input
                          value={quickName}
                          onChange={(e) => setQuickName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") quickAddCustomer(); }}
                          placeholder={`اسم ${custTab === "pharmacy" ? "الصيدلية" : "المذخر"} الجديد`}
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
                        />
                        <button
                          onClick={quickAddCustomer}
                          disabled={!quickName.trim()}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[12px] font-extrabold text-white shadow-sm shadow-cyan-600/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PlusIcon className="text-sm" />
                          إضافة واختيار
                        </button>
                      </div>
                      <button
                        onClick={() => { setCustOpen(false); setCustomersOpen(true); }}
                        className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-extrabold text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                      >
                        <UserIcon className="text-xs" />
                        إدارة كل المذاخر والصيدليات
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {customers.length === 0 && (
                <p className="anim-fade-in mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">
                  لا توجد جهات مسجلة — أضف صيدلية أو مذخراً أولاً
                </p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-slate-600">طريقة الدفع</span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {(["نقدي", "آجل"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPayment(p)}
                    className={`flex-1 rounded-md py-2 text-[13px] font-extrabold transition-all ${payment === p ? "bg-white text-cyan-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-slate-600">إضافة مادة — ابحث بأي تفصيل</span>
              <div className="relative" ref={medRef}>
                <SearchIcon className="pointer-events-none absolute right-3.5 top-[18px] text-base text-cyan-500" />
                <input
                  value={medQuery}
                  onChange={(e) => { setMedQuery(e.target.value); setMedOpen(true); }}
                  onFocus={() => medQuery && setMedOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setMedOpen(false);
                    if (e.key === "Enter" && medResults.length > 0) {
                      const first = medResults.find((m) => m.qty > 0) ?? medResults[0];
                      if (first.qty > 0) { setPicker({ med: first }); setMedOpen(false); setMedQuery(""); setFormError(""); }
                    }
                  }}
                  placeholder="اسم الدواء، العلمي، الشركة، الباج..."
                  className="w-full rounded-lg border-2 border-dashed border-cyan-300 bg-cyan-50/60 py-2.5 pe-10 ps-9 text-sm font-bold text-cyan-900 outline-none transition-all placeholder:font-medium placeholder:text-cyan-700/50 hover:border-cyan-500 hover:bg-cyan-50 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                />
                {medQuery && (
                  <button
                    onClick={() => { setMedQuery(""); setMedOpen(false); }}
                    className="absolute left-3 top-[16px] grid size-6 place-items-center rounded-md text-cyan-500 transition-colors hover:bg-cyan-100"
                    title="مسح البحث"
                  >
                    <XIcon className="text-sm" />
                  </button>
                )}

                {medOpen && medQuery.trim() && (
                  <div className="anim-pop-in absolute right-0 left-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    {medResults.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[12.5px] font-bold text-slate-400">
                        لا توجد مادة تطابق «{medQuery}»
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto p-1.5">
                        {medResults.map((m) => {
                          const avail = m.qty - stripsInCart(m.id);
                          const out = avail <= 0;
                          return (
                            <button
                              key={m.id}
                              disabled={out}
                              onClick={() => { setPicker({ med: m }); setMedOpen(false); setMedQuery(""); setFormError(""); }}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors ${out ? "cursor-not-allowed opacity-50" : "hover:bg-cyan-50"}`}
                            >
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-display text-[11px] font-bold text-cyan-200">
                                {m.name.slice(0, 2)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-extrabold text-slate-800">
                                  {m.name} <span className="font-medium text-slate-400">· {m.strength}</span>
                                </span>
                                <span className="block truncate text-[10.5px] font-medium text-slate-400">
                                  {m.company} · <span className="font-mono" dir="ltr">باج {m.batch}</span> · {m.scientific}
                                </span>
                              </span>
                              {out ? (
                                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 ring-1 ring-rose-200">نافد</span>
                              ) : (
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200 tabular-nums">
                                  {fmtNum(avail)} شريط
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {formError && (
            <p className="anim-fade-in flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-bold text-rose-700">
              <span className="size-1.5 shrink-0 rounded-full bg-rose-500" /> {formError}
            </p>
          )}

          {/* ===== جدول مواد القائمة (نمط Excel) ===== */}
          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-9 text-center">
              <span className="anim-drift inline-grid size-14 place-items-center rounded-2xl bg-white text-[26px] text-slate-300 shadow-sm ring-1 ring-slate-200">
                <CartIcon />
              </span>
              <p className="mt-3 font-display text-[15px] font-extrabold text-slate-600">القائمة فارغة</p>
              <p className="mt-1 text-[12px] text-slate-400">اختر مادة من القائمة أعلاه لفتح بطاقة التجهيز</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-300 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      <th className={`${EX_HEAD} text-right`}>المادة والتركيز</th>
                      <th className={`${EX_HEAD} text-right`}>الشركة والباج</th>
                      <th className={`${EX_HEAD} text-center`}>تاريخ الانتهاء</th>
                      <th className={`${EX_HEAD} text-center`}>العدد</th>
                      <th className={`${EX_HEAD} text-right`}>التجهيز</th>
                      <th className={`${EX_HEAD} text-center`}>الخصم</th>
                      <th className={`${EX_HEAD} text-right`}>سعر القطعة</th>
                      <th className={`${EX_HEAD} text-left`}>السعر الكلي</th>
                      <th className={`${EX_HEAD} w-16`} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => {
                      const med = medicines.find((m) => m.id === i.medicineId);
                      const expired = med ? daysUntil(med.expiry) < 0 : false;
                      return (
                        <tr key={`${i.medicineId}-${idx}`} className={`anim-fade-in transition-colors ${idx % 2 ? "bg-slate-50/60" : "bg-white"} hover:bg-cyan-50`}>
                          <td className={EX_CELL}>
                            <p className="font-bold text-slate-900">{i.name}</p>
                            <p className="text-[11px] text-slate-400">{i.strength}</p>
                          </td>
                          <td className={EX_CELL}>
                            <p className="font-bold text-slate-700">{med?.company ?? "—"}</p>
                            {med && <span className="rounded bg-cyan-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 ring-1 ring-cyan-100" dir="ltr">{med.batch}</span>}
                          </td>
                          <td className={`${EX_CELL} text-center`}>
                            <p className={`text-[12px] font-bold tabular-nums ${expired ? "text-rose-600" : "text-slate-700"}`}>{med ? fmtDate(med.expiry) : "—"}</p>
                            {med && <p className={`text-[10px] ${expired ? "font-bold text-rose-500" : "text-slate-400"}`}>{expiryLabel(med.expiry)}</p>}
                          </td>
                          <td className={`${EX_CELL} text-center`}>
                            <span className="inline-flex flex-col items-center">
                              <Stacked values={i.lines?.map((l) => l.qty) ?? [i.qty]} format={(v) => fmtNum(v)} />
                              <span className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold ring-1 ${i.unit === "piece" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-cyan-50 text-cyan-700 ring-cyan-200"}`}>
                                {i.unit === "piece" ? <BoxIcon className="text-[10px]" /> : <PillIcon className="text-[10px]" />}
                                {unitLabel(i.unit)}
                              </span>
                            </span>
                          </td>
                          <td className={EX_CELL}>
                            {med ? <Breakdown m={med} strips={i.strips} /> : <span className="text-[11px] font-bold tabular-nums text-slate-500">{fmtNum(i.strips)} شريط</span>}
                          </td>
                          <td className={`${EX_CELL} text-center`}>
                            <Stacked
                              values={i.lines?.map((l) => l.discountPct) ?? [i.discountPct]}
                              format={(v) => (v > 0 ? <span className="text-emerald-700">{fmtNum(v)}٪</span> : <>0٪</>)}
                            />
                          </td>
                          <td className={`${EX_CELL} text-right tabular-nums text-slate-600`}>{fmtMoney(i.price)}</td>
                          <td className={`${EX_CELL} text-left font-display text-[13px] font-extrabold tabular-nums text-slate-900`}>{fmtMoney(i.total)}</td>
                          <td className={`${EX_CELL} w-16 px-1.5`}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPicker({ med: medicines.find((m) => m.id === i.medicineId)!, edit: i })}
                                className="grid size-7 place-items-center rounded-md text-slate-300 transition-all hover:scale-110 hover:bg-cyan-50 hover:text-cyan-700"
                                title="تعديل المادة"
                              >
                                <PencilIcon className="text-sm" />
                              </button>
                              <button
                                onClick={() => setItems((list) => list.filter((_, x) => x !== idx))}
                                className="grid size-7 place-items-center rounded-md text-slate-300 transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-600"
                                title="إزالة السطر"
                              >
                                <XIcon className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={3} className={`${EX_CELL} border-t-2 border-slate-300 text-right text-[11px] font-extrabold text-slate-500`}>Σ الإجمالي</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-center font-display tabular-nums text-slate-800`}>{fmtNum(totalUnits)}</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-[11px] font-bold tabular-nums text-cyan-800`}>{fmtNum(totalStrips)} شريط</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300`} />
                      <td className={`${EX_CELL} border-t-2 border-slate-300`} />
                      <td className={`${EX_CELL} border-t-2 border-slate-300 text-left font-display text-[14px] font-black tabular-nums text-cyan-800`}>{fmtMoney(subtotal)}</td>
                      <td className={`${EX_CELL} border-t-2 border-slate-300`} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ===== تفاصيل القائمة ===== */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-extrabold tracking-wide text-slate-400">
              <span className="grid size-6 place-items-center rounded-md bg-white text-[13px] text-slate-500 shadow-sm ring-1 ring-slate-200"><ReceiptIcon /></span>
              تفاصيل القائمة
              <span className="h-px flex-1 bg-slate-200/80" />
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">تاريخ القائمة</span>
                <input type="date" value={listDate} onChange={(e) => setListDate(e.target.value)} className={`${fieldCls} tabular-nums`} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">وقت التجهيز</span>
                <input type="time" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className={`${fieldCls} tabular-nums`} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">وقت البيع</span>
                <input type="time" value={saleTime} onChange={(e) => setSaleTime(e.target.value)} className={`${fieldCls} tabular-nums`} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">مصمم القائمة</span>
                <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder={userName} className={fieldCls} />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">
                الملاحظات <span className="font-medium text-slate-400">(هدايا ترويجية: موبايل، شاشة عرض مع الأدوية...)</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="مثال: يُسلَّم مع الطلبية شاشة عرض عدد 1 + موبايل ترويجي..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium leading-5 text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
              />
            </label>
          </div>

          {/* ===== الإجماليات ===== */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="space-y-2 bg-slate-50/70 px-4 py-3 text-[13px]">
              <div className="flex justify-between text-slate-500">
                <span>المجموع قبل الخصم</span>
                <span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span>
              </div>
              <div className={`flex justify-between transition-colors ${discountTotal > 0 ? "text-emerald-700" : "text-slate-300"}`}>
                <span>إجمالي الخصومات</span>
                <span className="font-bold tabular-nums">− {fmtMoney(discountTotal)}</span>
              </div>
              {subtotal > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (total / subtotal) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <span className="font-display text-sm font-extrabold text-slate-300">الإجمالي الكلي</span>
              <span className="font-display text-2xl font-black tabular-nums text-cyan-300">{fmtMoney(total)}</span>
            </div>
          </div>

          {/* ===== أزرار الإجراءات ===== */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={() => saveInvoice("print-approve")}
              disabled={items.length === 0}
              className="group flex flex-col items-center gap-0.5 rounded-xl bg-cyan-600 px-3 py-3 text-white shadow-md shadow-cyan-600/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 font-display text-[14px] font-extrabold">
                <PrinterIcon className="text-base transition-transform group-hover:scale-110" /> طباعة واعتماد
              </span>
              <span className="text-[10.5px] font-medium text-cyan-100/90">خصم من المخزون + طباعة</span>
            </button>
            <button
              onClick={() => saveInvoice("print-only")}
              disabled={items.length === 0}
              className="group flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 font-display text-[14px] font-extrabold">
                <ReceiptIcon className="text-base transition-transform group-hover:scale-110" /> طباعة فقط
              </span>
              <span className="text-[10.5px] font-medium text-slate-400">نسخة غير معتمدة</span>
            </button>
            <button
              onClick={() => saveInvoice("approve-only")}
              disabled={items.length === 0}
              className="group flex flex-col items-center gap-0.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 font-display text-[14px] font-extrabold">
                <CheckIcon className="text-base transition-transform group-hover:scale-110" /> اعتماد فقط
              </span>
              <span className="text-[10.5px] font-medium text-emerald-600">خصم دون طباعة</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== سجل الفواتير (ورقة عمل) ===== */}
      <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm" style={{ animationDelay: "180ms" }}>
        {/* شريط أدوات الورقة */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-md border border-slate-300 border-b-0 bg-white px-3 py-1.5 font-display text-[13px] font-extrabold text-slate-800 shadow-sm">
              <span className="size-2 rounded-sm bg-emerald-600" />
              سجل الفواتير
            </span>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-300" />
              <input
                value={histQuery}
                onChange={(e) => setHistQuery(e.target.value)}
                placeholder="بحث برقم الفاتورة أو الجهة..."
                className="w-56 rounded-md border border-slate-200 bg-white py-1.5 pe-8 ps-3 text-[12px] font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
              />
              {histQuery && (
                <button onClick={() => setHistQuery("")} className="absolute left-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <XIcon className="text-xs" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.unapproved > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 tabular-nums">
                {fmtNum(stats.unapproved)} بانتظار الاعتماد
              </span>
            )}
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-500 tabular-nums">{fmtNum(visibleInvoices.length)} / {fmtNum(invoices.length)}</span>
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="anim-drift inline-grid size-14 place-items-center rounded-2xl bg-slate-100 text-[26px] text-slate-300">
              <ReceiptIcon />
            </span>
            <p className="mt-3 font-display text-[15px] font-extrabold text-slate-600">
              {invoices.length === 0 ? "لا توجد فواتير بعد" : "لا توجد نتائج مطابقة"}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {invoices.length === 0 ? "أنشئ أول قائمة بيع من النموذج أعلاه" : "عدّل كلمة البحث لعرض الفواتير"}
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[1020px] border-collapse text-[11.5px]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <HTh label="الرقم" k="number" />
                    <HTh label="الجهة" k="customer" />
                    <HTh label="التاريخ" k="date" />
                    <HTh label="وقت البيع" />
                    <HTh label="وقت التجهيز" />
                    <HTh label="المصمم" />
                    <HTh label="الدفع" className="text-center" />
                    <HTh label="الحالة" className="text-center" />
                    <HTh label="المجموع" k="total" className="text-left" />
                    <HTh label="إجراء" className="text-center" />
                    <HTh label="" />
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((inv, idx) => (
                  <InvoiceRow
                    key={inv.id}
                    inv={inv}
                    expanded={expanded === inv.id}
                    onToggle={() => setExpanded(expanded === inv.id ? null : inv.id)}
                    onPrint={() => onPrintInvoice(inv)}
                    onSettle={() => settle(inv)}
                    onApprove={() => approveInvoice(inv)}
                    zebra={idx % 2 === 1}
                    medicines={medicines}
                  />
                  ))}
                </tbody>
              </table>
            </div>
            {/* شريط الحالة (نمط Excel) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-300 bg-slate-100 px-4 py-2 text-[11px] font-extrabold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                جاهز
              </span>
              <span className="ms-auto tabular-nums">العدد: {fmtNum(visibleInvoices.length)}</span>
              <span className="tabular-nums">المجموع: <strong className="text-cyan-800">{fmtMoney(visSum)}</strong></span>
              <span className="tabular-nums">المتوسط: {fmtMoney(visAvg)}</span>
            </div>
          </>
        )}
      </section>

      {/* النوافذ */}
      <CustomersModal
        open={customersOpen}
        customers={customers}
        onClose={() => setCustomersOpen(false)}
        onAdd={(c) => onAddCustomer({ ...c, id: newId(), createdAt: Date.now() })}
        onDelete={onDeleteCustomer}
      />
      {picker && (
        <MaterialPicker
          key={`${picker.med.id}-${picker.edit ? "edit" : "new"}`}
          medicine={picker.med}
          availableStrips={Math.max(0, picker.med.qty - stripsInCart(picker.med.id) + (picker.edit?.strips ?? 0))}
          initial={picker.edit ? { unit: picker.edit.unit, qty: picker.edit.qty, price: picker.edit.price, discountPct: picker.edit.discountPct } : undefined}
          editMode={!!picker.edit}
          onClose={() => setPicker(null)}
          onAdd={handlePickerAdd}
        />
      )}
    </div>
  );
}
