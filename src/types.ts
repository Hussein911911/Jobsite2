/* ================= الأنواع ================= */

export interface Medicine {
  id: string;
  name: string; // الاسم التجاري
  scientific: string; // الاسم العلمي
  category: string;
  form: string; // الشكل الصيدلاني
  strength: string; // التركيز
  batch: string; // رقم الباج
  prodDate: string; // تاريخ الإنتاج ISO
  expiry: string; // تاريخ الانتهاء ISO
  qty: number; // الكمية الحالية (بالأشرطة)
  minQty: number; // حد الطلب (بالأشرطة)
  buyPrice: number; // سعر شراء القطعة
  sellPrice: number; // سعر بيع القطعة
  company: string; // الشركة المنتجة
  stripsPerPiece: number; // عدد الأشرطة داخل القطعة
  piecesPerCarton: number; // عدد القطع داخل الكارتون
  createdAt: number;
}

export type SaleUnit = "piece" | "strip";

export interface InvoiceLine {
  qty: number;
  price: number;
  discountPct: number;
  total: number;
}

export interface InvoiceItem {
  medicineId: string;
  name: string;
  strength: string;
  unit: SaleUnit; // البيع بالقطعة أم بالشريط
  qty: number; // العدد بوحدة البيع (مجموع الأسطر عند الدمج)
  strips: number; // إجمالي الأشرطة (للخصم من المخزون)
  price: number; // سعر الوحدة (قبل الخصم)
  cost: number; // كلفة الوحدة (للربح)
  discountPct: number; // نسبة الخصم (متوسط موزون عند الدمج)
  total: number; // إجمالي السطر بعد الخصم
  lines?: InvoiceLine[]; // الأسطر الفردية عند دمج كميات/خصومات مختلفة
}

export interface Invoice {
  id: string;
  number: number;
  date: string; // ISO
  customerId: string;
  customer: string; // اسم الجهة (لقطة)
  payment: "نقدي" | "آجل";
  settled?: boolean; // للآجل: تم التحصيل؟
  approved?: boolean; // معتمدة (مخصومة من المخزون)؟
  prepTime?: string; // وقت التجهيز HH:MM
  saleTime?: string; // وقت البيع HH:MM
  listDate?: string; // تاريخ القائمة ISO
  preparedBy?: string; // اسم مصمم القائمة
  notes?: string; // ملاحظات (هدايا ترويجية: موبايل، شاشة...)
  items: InvoiceItem[];
  total: number;
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtTime(t?: string): string {
  if (!t) return "—";
  try {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return t;
  }
}

export const isApproved = (inv: Invoice): boolean => inv.approved !== false;

export interface PurchaseItem {
  medicineId: string;
  name: string;
  strength: string;
  qty: number; // بالأشرطة
  cost: number; // كلفة الشريط
}

export interface Purchase {
  id: string;
  number: number;
  date: string; // ISO
  company: string;
  items: PurchaseItem[];
  total: number;
  received: boolean; // مستلمة أم معلّقة
}

export type CustomerKind = "pharmacy" | "warehouse";

export interface Customer {
  id: string;
  name: string;
  kind: CustomerKind;
  phone: string;
  city: string;
  createdAt: number;
}

export interface User {
  username: string;
  name: string;
  role: string;
}

export type Status = "ok" | "low" | "out" | "soon" | "expired";
export type Page = "dashboard" | "inventory" | "sales" | "purchases" | "reports" | "alerts" | "settings";

/* ================= ثوابت ================= */

export const CATEGORIES = [
  "مضاد حيوي",
  "مسكن ومضاد التهاب",
  "فيتامينات ومكملات",
  "قلب وضغط",
  "سكري",
  "جهاز هضمي",
  "جهاز تنفسي",
  "مضاد حساسية",
  "جلدية وموضعي",
  "هرمونات",
  "مطهرات ومحاليل",
  "أخرى",
];

export const FORMS = [
  "أقراص",
  "كبسولات",
  "شراب",
  "حقن",
  "مرهم موضعي",
  "قطرة",
  "بخاخ",
  "تحاميل",
  "محلول",
];

export const COMPANIES = ["بايونير", "دجلة", "أسوار", "الكندي"];

export const CUSTOMER_KIND_META: Record<CustomerKind, { label: string; badge: string; dot: string }> = {
  pharmacy: { label: "صيدلية", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  warehouse: { label: "مذخر", badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
};

export const DEMO_ACCOUNTS: User[] = [
  { username: "admin", name: "أحمد الفيض", role: "مدير النظام" },
  { username: "staff", name: "سارة كريم", role: "موظفة مبيعات" },
];

export const CHART_COLORS = ["#0891b2", "#059669", "#d97706", "#e11d48", "#0284c7", "#0d9488", "#ca8a04", "#475569"];

/* ================= منطق الحالة ================= */

const DAY = 86_400_000;

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso).getTime() - today.getTime()) / DAY);
}

