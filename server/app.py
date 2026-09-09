"""
نظام مكتب الفيض الدوائي العلمي — واجهة REST + جلسة آمنة + SQLite.
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
import time
from collections import defaultdict, deque
from contextlib import contextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from server import seed as seedmod

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "db" / "schema.sql"
DIST_DIR = ROOT / "dist"
DB_PATH = Path(os.environ.get("ALFAYD_DB", str(ROOT / "data" / "alfayd.db")))
COOKIE = "alfayd_session"
SESSION_DAYS = 7
COOKIE_SECURE = os.environ.get("ALFAYD_COOKIE_SECURE", "").strip() in {"1", "true", "yes"}
ADMIN_PASSWORD = os.environ.get("ALFAYD_ADMIN_PASSWORD", "1234")
STAFF_PASSWORD = os.environ.get("ALFAYD_STAFF_PASSWORD", "1234")
PBKDF2_ROUNDS = 120_000

app = FastAPI(title="مكتب الفيض الدوائي العلمي", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.e2b\.app|https://.*\.arena\.|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_login_hits: dict[str, deque] = defaultdict(deque)


# ---------------------------------------------------------------------------
# كلمات المرور والجلسات
# ---------------------------------------------------------------------------

def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ROUNDS)
    return f"pbkdf2${salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt, _hex = stored.split("$", 2)
    except ValueError:
        return False
    if algo != "pbkdf2":
        return False
    return secrets.compare_digest(hash_password(password, salt), stored)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_ok(ip: str, limit: int = 12, window: int = 300) -> bool:
    now = time.time()
    q = _login_hits[ip]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


# ---------------------------------------------------------------------------
# قاعدة البيانات
# ---------------------------------------------------------------------------

def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def db():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with db() as conn:
        conn.executescript(schema)
        n = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if n == 0:
            conn.execute(
                "INSERT INTO users(username, password_hash, name, role) VALUES (?,?,?,?)",
                ("admin", hash_password(ADMIN_PASSWORD), "أحمد الفيض", "مدير النظام"),
            )
            conn.execute(
                "INSERT INTO users(username, password_hash, name, role) VALUES (?,?,?,?)",
                ("staff", hash_password(STAFF_PASSWORD), "سارة كريم", "موظفة مبيعات"),
            )
        n_med = conn.execute("SELECT COUNT(*) FROM medicines").fetchone()[0]
        if n_med == 0:
            _write_snapshot(conn, seedmod.snapshot())


@app.on_event("startup")
def _startup() -> None:
    init_db()


# ---------------------------------------------------------------------------
# تحويل الصفوف ↔ JSON الواجهة
# ---------------------------------------------------------------------------

def _medicine_out(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"],
        "name": r["name"],
        "scientific": r["scientific"],
        "category": r["category"],
        "form": r["form"],
        "strength": r["strength"],
        "batch": r["batch"],
        "prodDate": r["prod_date"],
        "expiry": r["expiry"],
        "qty": r["qty"],
        "minQty": r["min_qty"],
        "buyPrice": r["buy_price"],
        "sellPrice": r["sell_price"],
        "company": r["company"],
        "stripsPerPiece": r["strips_per_piece"],
        "piecesPerCarton": r["pieces_per_carton"],
        "createdAt": r["created_at"],
    }


def _customer_out(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"],
        "name": r["name"],
        "kind": r["kind"],
        "phone": r["phone"],
        "city": r["city"],
        "createdAt": r["created_at"],
    }


def _invoice_item_out(r: sqlite3.Row) -> dict:
    item = {
        "medicineId": r["medicine_id"],
        "name": r["name"],
        "strength": r["strength"],
        "unit": r["unit"],
        "qty": r["qty"],
        "strips": r["strips"],
        "price": r["price"],
        "cost": r["cost"],
        "discountPct": r["discount_pct"],
        "total": r["total"],
    }
    if r["lines_json"]:
        try:
            item["lines"] = json.loads(r["lines_json"])
        except json.JSONDecodeError:
            pass
    return item


def _invoice_out(conn: sqlite3.Connection, r: sqlite3.Row) -> dict:
    items = conn.execute(
        "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id", (r["id"],)
    ).fetchall()
    out = {
        "id": r["id"],
        "number": r["number"],
        "date": r["date"],
        "customerId": r["customer_id"],
        "customer": r["customer"],
        "payment": r["payment"],
        "settled": bool(r["settled"]),
        "approved": bool(r["approved"]),
        "items": [_invoice_item_out(i) for i in items],
        "total": r["total"],
    }
    if r["prep_time"]:
        out["prepTime"] = r["prep_time"]
    if r["sale_time"]:
        out["saleTime"] = r["sale_time"]
    if r["list_date"]:
        out["listDate"] = r["list_date"]
    if r["prepared_by"]:
        out["preparedBy"] = r["prepared_by"]
    if r["notes"]:
        out["notes"] = r["notes"]
    return out


def _purchase_out(conn: sqlite3.Connection, r: sqlite3.Row) -> dict:
    items = conn.execute(
        "SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id", (r["id"],)
    ).fetchall()
    return {
        "id": r["id"],
        "number": r["number"],
        "date": r["date"],
        "company": r["company"],
        "total": r["total"],
        "received": bool(r["received"]),
        "items": [
            {
                "medicineId": i["medicine_id"],
                "name": i["name"],
                "strength": i["strength"],
                "qty": i["qty"],
                "cost": i["cost"],
            }
            for i in items
        ],
    }


def _read_snapshot(conn: sqlite3.Connection) -> dict:
    meds = [_medicine_out(r) for r in conn.execute("SELECT * FROM medicines ORDER BY created_at DESC, name")]
    custs = [_customer_out(r) for r in conn.execute("SELECT * FROM customers ORDER BY created_at DESC, name")]
    invoices = [_invoice_out(conn, r) for r in conn.execute("SELECT * FROM invoices ORDER BY number DESC")]
    purchases = [_purchase_out(conn, r) for r in conn.execute("SELECT * FROM purchases ORDER BY number DESC")]
    return {"medicines": meds, "customers": custs, "invoices": invoices, "purchases": purchases}


def _as_int(v, default=0) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _as_float(v, default=0.0) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _write_snapshot(conn: sqlite3.Connection, data: dict) -> None:
    medicines = data.get("medicines") or []
    customers = data.get("customers") or []
    invoices = data.get("invoices") or []
    purchases = data.get("purchases") or []
    if not isinstance(medicines, list) or not isinstance(customers, list):
        raise HTTPException(400, "صيغة البيانات غير صالحة")
    if not isinstance(invoices, list) or not isinstance(purchases, list):
        raise HTTPException(400, "صيغة البيانات غير صالحة")

    conn.execute("DELETE FROM invoice_items")
    conn.execute("DELETE FROM invoices")
    conn.execute("DELETE FROM purchase_items")
    conn.execute("DELETE FROM purchases")
    conn.execute("DELETE FROM medicines")
    conn.execute("DELETE FROM customers")

    for m in medicines:
        if not isinstance(m, dict) or not m.get("id") or not str(m.get("name", "")).strip():
            continue
        conn.execute(
            """INSERT INTO medicines(
                id, name, scientific, category, form, strength, batch, prod_date, expiry,
                qty, min_qty, buy_price, sell_price, company, strips_per_piece, pieces_per_carton, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                str(m["id"]),
                str(m.get("name", "")).strip(),
                str(m.get("scientific", "")),
                str(m.get("category", "")),
                str(m.get("form", "")),
                str(m.get("strength", "")),
                str(m.get("batch", "")),
                str(m.get("prodDate", "")),
                str(m.get("expiry", "")),
                max(0, _as_int(m.get("qty"))),
                max(0, _as_int(m.get("minQty"))),
                max(0, _as_int(m.get("buyPrice"))),
                max(0, _as_int(m.get("sellPrice"))),
                str(m.get("company", "")),
                max(1, _as_int(m.get("stripsPerPiece"), 1)),
                max(1, _as_int(m.get("piecesPerCarton"), 1)),
                _as_int(m.get("createdAt"), int(time.time() * 1000)),
            ),
        )

    for c in customers:
        if not isinstance(c, dict) or not c.get("id") or not str(c.get("name", "")).strip():
            continue
        kind = c.get("kind") if c.get("kind") in ("pharmacy", "warehouse") else "pharmacy"
        conn.execute(
            "INSERT INTO customers(id, name, kind, phone, city, created_at) VALUES (?,?,?,?,?,?)",
            (
                str(c["id"]),
                str(c.get("name", "")).strip(),
                kind,
                str(c.get("phone", "")),
                str(c.get("city", "") or "غير محددة"),
                _as_int(c.get("createdAt"), int(time.time() * 1000)),
            ),
        )

    for inv in invoices:
        if not isinstance(inv, dict) or not inv.get("id"):
            continue
        conn.execute(
            """INSERT INTO invoices(
                id, number, date, customer_id, customer, payment, settled, approved,
                prep_time, sale_time, list_date, prepared_by, notes, total
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                str(inv["id"]),
                _as_int(inv.get("number")),
                str(inv.get("date") or ""),
                str(inv.get("customerId") or ""),
                str(inv.get("customer") or ""),
                "آجل" if inv.get("payment") == "آجل" else "نقدي",
                1 if inv.get("settled") else 0,
                0 if inv.get("approved") is False else 1,
                inv.get("prepTime"),
                inv.get("saleTime"),
                inv.get("listDate"),
                inv.get("preparedBy"),
                inv.get("notes"),
                max(0, _as_int(inv.get("total"))),
            ),
        )
        for it in inv.get("items") or []:
            if not isinstance(it, dict):
                continue
            lines = it.get("lines")
            conn.execute(
                """INSERT INTO invoice_items(
                    invoice_id, medicine_id, name, strength, unit, qty, strips,
                    price, cost, discount_pct, total, lines_json
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    str(inv["id"]),
                    str(it.get("medicineId") or ""),
                    str(it.get("name") or ""),
                    str(it.get("strength") or ""),
                    "strip" if it.get("unit") == "strip" else "piece",
                    max(0, _as_int(it.get("qty"))),
                    max(0, _as_int(it.get("strips"))),
                    max(0, _as_int(it.get("price"))),
                    max(0, _as_int(it.get("cost"))),
                    max(0.0, min(100.0, _as_float(it.get("discountPct")))),
                    max(0, _as_int(it.get("total"))),
                    json.dumps(lines, ensure_ascii=False) if isinstance(lines, list) else None,
                ),
            )

    for p in purchases:
        if not isinstance(p, dict) or not p.get("id"):
            continue
        conn.execute(
            "INSERT INTO purchases(id, number, date, company, total, received) VALUES (?,?,?,?,?,?)",
            (
                str(p["id"]),
                _as_int(p.get("number")),
                str(p.get("date") or ""),
                str(p.get("company") or ""),
                max(0, _as_int(p.get("total"))),
                1 if p.get("received") else 0,
            ),
        )
        for it in p.get("items") or []:
            if not isinstance(it, dict):
                continue
            conn.execute(
                """INSERT INTO purchase_items(purchase_id, medicine_id, name, strength, qty, cost)
                   VALUES (?,?,?,?,?,?)""",
                (
                    str(p["id"]),
                    str(it.get("medicineId") or ""),
                    str(it.get("name") or ""),
                    str(it.get("strength") or ""),
                    max(0, _as_int(it.get("qty"))),
                    max(0, _as_int(it.get("cost"))),
                ),
            )


