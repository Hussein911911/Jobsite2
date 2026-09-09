import { useCallback, useEffect, useRef, useState } from "react";
import type { Customer, Invoice, InvoiceItem, Medicine, Page, Purchase, Status, User } from "./types";
import { fmtNum, getStatus, mergeIntoCart } from "./types";
import { api, ApiError, type Snapshot } from "./api";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Sales } from "./components/Sales";
import { Purchases } from "./components/Purchases";
import { Reports } from "./components/Reports";
import { AlertsPage } from "./components/AlertsPage";
import { Settings } from "./components/Settings";
import { PrintReport } from "./components/PrintReport";
import { InvoicePrintModal } from "./components/InvoicePrintModal";
import { ToastStack, type Toast } from "./components/Overlays";
import {
  BellIcon,
  CartIcon,
  ChartIcon,
  DashboardIcon,
  GearIcon,
  LogoMark,
  LogoutIcon,
  PillIcon,
  TruckIcon,
} from "./icons";

type PrintDoc = { kind: "invoice"; invoice: Invoice } | null;

const NAV: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: <DashboardIcon /> },
  { key: "inventory", label: "المخزون", icon: <PillIcon /> },
  { key: "sales", label: "المبيعات", icon: <CartIcon /> },
  { key: "purchases", label: "المشتريات", icon: <TruckIcon /> },
  { key: "reports", label: "التقارير", icon: <ChartIcon /> },
  { key: "alerts", label: "التنبيهات", icon: <BellIcon /> },
  { key: "settings", label: "الإعدادات", icon: <GearIcon /> },
];