export function getStatus(m: Medicine): Status {
  const d = daysUntil(m.expiry);
  if (d < 0) return "expired";
  if (m.qty === 0) return "out";
  if (m.qty <= m.minQty) return "low";
  if (d <= 90) return "soon";
  return "ok";
}

export const STATUS_META: Record<
  Status,
  { label: string; badge: string; dot: string; rank: number }
> = {
  expired: { label: "منتهي الصلاحية", badge: "bg-rose-100 text-rose-800 ring-rose-200", dot: "bg-rose-600", rank: 0 },
  out: { label: "نافد", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", rank: 1 },
  low: { label: "منخفض", badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500", rank: 2 },
  soon: { label: "قرب الانتهاء", badge: "bg-orange-50 text-orange-800 ring-orange-200", dot: "bg-orange-500", rank: 3 },
  ok: { label: "متوفر", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500", rank: 4 },
};

export const STATUS_FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "ok", label: "متوفر" },
  { key: "low", label: "منخفض" },
  { key: "out", label: "نافد" },
  { key: "soon", label: "قرب الانتهاء" },
  { key: "expired", label: "منتهي" },
];

/* ================= التغليف والتجهيز ================= */

export function packBreakdown(totalStrips: number, stripsPerPiece: number, piecesPerCarton: number) {
  const spp = Math.max(1, stripsPerPiece);
  const spc = spp * Math.max(1, piecesPerCarton);
  const t = Math.max(0, Math.floor(totalStrips));
  const cartons = Math.floor(t / spc);
  const rem = t % spc;
  const pieces = Math.floor(rem / spp);
  const strips = rem % spp;
  return { cartons, pieces, strips };
}

export function fmtBreakdown(totalStrips: number, stripsPerPiece: number, piecesPerCarton: number): string {
  const { cartons, pieces, strips } = packBreakdown(totalStrips, stripsPerPiece, piecesPerCarton);
  const parts: string[] = [];
  if (cartons > 0) parts.push(`${fmtNum(cartons)} كارتون`);
  if (pieces > 0) parts.push(`${fmtNum(pieces)} قطعة`);
  if (strips > 0 || parts.length === 0) parts.push(`${fmtNum(strips)} شريط`);
  return parts.join(" و ");
}

export function medBreakdown(m: Medicine, totalStrips: number): string {
  return fmtBreakdown(totalStrips, m.stripsPerPiece, m.piecesPerCarton);
}

export function stripPriceOf(m: Medicine): number {
  return Math.round(m.sellPrice / Math.max(1, m.stripsPerPiece));
}

export function stripCostOf(m: Medicine): number {
  return Math.round(m.buyPrice / Math.max(1, m.stripsPerPiece));
}

export function unitPriceOf(m: Medicine, unit: SaleUnit): number {
  return unit === "piece" ? m.sellPrice : stripPriceOf(m);
}

export function unitCostOf(m: Medicine, unit: SaleUnit): number {
  return unit === "piece" ? m.buyPrice : stripCostOf(m);
}

export function unitLabel(unit: SaleUnit): string {
  return unit === "piece" ? "قطعة" : "شريط";
}

export function rowTotal(qty: number, price: number, discountPct: number): number {
  return Math.round(qty * price * (1 - Math.min(100, Math.max(0, discountPct)) / 100));
}

/* ---------- سلة المبيعات المشتركة ---------- */

export function cartStripsOf(list: InvoiceItem[], medId: string): number {
  return list.filter((i) => i.medicineId === medId).reduce((s, i) => s + i.strips, 0);
}

export function mergeIntoCart(list: InvoiceItem[], item: InvoiceItem): { list: InvoiceItem[]; merged: boolean } {
  const idx = list.findIndex((x) => x.medicineId === item.medicineId && x.unit === item.unit);
  if (idx < 0) return { list: [...list, item], merged: false };
  const next = list.map((x, i) => {
    if (i !== idx) return x;
    const qty = x.qty + item.qty;
    const strips = x.strips + item.strips;
    const subtotal = x.qty * x.price + item.qty * item.price;
    const total = x.total + item.total;
    const price = qty > 0 ? Math.round(subtotal / qty) : item.price;
    const discountPct = subtotal > 0 ? Math.round((1 - total / subtotal) * 1000) / 10 : 0;
    return { ...x, qty, strips, price, discountPct, total };
  });
  return { list: next, merged: true };
}

/* ================= تنسيق ================= */

const nf = new Intl.NumberFormat("en-US");

export function fmtNum(n: number): string {
  return nf.format(n);
}

export function fmtMoney(n: number): string {
  return `${nf.format(n)} د.ع`;
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("ar", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return iso;
  }
}

export function expiryLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return `منتهي منذ ${fmtNum(Math.abs(d))} يوم`;
  if (d === 0) return "ينتهي اليوم";
  return `متبقٍ ${fmtNum(d)} يوم`;
}

