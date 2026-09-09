import { useState, type FormEvent } from "react";
import type { User } from "../types";
import { DEMO_ACCOUNTS } from "../types";
import { api, ApiError } from "../api";
import {
  BellIcon,
  ChartIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogoMark,
  PillIcon,
  ShieldIcon,
  SpinnerIcon,
  UserIcon,
} from "../icons";

export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { user } = await api.login(username.trim().toLowerCase(), password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "اسم المستخدم أو كلمة المرور غير صحيحة");
      setShake((s) => s + 1);
      setLoading(false);
    }
  };

  const fill = (name: string) => {
    setUsername(name);
    setPassword("1234");
    setError("");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ===== لوحة الهوية ===== */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-bl from-slate-950 via-blue-950 to-cyan-900 text-white lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='white'%3E%3Cpath d='M28 16h8v12h12v8H36v12h-8V36H16v-8h12z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-sky-500/15 blur-3xl" />

        {/* كبسولات عائمة */}
        <span className="anim-drift pointer-events-none absolute left-[12%] top-[16%] text-[44px] text-cyan-300/25" style={{ animationDelay: "0s" }}>
          <PillIcon />
        </span>
        <span className="anim-drift pointer-events-none absolute right-[14%] top-[58%] text-[30px] text-sky-300/20" style={{ animationDelay: "1.2s" }}>
          <PillIcon />
        </span>
        <span className="anim-drift pointer-events-none absolute left-[30%] bottom-[14%] text-[24px] text-cyan-200/20" style={{ animationDelay: "2.1s" }}>
          <PillIcon />
        </span>

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3.5">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-[32px] text-cyan-300 ring-1 ring-white/20 backdrop-blur-sm">
              <LogoMark />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold">مكتب الفيض الدوائي العلمي</p>
              <p className="text-xs text-cyan-200/80">ALFAYD SCIENTIFIC PHARMACEUTICAL OFFICE</p>
            </div>
          </div>

          <div>
            <h1 className="anim-fade-up font-display text-4xl font-black leading-[1.25] xl:text-5xl">
              إدارة دوائية دقيقة،
              <br />
              <span className="text-cyan-300">من المخزون إلى الفاتورة</span>
            </h1>
            <p className="anim-fade-up mt-4 max-w-md text-[15px] leading-7 text-slate-300" style={{ animationDelay: "120ms" }}>
              نظام متكامل لمتابعة الأصناف والصلاحية والمبيعات في مكان واحد — مبني خصيصاً لعمل المكاتب العلمية الدوائية.
            </p>

            <ul className="stagger mt-9 space-y-4">
              {[
                { icon: <PillIcon />, title: "مخزون لحظي", desc: "تتبع الكميات وحدود الطلب لكل صنف" },
                { icon: <BellIcon />, title: "تنبيهات صلاحية ذكية", desc: "إنذار مبكر قبل انتهاء الأدوية بـ 90 يوماً" },
                { icon: <ChartIcon />, title: "تقارير جاهزة", desc: "مبيعات وأرباح بضغطة، مع طباعة وتصدير" },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-400/12 text-xl text-cyan-300 ring-1 ring-cyan-300/25">
                    {f.icon}
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-bold">{f.title}</p>
                    <p className="text-[13px] text-slate-400">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldIcon className="text-cyan-400/70" />
            جلسة آمنة على السيرفر — كلمات المرور مُهشّة ولا تُخزَّن في المتصفح
          </p>
        </div>
      </aside>

      {/* ===== نموذج الدخول ===== */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* شعار للجوال */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-bl from-blue-950 to-cyan-800 text-[26px] text-cyan-200 shadow-lg shadow-cyan-900/30">
              <LogoMark />
            </span>
            <div>
              <p className="font-display text-base font-extrabold text-slate-900">مكتب الفيض الدوائي العلمي</p>
              <p className="text-[11px] text-slate-400">نظام إدارة الأدوية والمخزون</p>
            </div>
          </div>

          <div className="anim-pop-in rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/6 sm:p-9">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">تسجيل الدخول</h2>
            <p className="mt-1.5 text-sm text-slate-400">أهلاً بعودتك — أدخل بياناتك لفتح النظام</p>

            <form onSubmit={submit} className="mt-7 space-y-4" key={shake}>
              <label className={`block ${shake ? "anim-shake" : ""}`}>
                <span className="mb-1.5 block text-[13px] font-bold text-slate-600">اسم المستخدم</span>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-300" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoFocus
                    dir="ltr"
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pe-4 ps-11 text-sm text-left text-slate-800 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-slate-600">كلمة المرور</span>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-300" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    dir="ltr"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pe-11 ps-11 text-sm text-left text-slate-800 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute left-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                    title={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPass ? <EyeOffIcon className="text-lg" /> : <EyeIcon className="text-lg" />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="anim-fade-in flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-bold text-rose-700">
                  <span className="size-1.5 shrink-0 rounded-full bg-rose-500" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-900 via-sky-800 to-cyan-700 py-3.5 font-display text-[15px] font-bold text-white shadow-lg shadow-sky-900/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="animate-spin text-lg" />
                    جارٍ التحقق...
                  </>
                ) : (
                  "دخول النظام"
                )}
              </button>
            </form>
          </div>

          {/* حسابات تجريبية */}
          <div className="anim-fade-up mt-5 rounded-xl border border-dashed border-cyan-300/70 bg-cyan-50/60 p-4" style={{ animationDelay: "200ms" }}>
            <p className="text-[13px] font-bold text-cyan-900">حسابات تجريبية للتجربة السريعة</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => fill(u.username)}
                  className="group rounded-lg border border-cyan-200/70 bg-white px-3 py-2.5 text-start transition-all hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-900/8"
                >
                  <p className="font-display text-[13px] font-extrabold text-slate-800 group-hover:text-cyan-800">{u.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {u.role} · <span dir="ltr">{u.username} / 1234</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