function BootScreen({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-bl from-blue-900 to-cyan-700 text-3xl text-cyan-200 shadow-lg shadow-cyan-950/50">
          <LogoMark />
        </span>
        <p className="mt-5 font-display text-lg font-extrabold">مكتب الفيض الدوائي العلمي</p>
        {error ? (
          <>
            <p className="mt-3 text-sm leading-6 text-rose-300">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-5 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-500"
              >
                إعادة المحاولة
              </button>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">جارٍ الاتصال بالسيرفر...</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [page, setPage] = useState<Page>("dashboard");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [printDoc, setPrintDoc] = useState<PrintDoc>(null);
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [invStatus, setInvStatus] = useState<Status | "all">("all");

  const skipSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

  const applySnap = (snap: Snapshot) => {
    skipSave.current = true;
    setMedicines(snap.medicines);
    setInvoices(snap.invoices);
    setPurchases(snap.purchases);
    setCustomers(snap.customers);
  };

  const addToCart = (item: InvoiceItem): boolean => {
    const r = mergeIntoCart(cartItems, item);
    setCartItems(r.list);
    return r.merged;
  };

  const pushToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, type, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const boot = useCallback(async () => {
    setBooting(true);
    setBootError("");
    try {
      const { user: u } = await api.me();
      const snap = await api.snapshot();
      applySnap(snap);
      setUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setBootError(err instanceof Error ? err.message : "تعذر الاتصال بالسيرفر");
      }
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (!user) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.saveSnapshot({ medicines, invoices, purchases, customers }).catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
          pushToast("error", "انتهت الجلسة — سجّل الدخول مجدداً");
          return;
        }
        pushToast("error", "تعذر حفظ البيانات على السيرفر");
      });
    }, 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [medicines, invoices, purchases, customers, user, pushToast]);

  const goTo = (p: Page, status?: Status | "all") => {
    if (status !== undefined) {
      setInvStatus(status);
      setSearch("");
      setCategory("all");
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restoreSeed = async () => {
    try {
      const snap = await api.restoreSeed();
      applySnap(snap);
      pushToast("info", "تمت استعادة البيانات التجريبية كاملة");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "تعذر الاستعادة");
    }
  };

  const clearAll = async () => {
    try {
      const snap = await api.clearAll();
      applySnap(snap);
      setCartItems([]);
      pushToast("info", "تم مسح جميع البيانات من السيرفر");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "تعذر المسح");
    }
  };

  const handleLogin = async (u: User) => {
    try {
      const snap = await api.snapshot();
      applySnap(snap);
      setUser(u);
      setPage("dashboard");
      pushToast("success", `مرحباً ${u.name} — تم تسجيل الدخول`);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "تعذر تحميل البيانات");
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      /* تجاهل */
    }
    skipSave.current = true;
    setUser(null);
    setPage("dashboard");
    setCartItems([]);
  };

  const alertCount = medicines.filter((m) => getStatus(m) !== "ok").length;

  if (booting) return <BootScreen />;
  if (bootError) return <BootScreen error={bootError} onRetry={() => void boot()} />;

  if (!user) {
    return (
      <>
        <Login onLogin={(u) => void handleLogin(u)} />
        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </>
    );
  }

  return (
    <>
    <div className={`min-h-screen ${printDoc ? "hidden" : "print:hidden"}`}>
      <aside className="no-print fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-white/5 bg-slate-950 text-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-bl from-blue-900 to-cyan-700 text-[24px] text-cyan-200 shadow-lg shadow-cyan-950/50">
            <LogoMark />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-extrabold leading-tight">مكتب الفيض الدوائي</p>
            <p className="text-[10.5px] font-medium tracking-wide text-cyan-300/70">نظام إدارة الأدوية v2</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => goTo(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  active ? "bg-white/8 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={`absolute inset-y-2 right-0 w-1 rounded-full bg-cyan-400 transition-all duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`} />
                <span className={`text-lg transition-transform duration-200 ${active ? "text-cyan-300" : "group-hover:scale-110"}`}>{item.icon}</span>
                {item.label}
                {item.key === "alerts" && alertCount > 0 && (
                  <span className="ms-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-extrabold text-amber-300 ring-1 ring-amber-300/25 tabular-nums">
                    {fmtNum(alertCount)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-blue-900 to-cyan-700 font-display text-sm font-black text-cyan-200">
              {user.name.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.role}</p>
            </div>
            <button
              onClick={() => void handleLogout()}
              title="تسجيل الخروج"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-all hover:bg-rose-500/15 hover:text-rose-400"
            >
              <LogoutIcon className="text-lg" />
            </button>
          </div>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-40 border-b border-white/8 bg-slate-950/95 text-white backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-bl from-blue-900 to-cyan-700 text-xl text-cyan-200">
              <LogoMark />
            </span>
            <p className="font-display text-sm font-extrabold">مكتب الفيض الدوائي العلمي</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-slate-400 sm:block">{user.name}</span>
            <button
              onClick={() => void handleLogout()}
              className="grid size-9 place-items-center rounded-lg bg-white/8 text-slate-300 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
              title="تسجيل الخروج"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => goTo(item.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-all ${
                  active ? "bg-cyan-600 text-white shadow-sm shadow-cyan-950/40" : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.key === "alerts" && alertCount > 0 && (
                  <span className="rounded-full bg-amber-400/20 px-1.5 text-[10px] font-extrabold text-amber-300 tabular-nums">{fmtNum(alertCount)}</span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="lg:pr-64">
        <main className="no-print mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {page === "dashboard" && <Dashboard user={user} medicines={medicines} invoices={invoices} goTo={goTo} />}
          {page === "inventory" && (
            <Inventory
              medicines={medicines}
              setMedicines={setMedicines}
              pushToast={pushToast}
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              status={invStatus}
              setStatus={setInvStatus}
              cartItems={cartItems}
              onAddToCart={addToCart}
              goToSales={() => goTo("sales")}
            />
          )}
          {page === "sales" && (
            <Sales
              medicines={medicines}
              setMedicines={setMedicines}
              invoices={invoices}
              setInvoices={setInvoices}
              items={cartItems}
              setItems={setCartItems}
              customers={customers}
              onAddCustomer={(c) => {
                setCustomers((list) => [c, ...list]);
                pushToast("success", `تمت إضافة «${c.name}» إلى ${c.kind === "pharmacy" ? "الصيدليات" : "المذاخر"}`);
              }}
              onDeleteCustomer={(id) => {
                const c = customers.find((x) => x.id === id);
                setCustomers((list) => list.filter((x) => x.id !== id));
                if (c) pushToast("info", `تم حذف «${c.name}» من السجل`);
              }}
              pushToast={pushToast}
              onPrintInvoice={(inv) => setPrintDoc({ kind: "invoice", invoice: inv })}
              userName={user.name}
            />
          )}
          {page === "purchases" && (
            <Purchases
              medicines={medicines}
              setMedicines={setMedicines}
              purchases={purchases}
              setPurchases={setPurchases}
              pushToast={pushToast}
            />
          )}
          {page === "reports" && (
            <Reports
              medicines={medicines}
              invoices={invoices}
              purchases={purchases}
              customers={customers}
              setMedicines={setMedicines}
              setInvoices={setInvoices}
              setPurchases={setPurchases}
              setCustomers={setCustomers}
              restoreSeed={() => void restoreSeed()}
              pushToast={pushToast}
            />
          )}
          {page === "alerts" && <AlertsPage medicines={medicines} goTo={goTo} />}
          {page === "settings" && (
            <Settings
              user={user}
              onLogout={() => void handleLogout()}
              restoreSeed={() => void restoreSeed()}
              clearAll={() => void clearAll()}
              medicineCount={medicines.length}
              invoiceCount={invoices.length}
            />
          )}
        </main>

        <footer className="no-print border-t border-slate-200/70 py-4 text-center text-[11px] text-slate-400">
          مكتب الفيض الدوائي العلمي — نظام إدارة الأدوية · البيانات محفوظة على السيرفر
        </footer>
      </div>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>

    {printDoc ? (
      <InvoicePrintModal invoice={printDoc.invoice} medicines={medicines} onClose={() => setPrintDoc(null)} />
    ) : (
      <PrintReport medicines={medicines} title="المخزون الكامل" />
    )}
    </>
  );
}