export function shelfLife(prod: string, expiry: string): string {
  const months = Math.round((new Date(expiry).getTime() - new Date(prod).getTime()) / (DAY * 30));
  if (months >= 12) {
    const y = Math.floor(months / 12);
    const r = months % 12;
    return r > 0 ? `${y} سنة و ${r} شهر` : `${y} سنة`;
  }
  return `${months} شهر`;
}

export function newId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function daysAgoISO(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 10 + days * 3, 0, 0);
  return d.toISOString();
}

/* ================= بيانات تجريبية ================= */

export const SEED_MEDICINES: Medicine[] = [
  { id: "m01", name: "بانادول إكسترا", scientific: "باراسيتامول + كافيين", category: "مسكن ومضاد التهاب", form: "أقراص", strength: "500 ملغ", batch: "240312", prodDate: "2025-03-12", expiry: "2027-03-18", qty: 340, minQty: 60, buyPrice: 1500, sellPrice: 2250, company: "بايونير", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 1 },
  { id: "m02", name: "أوجمنتين", scientific: "أموكسيسيلين + حامض الكلافولانيك", category: "مضاد حيوي", form: "أقراص", strength: "1 غم", batch: "241102", prodDate: "2024-11-15", expiry: "2026-11-02", qty: 120, minQty: 30, buyPrice: 4500, sellPrice: 6000, company: "الكندي", stripsPerPiece: 10, piecesPerCarton: 10, createdAt: 2 },
  { id: "m03", name: "أموكسيل", scientific: "أموكسيسيلين", category: "مضاد حيوي", form: "كبسولات", strength: "500 ملغ", batch: "240618", prodDate: "2025-01-20", expiry: "2026-12-15", qty: 18, minQty: 25, buyPrice: 2000, sellPrice: 3000, company: "بايونير", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 3 },
  { id: "m04", name: "فولتارين", scientific: "ديكلوفيناك صوديوم", category: "مسكن ومضاد التهاب", form: "حقن", strength: "75 ملغ/3مل", batch: "240425", prodDate: "2025-05-10", expiry: "2027-06-30", qty: 64, minQty: 20, buyPrice: 2750, sellPrice: 4000, company: "دجلة", stripsPerPiece: 5, piecesPerCarton: 20, createdAt: 4 },
  { id: "m05", name: "كونكور", scientific: "بيسوبرولول", category: "قلب وضغط", form: "أقراص", strength: "5 ملغ", batch: "240730", prodDate: "2025-08-01", expiry: "2027-09-12", qty: 210, minQty: 40, buyPrice: 3200, sellPrice: 4500, company: "الكندي", stripsPerPiece: 6, piecesPerCarton: 20, createdAt: 5 },
  { id: "m06", name: "جلوكوفاج", scientific: "ميتفورمين", category: "سكري", form: "أقراص", strength: "850 ملغ", batch: "240210", prodDate: "2025-01-25", expiry: "2027-01-25", qty: 0, minQty: 50, buyPrice: 1800, sellPrice: 2750, company: "أسوار", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 6 },
  { id: "m07", name: "فنتولين", scientific: "سالبوتامول", category: "جهاز تنفسي", form: "بخاخ", strength: "100 مكغ", batch: "240115", prodDate: "2024-04-20", expiry: "2026-04-20", qty: 45, minQty: 15, buyPrice: 5500, sellPrice: 7500, company: "دجلة", stripsPerPiece: 1, piecesPerCarton: 24, createdAt: 7 },
  { id: "m08", name: "فيتامين D3", scientific: "كولي كالسيفيرول", category: "فيتامينات ومكملات", form: "كبسولات", strength: "5000 IU", batch: "240620", prodDate: "2025-05-08", expiry: "2027-05-08", qty: 12, minQty: 20, buyPrice: 4000, sellPrice: 6000, company: "الكندي", stripsPerPiece: 6, piecesPerCarton: 12, createdAt: 8 },
  { id: "m09", name: "نيكسيوم", scientific: "إيسوميبرازول", category: "جهاز هضمي", form: "أقراص", strength: "40 ملغ", batch: "230905", prodDate: "2023-10-30", expiry: "2025-10-30", qty: 85, minQty: 25, buyPrice: 6500, sellPrice: 8500, company: "أسوار", stripsPerPiece: 10, piecesPerCarton: 10, createdAt: 9 },
  { id: "m10", name: "زيرتك", scientific: "سيتريزين", category: "مضاد حساسية", form: "أقراص", strength: "10 ملغ", batch: "240512", prodDate: "2024-08-14", expiry: "2026-08-14", qty: 150, minQty: 30, buyPrice: 2200, sellPrice: 3250, company: "بايونير", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 10 },
  { id: "m11", name: "بيتادين", scientific: "بوفيدون أيودين", category: "مطهرات ومحاليل", form: "محلول", strength: "10%", batch: "250118", prodDate: "2026-01-10", expiry: "2028-02-01", qty: 70, minQty: 15, buyPrice: 2500, sellPrice: 3750, company: "دجلة", stripsPerPiece: 1, piecesPerCarton: 12, createdAt: 11 },
  { id: "m12", name: "سيفترياكسون", scientific: "سيفترياكسون صوديوم", category: "مضاد حيوي", form: "حقن", strength: "1 غم", batch: "240328", prodDate: "2024-05-05", expiry: "2026-05-05", qty: 95, minQty: 25, buyPrice: 3000, sellPrice: 4250, company: "بايونير", stripsPerPiece: 5, piecesPerCarton: 20, createdAt: 12 },
  { id: "m13", name: "بروفين", scientific: "آيبوبروفين", category: "مسكن ومضاد التهاب", form: "أقراص", strength: "400 ملغ", batch: "241002", prodDate: "2025-11-01", expiry: "2027-11-20", qty: 260, minQty: 50, buyPrice: 1000, sellPrice: 1750, company: "دجلة", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 13 },
  { id: "m14", name: "أماريل", scientific: "غليميبيرايد", category: "سكري", form: "أقراص", strength: "2 ملغ", batch: "240405", prodDate: "2024-10-05", expiry: "2026-10-05", qty: 40, minQty: 20, buyPrice: 3800, sellPrice: 5250, company: "الكندي", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 14 },
  { id: "m15", name: "كلاريتين", scientific: "لوراتادين", category: "مضاد حساسية", form: "شراب", strength: "5ملغ/5مل", batch: "240218", prodDate: "2024-03-28", expiry: "2026-03-28", qty: 28, minQty: 12, buyPrice: 2800, sellPrice: 4000, company: "أسوار", stripsPerPiece: 1, piecesPerCarton: 12, createdAt: 15 },
  { id: "m16", name: "فلاجيل", scientific: "ميترونيدازول", category: "مضاد حيوي", form: "أقراص", strength: "500 ملغ", batch: "240530", prodDate: "2025-04-10", expiry: "2027-04-10", qty: 130, minQty: 30, buyPrice: 1400, sellPrice: 2250, company: "بايونير", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 16 },
  { id: "m17", name: "لازكس", scientific: "فوروسيميد", category: "قلب وضغط", form: "أقراص", strength: "40 ملغ", batch: "240310", prodDate: "2024-09-18", expiry: "2026-09-18", qty: 22, minQty: 25, buyPrice: 1200, sellPrice: 2000, company: "دجلة", stripsPerPiece: 10, piecesPerCarton: 12, createdAt: 17 },
  { id: "m18", name: "بيتنوفيت", scientific: "بيتاميثازون فاليرات", category: "جلدية وموضعي", form: "مرهم موضعي", strength: "0.1%", batch: "240125", prodDate: "2024-04-02", expiry: "2026-04-02", qty: 55, minQty: 10, buyPrice: 2100, sellPrice: 3250, company: "أسوار", stripsPerPiece: 1, piecesPerCarton: 24, createdAt: 18 },
];

