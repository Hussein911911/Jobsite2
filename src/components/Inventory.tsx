import { useMemo, useState } from "react";
import type { InvoiceItem, Medicine, Status } from "../types";
import { CATEGORIES, STATUS_FILTERS, cartStripsOf, fmtMoney, fmtNum, getStatus, unitLabel } from "../types";
import { MedicineTable, type SortKey, type SortState } from "./MedicineTable";
import { MedicineModal } from "./MedicineModal";
import { DetailsModal } from "./DetailsModal";
import { ConfirmDelete } from "./Overlays";
import { MaterialPicker } from "./MaterialPicker";
import { ArrowLeftIcon, CartIcon, ChevronDownIcon, PillIcon, PlusIcon, SearchIcon, XIcon } from "../icons";

interface Props {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  pushToast: (type: "success" | "error" | "info", msg: string) => void;
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  status: Status | "all";
  setStatus: (v: Status | "all") => void;
  cartItems: InvoiceItem[];
  onAddToCart: (item: InvoiceItem) => boolean;
  goToSales: () => void;
}

export function Inventory({ medicines, setMedicines, pushToast, search, setSearch, category, setCategory, status, setStatus, cartItems, onAddToCart, goToSales }: Props) {
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [toDelete, setToDelete] = useState<Medicine | null>(null);
  const [details, setDetails] = useState<Medicine | null>(null);
  const [pickerMed, setPickerMed] = useState<Medicine | null>(null);

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const handleAddToCart = (item: InvoiceItem, keepOpen: boolean) => {
    const merged = onAddToCart(item);
    if (merged) {
      pushToast("info", `تم دمج «${item.name}» في سلة المبيعات`);
    } else {
      pushToast("success", `أُضيف «${item.name}» — ${fmtNum(item.qty)} ${unitLabel(item.unit)} إلى سلة المبيعات`);
    }
    if (!keepOpen) setPickerMed(null);
  };

  const byStatus = useMemo(() => {
    const c: Record<string, number> = { all: medicines.length, ok: 0, low: 0, out: 0, soon: 0, expired: 0 };
    for (const m of medicines) c[getStatus(m)]++;
    return c;
  }, [medicines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (status !== "all" && getStatus(m) !== status) return false;
      if (q) {
        const hay = `${m.name} ${m.scientific} ${m.company} ${m.strength} ${m.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sort.key) {
        case "qty": return (a.qty - b.qty) * dir;
        case "sellPrice": return (a.sellPrice - b.sellPrice) * dir;
        case "expiry": return (new Date(a.expiry).getTime() - new Date(b.expiry).getTime()) * dir;
        case "company": return a.company.localeCompare(b.company, "ar") * dir;
        default: return a.name.localeCompare(b.name, "ar") * dir;
      }
    });
  }, [medicines, search, category, status, sort]);

  const filteredValue = filtered.reduce((s, m) => s + m.qty * m.sellPrice, 0);
  const hasFilters = search.trim() !== "" || category !== "all" || status !== "all";

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const handleSave = (data: Omit<Medicine, "id" | "createdAt">, id?: string) => {
    if (id) {
      setMedicines((list) => list.map((m) => (m.id === id ? { ...m, ...data } : m)));
      pushToast("success", `تم تحديث بيانات «${data.name}» بنجاح`);
    } else {
      const med: Medicine = {
        ...data,
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };
      setMedicines((list) => [med, ...list]);
      pushToast("success", `تمت إضافة «${data.name}» إلى المخزون`);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setMedicines((list) => list.filter((m) => m.id !== toDelete.id));
    pushToast("info", `تم حذف «${toDelete.name}» من المخزون`);
    setToDelete(null);
  };

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  return (
    <div className="space-y-4">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">سجل المخزون</h1>
          <p className="mt-1 text-sm text-slate-400">
            {fmtNum(medicines.length)} صنف مسجل · القيمة البيعية {fmtMoney(medicines.reduce((s, m) => s + m.qty * m.sellPrice, 0))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cartItems.length > 0 && (
            <button
              onClick={goToSales}
              className="anim-pop-in group inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-extrabold text-emerald-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md"
              title="الانتقال إلى المبيعات لإتمام الفاتورة"
            >
              <span className="relative">
                <CartIcon className="text-lg" />
                <span className="absolute -left-2 -top-2 grid min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[9.5px] font-black text-white tabular-nums">
                  {fmtNum(cartItems.length)}
                </span>
              </span>
              سلة المبيعات: {fmtNum(cartCount)} وحدة
              <ArrowLeftIcon className="text-sm text-emerald-500 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-md active:translate-y-0"
          >
            <PlusIcon className="text-base" />
            إضافة دواء
          </button>
        </div>
      </div>

      {/* شريط الأدوات */}
      <section className="anim-fade-up flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم التجاري، العلمي، الشركة..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2.5 pe-10 ps-4 text-sm outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="مسح البحث"
            >
              <XIcon className="text-sm" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/60 py-2.5 pe-9 ps-4 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25 lg:w-52"
          >
            <option value="all">كل التصنيفات</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-bold transition-all ${
                  active ? "bg-white text-cyan-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-px text-[10px] font-extrabold tabular-nums ${active ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {fmtNum(byStatus[f.key] ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <MedicineTable
        medicines={filtered}
        totalCount={medicines.length}
        sort={sort}
        onSort={onSort}
        onOpen={setDetails}
        onAddToCart={(m) => setPickerMed(m)}
        onEdit={(m) => { setDetails(null); setEditing(m); setModalOpen(true); }}
        onDelete={(m) => { setDetails(null); setToDelete(m); }}
        onResetFilters={resetFilters}
        hasFilters={hasFilters}
      />

      <footer className="anim-fade-up flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-500">
        <p>
          عرض <strong className="font-display text-slate-800">{fmtNum(filtered.length)}</strong> من أصل{" "}
          <strong className="font-display text-slate-800">{fmtNum(medicines.length)}</strong> صنف
          {filtered.length > 0 && (
            <>
              {" "}· القيمة البيعية المعروضة:{" "}
              <strong className="font-display text-emerald-700 tabular-nums">{fmtMoney(filteredValue)}</strong>
            </>
          )}
        </p>
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <PillIcon className="text-sm text-cyan-600/60" />
          تُحفظ التغييرات تلقائياً على السيرفر
        </span>
      </footer>

      <DetailsModal
        medicine={details}
        onClose={() => setDetails(null)}
        onEdit={(m) => { setDetails(null); setEditing(m); setModalOpen(true); }}
        onDelete={(m) => { setDetails(null); setToDelete(m); }}
      />
      {pickerMed && (
        <MaterialPicker
          medicine={pickerMed}
          availableStrips={Math.max(0, pickerMed.qty - cartStripsOf(cartItems, pickerMed.id))}
          onClose={() => setPickerMed(null)}
          onAdd={handleAddToCart}
        />
      )}
      <MedicineModal open={modalOpen} editing={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />
      <ConfirmDelete medicine={toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
