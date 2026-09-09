import type { Customer, Invoice, Medicine, Purchase, User } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Snapshot {
  medicines: Medicine[];
  invoices: Invoice[];
  purchases: Purchase[];
  customers: Customer[];
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join("، ");
    }
  } catch {
    /* تجاهل */
  }
  if (res.status === 401) return "انتهت الجلسة — سجّل الدخول مجدداً";
  if (res.status === 403) return "ليست لديك صلاحية لهذه العملية";
  if (res.status === 429) return "محاولات كثيرة — انتظر قليلاً";
  return "حدث خطأ في الاتصال بالسيرفر";
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<{ ok: boolean }>("/health"),
  login: (username: string, password: string) =>
    req<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => req<{ user: User }>("/auth/me"),
  snapshot: () => req<Snapshot>("/snapshot"),
  saveSnapshot: (data: Snapshot) =>
    req<Snapshot>("/snapshot", { method: "PUT", body: JSON.stringify(data) }),
  restoreSeed: () => req<Snapshot>("/admin/restore", { method: "POST" }),
  clearAll: () => req<Snapshot>("/admin/clear", { method: "POST" }),
};
