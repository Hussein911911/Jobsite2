import type { Invoice, Medicine } from "../types";
import { fmtBreakdown, fmtDate, fmtDateTime, fmtMoney, fmtNum, fmtTime, isApproved } from "../types";
import { LogoMark, PrinterIcon, XIcon } from "../icons";

export function InvoicePrintModal({ invoice, medicines, onClose }: { invoice: Invoice; medicines: Medicine[]; onClose: () => void }) {
  const inv = invoice;
  const units = inv.items.reduce((s, i) => s + i.qty, 0);
  const discountSum = inv.items.reduce((s, i) => s + (i.qty * i.price - i.total), 0);
  const approved = isApproved(inv);

  return (
    <>
      <div className="no-print anim-fade-in fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 print:static print:inset-auto print:overflow-visible print:p-0">
        <div className="mx-auto w-[760px] max-w-full print:w-auto print:max-w-none">
          {/* شريط الأدوات */}
          <div className="no-print mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-white/85">
              معاينة الفاتورة <span className="font-display tabular-nums">#{inv.number}</span> — جاهزة للطباعة
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-extrabold text-sky-950 shadow-lg shadow-cyan-950/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-400 active:translate-y-0"
              >
                <PrinterIcon className="text-base" />
                طباعة الآن
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 transition-all hover:bg-white/20"
              >
                <XIcon className="text-base" />
                إغلاق
              </button>
            </div>
          </div>

          {/* ===== ورقة الفاتورة ===== */}
          <div className="invoice-sheet relative overflow-hidden rounded-xl bg-white text-slate-900 shadow-2xl shadow-slate-950/40 print:rounded-none print:shadow-none" dir="rtl" style={{ fontFamily: "'Alexandria','Tajawal',sans-serif" }}>
            {!approved && (
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <span className="rotate-[-18deg] rounded-xl border-4 border-rose-400/50 px-8 py-3 font-display text-4xl font-black tracking-wider text-rose-400/45">
                  غير معتمدة
                </span>
              </div>
            )}
            {/* الترويسة */}
            <div className="flex items-center justify-between gap-4 border-b-4 border-cyan-700 bg-gradient-to-l from-blue-950 via-sky-900 to-cyan-800 px-7 py-5 text-white print:bg-none print:bg-white print:text-slate-900">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-xl bg-white/12 text-[26px] text-cyan-200 ring-1 ring-white/25 print:bg-cyan-700 print:text-white">
                  <LogoMark />
                </span>
                <div>
                  <p className="font-display text-lg font-black leading-tight">مكتب الفيض الدوائي العلمي</p>
                  <p className="text-[11px] text-cyan-100/85 print:text-slate-500">تجهيز الأدوية والمذاخر والصيدليات</p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-display text-xl font-black">فاتورة بيع</p>
                <p className="mt-0.5 text-[12px] font-bold tabular-nums text-cyan-200 print:text-slate-600">رقم: #{fmtNum(inv.number)}</p>
                <p className="text-[11px] tabular-nums text-cyan-100/85 print:text-slate-500">{fmtDateTime(inv.date)}</p>
                {!approved && (
                  <p className="mt-1 inline-block rounded bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 print:bg-rose-50">
                    نسخة غير معتمدة — لا تُخصم من المخزون
                  </p>
                )}
              </div>
            </div>

            {/* بيانات الزبون */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-7 py-3.5 print:bg-white">
              <div>
                <p className="text-[10.5px] font-bold text-slate-400">الجهة المشترية</p>
                <p className="font-display text-[15px] font-extrabold text-slate-900">{inv.customer}</p>
              </div>
              <div className="text-left">
                <p className="text-[10.5px] font-bold text-slate-400">طريقة الدفع</p>
                <p className={`font-display text-[15px] font-extrabold ${inv.payment === "نقدي" ? "text-emerald-700" : inv.settled ? "text-emerald-700" : "text-amber-600"}`}>
                  {inv.payment === "نقدي" ? "نقدي" : inv.settled ? "آجل — محصّلة" : "آجل"}
                </p>
              </div>
            </div>

            {/* تفاصيل القائمة: التواريخ والأوقات والمصمم */}
            <div className="grid grid-cols-4 divide-x divide-x-reverse divide-slate-200 border-b border-slate-200 px-7 py-3 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400">تاريخ القائمة</p>
                <p className="mt-0.5 text-[12.5px] font-extrabold text-slate-800 tabular-nums">{inv.listDate ? fmtDate(inv.listDate) : fmtDate(inv.date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">وقت التجهيز</p>
                <p className="mt-0.5 text-[12.5px] font-extrabold text-slate-800 tabular-nums">{fmtTime(inv.prepTime)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">وقت البيع</p>
                <p className="mt-0.5 text-[12.5px] font-extrabold text-slate-800 tabular-nums">{fmtTime(inv.saleTime)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">مصمم القائمة</p>
                <p className="mt-0.5 truncate text-[12.5px] font-extrabold text-slate-800">{inv.preparedBy ?? "—"}</p>
              </div>
            </div>

            {/* المواد */}
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-cyan-800 text-white print:bg-slate-800">
                  <th className="px-3 py-2.5 text-right text-[11.5px] font-bold">المادة والتركيز</th>
                  <th className="px-3 py-2.5 text-right text-[11.5px] font-bold">الشركة والباج</th>
                  <th className="px-3 py-2.5 text-center text-[11.5px] font-bold">الانتهاء</th>
                  <th className="px-3 py-2.5 text-center text-[11.5px] font-bold">العدد</th>
                  <th className="px-3 py-2.5 text-right text-[11.5px] font-bold">التجهيز</th>
                  <th className="px-3 py-2.5 text-center text-[11.5px] font-bold">الخصم</th>
                  <th className="px-3 py-2.5 text-right text-[11.5px] font-bold">سعر القطعة</th>
                  <th className="px-4 py-2.5 text-left text-[11.5px] font-bold">السعر الكلي</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((i, idx) => {
                  const lines = i.lines && i.lines.length > 1 ? i.lines : null;
                  const med = medicines.find((m) => m.id === i.medicineId);
                  return (
                    <tr key={`${i.medicineId}-${idx}`} className={`border-b border-slate-100 ${idx % 2 ? "bg-slate-50/70" : ""}`}>
                      <td className="px-3 py-2.5 font-extrabold">
                        {i.name} <span className="font-normal text-slate-400">({i.strength})</span>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span className="block text-[11.5px] font-bold text-slate-700">{med?.company ?? "—"}</span>
                        {med && <span className="rounded bg-cyan-50 px-1 py-0.5 font-mono text-[9.5px] font-bold text-cyan-800 print:border print:border-cyan-200" dir="ltr">{med.batch}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[11px] font-bold tabular-nums text-slate-600 align-top">
                        {med ? fmtDate(med.expiry) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold tabular-nums align-top">
                        <span className="inline-flex flex-col items-center">
                          {lines ? (
                            <span className="inline-flex flex-col items-center">
                              {lines.map((l, li) => (
                                <span key={li} className="flex flex-col items-center">
                                  {li > 0 && <span className="my-1 h-[2px] w-8 rounded-full bg-slate-300" />}
                                  <span className={li === 0 ? "font-extrabold text-slate-900" : "font-bold text-slate-500"}>{fmtNum(l.qty)}</span>
                                </span>
                              ))}
                            </span>
                          ) : fmtNum(i.qty)}
                          <span className="mt-0.5 text-[9.5px] font-extrabold text-slate-400">{i.unit === "piece" ? "قطعة" : "شريط"}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11px] font-bold text-slate-600">
                        {med ? fmtBreakdown(i.strips, med.stripsPerPiece, med.piecesPerCarton) : `${fmtNum(i.strips)} شريط`}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-slate-500 align-top">
                        {lines ? (
                          <span className="inline-flex flex-col items-center">
                            {lines.map((l, li) => (
                              <span key={li} className="flex flex-col items-center">
                                {li > 0 && <span className="my-1 h-[2px] w-8 rounded-full bg-slate-300" />}
                                <span className={li === 0 ? "font-extrabold text-slate-800" : "font-bold text-slate-500"}>{fmtNum(l.discountPct)}٪</span>
                              </span>
                            ))}
                          </span>
                        ) : i.discountPct > 0 ? `${fmtNum(i.discountPct)}٪` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtMoney(i.price)}</td>
                      <td className="px-4 py-2.5 text-left font-display font-extrabold tabular-nums">{fmtMoney(i.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* الإجمالي */}
            <div className="flex items-stretch justify-between gap-4 px-7 py-4">
              <p className="self-center text-[11px] leading-5 text-slate-400">
                عدد المواد: <strong className="text-slate-600 tabular-nums">{fmtNum(inv.items.length)}</strong> · إجمالي القطع:{" "}
                <strong className="text-slate-600 tabular-nums">{fmtNum(units)}</strong>
                {discountSum > 0 && (
                  <>
                    {" "}· إجمالي الخصومات: <strong className="text-emerald-700 tabular-nums">− {fmtMoney(discountSum)}</strong>
                  </>
                )}
              </p>
              <div className="min-w-52 rounded-lg bg-slate-900 px-5 py-3 text-white print:border print:border-slate-800 print:bg-white print:text-slate-900">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[12px] font-bold text-slate-300 print:text-slate-500">الإجمالي الكلي</span>
                  <span className="font-display text-lg font-black tabular-nums">{fmtMoney(inv.total)}</span>
                </div>
              </div>
            </div>

            {/* الملاحظات */}
            {inv.notes && (
              <div className="mx-7 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 print:bg-amber-50/60">
                <p className="text-[10.5px] font-extrabold text-amber-700">الملاحظات والتجهيزات الإضافية</p>
                <p className="mt-1 text-[12.5px] font-bold leading-6 text-amber-900">{inv.notes}</p>
              </div>
            )}

            {/* التواقيع */}
            <div className="grid grid-cols-2 gap-6 border-t border-dashed border-slate-300 px-7 pb-6 pt-5">
              <div className="text-center">
                <div className="mx-auto mb-1 h-10 w-44 border-b-2 border-slate-300" />
                <p className="text-[11px] font-bold text-slate-500">توقيع المستلم</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-1 h-10 w-44 border-b-2 border-slate-300" />
                <p className="text-[11px] font-bold text-slate-500">توقيع المحاسب</p>
              </div>
            </div>

            <p className="border-t border-slate-100 bg-slate-50 px-7 py-2.5 text-center text-[10px] text-slate-400 print:bg-white">
              شكراً لتعاملكم معنا — مكتب الفيض الدوائي العلمي · تُعد هذه الوثيقة صادرة من نظام إدارة الأدوية
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