# ---------------------------------------------------------------------------
# المصادقة
# ---------------------------------------------------------------------------

def _user_public(row: sqlite3.Row) -> dict:
    return {"username": row["username"], "name": row["name"], "role": row["role"]}


def current_user(request: Request) -> dict:
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "يلزم تسجيل الدخول")
    now = int(time.time())
    with db() as conn:
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        row = conn.execute(
            """SELECT u.username, u.name, u.role
               FROM sessions s JOIN users u ON u.username = s.username
               WHERE s.token = ? AND s.expires_at >= ?""",
            (token, now),
        ).fetchone()
    if not row:
        raise HTTPException(401, "انتهت الجلسة — سجّل الدخول مجدداً")
    return _user_public(row)


def require_admin(user: dict) -> None:
    if user.get("role") != "مدير النظام":
        raise HTTPException(403, "هذه العملية للمدير فقط")


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=SESSION_DAYS * 24 * 3600,
        path="/",
    )


class LoginBody(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class SnapshotBody(BaseModel):
    medicines: list = Field(default_factory=list)
    invoices: list = Field(default_factory=list)
    purchases: list = Field(default_factory=list)
    customers: list = Field(default_factory=list)


# ---------------------------------------------------------------------------
# المسارات
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"ok": True, "name": "alfayd", "version": "2.0.0"}