/* ---------- العملاء (مذاخر وصيدليات) ---------- */

export const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "صيدلية النور", kind: "pharmacy", phone: "0770 111 2233", city: "بغداد", createdAt: 1 },
  { id: "c2", name: "صيدلية الرشيد", kind: "pharmacy", phone: "0781 444 5566", city: "بغداد", createdAt: 2 },
  { id: "c3", name: "مذخر الشفاء", kind: "warehouse", phone: "0790 777 8899", city: "البصرة", createdAt: 3 },
  { id: "c4", name: "صيدلية الحكمة", kind: "pharmacy", phone: "0771 222 3344", city: "الموصل", createdAt: 4 },
  { id: "c5", name: "صيدلية بغداد", kind: "pharmacy", phone: "0782 555 6677", city: "بغداد", createdAt: 5 },
  { id: "c6", name: "مذخر دجلة", kind: "warehouse", phone: "0773 888 9900", city: "كركوك", createdAt: 6 },
  { id: "c7", name: "صيدلية الأمل", kind: "pharmacy", phone: "0783 121 3434", city: "النجف", createdAt: 7 },
];

/* ---------- الفواتير ---------- */

function inv(
  number: number,
  days: number,
  hour: number,
  customerId: string,
  customer: string,
  payment: Invoice["payment"],
  lines: [string, number][]
): Invoice {
  const items: InvoiceItem[] = lines.map(([id, qty]) => {
    const m = SEED_MEDICINES.find((x) => x.id === id)!;
    return {
      medicineId: m.id,
      name: m.name,
      strength: m.strength,
      unit: "piece",
      qty,
      strips: qty * m.stripsPerPiece,
      price: m.sellPrice,
      cost: m.buyPrice,
      discountPct: 0,
      total: qty * m.sellPrice,
    };
  });
  return {
    id: `seed-inv-${number}`,
    number,
    date: daysAgoISO(days, hour),
    customerId,
    customer,
    payment,
    approved: true,
    items,
    total: items.reduce((s, i) => s + i.total, 0),
  };
}

