import { CheckIcon, InfoIcon, TrashIcon, XIcon } from "../icons";
import type { Medicine } from "../types";

/* ---------- تأكيد الحذف ---------- */

export function ConfirmDelete({
  medicine,
  onCancel,
  onConfirm,
}: {
  medicine: Medicine | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!medicine) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]" onClick={onCancel}>
      <div className="anim-pop-in w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <span className="pulse-danger mx-auto grid size-14 place-items-center rounded-full bg-rose-100 text-[26px] text-rose-600">
          <TrashIcon />
        </span>
        <h3 className="mt-4 font-display text-lg font-bold text-slate-900">حذف «{medicine.name}»؟</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          سيتم حذف هذا الصنف نهائياً من المخزون
          <span className="tabular-nums"> (الكمية الحالية: {medicine.qty})</span>. لا يمكن التراجع عن هذه الخطوة.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            تراجع
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-600/30 transition-all hover:-translate-y-0.5 hover:bg-rose-700 active:translate-y-0"
          >
            نعم، احذف
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- إشعارات ---------- */

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

const TOAST_STYLE = {
  success: { icon: CheckIcon, cls: "border-emerald-200 bg-white text-emerald-800", chip: "bg-emerald-600 text-white" },
  error: { icon: XIcon, cls: "border-rose-200 bg-white text-rose-800", chip: "bg-rose-600 text-white" },
  info: { icon: InfoIcon, cls: "border-cyan-200 bg-white text-cyan-900", chip: "bg-cyan-600 text-white" },
};

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="no-print pointer-events-none fixed bottom-5 left-5 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
      {toasts.map((t) => {
        const s = TOAST_STYLE[t.type];
        const Icon = s.icon;
        return (
          <button
            key={t.id}
            onClick={() => onDismiss(t.id)}
            className={`anim-toast-in pointer-events-auto flex items-center gap-3 rounded-xl border px-3.5 py-3 text-start shadow-lg shadow-slate-900/10 transition-transform hover:scale-[1.02] ${s.cls}`}
          >
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm ${s.chip}`}>
              <Icon />
            </span>
            <span className="text-sm font-bold leading-5">{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
