import { useState } from "react";
import type { User } from "../types";
import { fmtNum } from "../types";
import { GearIcon, LogoutIcon, RestoreIcon, ShieldIcon, TrashIcon, UserIcon, FlaskIcon } from "../icons";

interface Props {
  user: User;
  onLogout: () => void;
  restoreSeed: () => void;
  clearAll: () => void;
  medicineCount: number;
  invoiceCount: number;
}

export function Settings({ user, onLogout, restoreSeed, clearAll, medicineCount, invoiceCount }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="anim-fade-up">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-400">إدارة الحساب وبيانات النظام على السيرفر</p>
      </div>

      {/* الحساب */}
      <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <UserIcon className="text-xl text-cyan-700" />
          <h2 className="font-display text-base font-extrabold text-slate-900">الحساب الحالي</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-bl from-blue-950 to-cyan-800 font-display text-xl font-black text-cyan-200 shadow-md shadow-cyan-900/25">
              {user.name.slice(0, 2)}
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-900">{user.name}</p>
              <p className="text-[13px] text-slate-400">
                {user.role} · <span dir="ltr" className="font-medium text-slate-500">@{user.username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100"
          >
            <LogoutIcon className="text-base" />
            تسجيل الخروج
          </button>
        </div>
      </section>

      {/* البيانات — للمدير فقط */}
      {user.role === "مدير النظام" && (
      <section className="anim-fade-up overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "140ms" }}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <GearIcon className="text-xl text-cyan-700" />
          <h2 className="font-display text-base font-extrabold text-slate-900">بيانات النظام</h2>
          <span className="ms-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500 tabular-nums">
            {fmtNum(medicineCount)} صنف · {fmtNum(invoiceCount)} فاتورة
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-lg text-cyan-700 ring-1 ring-cyan-200/70">
                <RestoreIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">استعادة البيانات التجريبية</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-400">يعيد 18 صنفاً، 8 فواتير، 5 طلبيات و7 جهات افتراضية — يستبدل كل البيانات الحالية</p>
              </div>
            </div>
            <button
              onClick={restoreSeed}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white shadow-sm shadow-cyan-600/25 transition-all hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0"
            >
              استعادة
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-lg text-rose-600 ring-1 ring-rose-200/70">
                <TrashIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">حذف جميع البيانات</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-400">يمسح المخزون والفواتير نهائياً من السيرفر — للمدير فقط</p>
              </div>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-[13px] font-bold text-rose-600 transition-all hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-0"
            >
              حذف الكل
            </button>
          </div>
        </div>
      </section>
      )}

      {/* حول النظام */}
      <section className="anim-fade-up rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm" style={{ animationDelay: "200ms" }}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg text-cyan-300">
            <FlaskIcon />
          </span>
          <div className="text-[13px] leading-6 text-slate-500">
            <p className="font-display text-sm font-extrabold text-slate-800">نظام إدارة الأدوية — الإصدار 2.0</p>
            <p className="mt-1">
              مبني خصيصاً لمكتب الفيض الدوائي العلمي: مخزون لحظي، فواتير بخصم تلقائي، تنبيهات صلاحية، وتقارير قابلة للطباعة.
              البيانات محفوظة في قاعدة بيانات SQLite على السيرفر مع جلسة آمنة وكلمات مرور مُهشّة. أنشئ نسخة احتياطية دورياً من صفحة التقارير.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldIcon className="text-emerald-600" />
              جلسة سيرفر آمنة · يُنصح بالنشر خلف HTTPS
            </p>
          </div>
        </div>
      </section>

      {/* تأكيد الحذف الكلي */}
      {confirmClear && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]" onClick={() => setConfirmClear(false)}>
          <div className="anim-pop-in w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <span className="pulse-danger mx-auto grid size-14 place-items-center rounded-full bg-rose-100 text-[26px] text-rose-600">
              <TrashIcon />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-900">حذف جميع البيانات؟</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              سيتم مسح <strong>{fmtNum(medicineCount)} صنف</strong>، <strong>{fmtNum(invoiceCount)} فاتورة</strong>، وكل الطلبيات والجهات نهائياً.
              ننصح بتنزيل نسخة احتياطية من صفحة التقارير أولاً.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                تراجع
              </button>
              <button
                onClick={() => { setConfirmClear(false); clearAll(); }}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-600/30 transition-all hover:-translate-y-0.5 hover:bg-rose-700 active:translate-y-0"
              >
                نعم، امسح الكل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