export const SEED_INVOICES: Invoice[] = [
  inv(1001, 6, 10, "c1", "صيدلية النور", "نقدي", [["m01", 30], ["m13", 20]]),
  { ...inv(1002, 6, 13, "c2", "صيدلية الرشيد", "آجل", [["m02", 15]]), settled: true },
  inv(1003, 5, 11, "c3", "مذخر الشفاء", "نقدي", [["m05", 25], ["m14", 10]]),
  inv(1004, 4, 16, "c4", "صيدلية الحكمة", "نقدي", [["m10", 20], ["m15", 8]]),
  inv(1005, 3, 12, "c5", "صيدلية بغداد", "آجل", [["m12", 18], ["m16", 24]]),
  inv(1006, 2, 10, "c6", "مذخر دجلة", "نقدي", [["m04", 16], ["m01", 40]]),
  inv(1007, 1, 14, "c7", "صيدلية الأمل", "نقدي", [["m08", 10], ["m11", 12]]),
  inv(1008, 0, 9, "c1", "صيدلية النور", "نقدي", [["m13", 30], ["m10", 15]]),
];

/* ---------- طلبيات الشراء ---------- */

function po(
  number: number,
  days: number,
  hour: number,
  company: string,
  received: boolean,
  lines: [string, number][]
): Purchase {
  const items: PurchaseItem[] = lines.map(([id, qty]) => {
    const m = SEED_MEDICINES.find((x) => x.id === id)!;
    return { medicineId: m.id, name: m.name, strength: m.strength, qty, cost: stripCostOf(m) };
  });
  return {
    id: `seed-po-${number}`,
    number,
    date: daysAgoISO(days, hour),
    company,
    items,
    total: items.reduce((s, i) => s + i.qty * i.cost, 0),
    received,
  };
}

export const SEED_PURCHASES: Purchase[] = [
  po(501, 9, 9, "بايونير", true, [["m01", 240], ["m16", 120]]),
  po(502, 7, 12, "دجلة", true, [["m13", 240], ["m11", 36]]),
  po(503, 5, 10, "الكندي", true, [["m05", 200], ["m08", 36]]),
  po(504, 2, 11, "أسوار", false, [["m06", 240], ["m15", 36]]),
  po(505, 0, 9, "بايونير", false, [["m03", 120], ["m12", 100]]),
];