@app.post("/api/auth/login")
def login(body: LoginBody, request: Request, response: Response):
    if not _rate_ok(_client_ip(request)):
        raise HTTPException(429, "محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة")
    username = body.username.strip().lower()
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not row or not verify_password(body.password, row["password_hash"]):
            raise HTTPException(401, "اسم المستخدم أو كلمة المرور غير صحيحة")
        token = secrets.token_urlsafe(32)
        expires = int(time.time()) + SESSION_DAYS * 24 * 3600
        conn.execute(
            "INSERT INTO sessions(token, username, expires_at) VALUES (?,?,?)",
            (token, row["username"], expires),
        )
    _set_session_cookie(response, token)
    return {"user": _user_public(row)}


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        with db() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@app.get("/api/auth/me")
def me(request: Request):
    return {"user": current_user(request)}


@app.get("/api/snapshot")
def get_snapshot(request: Request):
    current_user(request)
    with db() as conn:
        return _read_snapshot(conn)


@app.put("/api/snapshot")
def put_snapshot(body: SnapshotBody, request: Request):
    current_user(request)
    with db() as conn:
        _write_snapshot(conn, body.model_dump())
        return _read_snapshot(conn)


@app.post("/api/admin/restore")
def restore_seed(request: Request):
    require_admin(current_user(request))
    with db() as conn:
        _write_snapshot(conn, seedmod.snapshot())
        return _read_snapshot(conn)


@app.post("/api/admin/clear")
def clear_all(request: Request):
    require_admin(current_user(request))
    with db() as conn:
        _write_snapshot(conn, {"medicines": [], "invoices": [], "purchases": [], "customers": []})
        return _read_snapshot(conn)


# ---------------------------------------------------------------------------
# الواجهة الأمامية (بعد البناء)
# ---------------------------------------------------------------------------

if DIST_DIR.is_dir():
    assets = DIST_DIR / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(404, "Not Found")
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        index = DIST_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(404, "Not Found")
