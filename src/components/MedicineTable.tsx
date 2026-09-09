import type { Medicine } from "../types";
import { STATUS_META, daysUntil, expiryLabel, fmtDate, fmtMoney, fmtNum, getStatus, medBreakdown } from "../types";
import { BoxIcon, CartIcon, PencilIcon, SortIcon, TrashIcon } from "../icons";

export type SortKey = "name" | "company" | "qty" | "sellPrice" | "expiry";
export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface Props {
  medicines: Medicine[];
  totalCount: number;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onOpen: (m: Medicine) => void;
  onAddToCart: (m: Medicine) => void;
  onEdit: (m: Medicine) => void;
  onDelete: (m: Medicine) => void;
  onResetFilters: () => void;
  hasFilters: boolean;
}

function QtyMeter({ m }: { m: Medicine }) {
  const ratio = m.minQty > 0 ? Math.min(1, m.qty / (m.minQty * 4)) : 1;
  const status = getStatus(m);
  const color =
    status === "out" || status === "expired"
      ? "bg-rose-500"
      : status === "low"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="mt-1.5 h-1 w-full max-w-20 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.max(m.qty > 0 ? 6 : 0, ratio * 100)}%` }}
      />
    </div>
  );
}

export function MedicineTable({
  medicines,
  totalCount,
  sort,
  onSort,
  onOpen,
  onAddToCart,
  onEdit,
  onDelete,
  onResetFilters,
  hasFilters,
}: Props) {
  const Th = ({
    label,
    k,
    className = "",
  }: {
    label: string;
    k?: SortKey;
    className?: string;
  }) => (
    <th className={`px-4 py-3 text-right text-xs font-bold text-slate-500 ${className}`}>
      {k ? (
        <button
          onClick={() => onSort(k)}
          className="group inline-flex items-center gap-1 rounded transition-colors hover:text-cyan-700"
          title="اضغط للفرز"
        >
          {label}
          <SortIcon
            dir={sort.key === k ? sort.dir : null}
            className={`text-[14px] ${sort.key === k ? "text-cyan-600" : "text-slate-300 group-hover:text-cyan-500"}`}
          />
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "140ms" }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <Th label="الدواء والتركيز" k="name" className="w-[22%]" />
              <Th label="التصنيف" />
              <Th label="الشركة" k="company" />
              <Th label="رقم الباج" />
              <Th label="تاريخ الإنتاج" />
              <Th label="تاريخ الانتهاء" k="expiry" />
              <Th label="الكمية" k="qty" />
              <Th label="سعر القطعة" k="sellPrice" />
              <Th label="" className="w-24" />
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => {
              const st = getStatus(m);
              const meta = STATUS_META[st];
              const d = daysUntil(m.expiry);
              return (
                <tr
                  key={m.id}
                  onClick={() => onOpen(m)}
                  title="اضغط لعرض كامل التفاصيل"
                  className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-cyan-50/45"
                  style={{ animationDelay: `${Math.min(i * 35, 400)}ms` }}
                >
                  {/* الدواء والتركيز */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(m); }}
                        title="إضافة إلى سلة المبيعات"
                        disabled={m.qty === 0}
                        className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-[17px] text-emerald-600 ring-1 ring-emerald-200/80 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600 disabled:hover:shadow-none"
                      >
                        <CartIcon />
                      </button>
                      <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-display text-[11px] font-bold text-cyan-200 ring-1 ring-white/10">
                        {m.name.slice(0, 2)}
                        <span className={`absolute -left-1 -top-1 size-2.5 rounded-full ring-2 ring-white ${meta.dot} ${st === "expired" ? "pulse-danger" : ""}`} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-cyan-800">{m.name}</p>
                        <p className="truncate text-xs text-slate-400">{m.strength} · {m.form}</p>
                      </div>
                    </div>
                  </td>
                  {/* التصنيف */}
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
                      {m.category}
                    </span>
                  </td>
                  {/* الشركة */}
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-700">{m.company}</span>
                  </td>
                  {/* رقم الباج */}
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-cyan-50 px-2 py-1 font-mono text-xs font-bold text-cyan-800 ring-1 ring-cyan-100 tabular-nums" dir="ltr">
                      {m.batch}
                    </span>
                  </td>
                  {/* تاريخ الإنتاج */}
                  <td className="px-4 py-3.5 text-slate-500">{fmtDate(m.prodDate)}</td>
                  {/* تاريخ الانتهاء */}
                  <td className="px-4 py-3.5">
                    <p className={`font-medium tabular-nums ${d < 0 ? "text-rose-700" : d <= 90 ? "text-orange-700" : "text-slate-600"}`}>
                      {fmtDate(m.expiry)}
                    </p>
                    <p className={`text-[11px] ${d < 0 ? "font-semibold text-rose-500" : "text-slate-400"}`}>{expiryLabel(m.expiry)}</p>
                  </td>
                  {/* الكمية */}
                  <td className="px-4 py-3.5">
                    <span className={`font-display font-bold tabular-nums ${m.qty === 0 ? "text-rose-600" : m.qty <= m.minQty ? "text-amber-700" : "text-slate-800"}`}>
                      {fmtNum(m.qty)} <span className="text-[10.5px] font-bold text-slate-400">شريط</span>
                    </span>
                    <QtyMeter m={m} />
                    <p className="mt-1 text-[10.5px] text-slate-400">{medBreakdown(m, m.qty)}</p>
                  </td>
                  {/* سعر القطعة */}
                  <td className="px-4 py-3.5 font-display font-bold text-slate-800 tabular-nums">{fmtMoney(m.sellPrice)}</td>
                  {/* إجراءات */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                        title="تعديل"
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition-all hover:-translate-y-0.5 hover:bg-cyan-600 hover:text-white active:translate-y-0"
                      >
                        <PencilIcon className="text-[16px]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(m); }}
                        title="حذف"
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white active:translate-y-0"
                      >
                        <TrashIcon className="text-[16px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {medicines.length === 0 && (
          <div className="anim-fade-in flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="anim-drift grid size-16 place-items-center rounded-2xl bg-slate-100 text-[30px] text-slate-300">
              <BoxIcon />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-slate-700">
                {hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد أدوية مسجلة"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {hasFilters
                  ? "جرّب تعديل البحث أو الفلاتر للعثور على ما تحتاجه."
                  : "ابدأ بإضافة أول دواء إلى المخزون."}
              </p>
            </div>
            {hasFilters && (
              <button
                onClick={onResetFilters}
                className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700"
              >
                مسح الفلاتر
              </button>
            )}
            {!hasFilters && totalCount === 0 && (
              <p className="text-xs text-slate-300">يمكنك استعادة البيانات التجريبية من صفحة الإعدادات</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
