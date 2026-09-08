"""
╔══════════════════════════════════════════════════════════════╗
║  سيرفر مرجعي لموقع وظائف شركة الرافدين (FastAPI + SQLite)     ║
║  يطبّق العقد الموجود في docs/API.md ويقدّم ملفات الواجهة.      ║
║                                                              ║
║  التشغيل:                                                    ║
║     pip install -r requirements.txt                          ║
║     uvicorn app:app --reload --host 0.0.0.0 --port 8000      ║
║                                                              ║
║  ملاحظة: هذا سيرفر مرجعي/نموذجي — طوّعه على موقعك البايثوني.  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from contextlib import closing
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

# ═══════════════ الإعدادات ═══════════════
ROOT = Path(__file__).resolve().parent.parent          # جذر المشروع
DB_PATH = Path(os.getenv("JOBSITE_DB", ROOT / "jobsite.db"))
SECRET_KEY = os.getenv("JOBSITE_SECRET", "change-me-in-production-" + secrets.token_hex(8))
ADMIN_PASSWORD = os.getenv("JOBSITE_ADMIN_PASSWORD", "admin123")   # ⚠️ غيّره
RATE_LIMIT = int(os.getenv("JOBSITE_RATE_LIMIT", "5"))             # طلبات تقديم
RATE_WINDOW = int(os.getenv("JOBSITE_RATE_WINDOW", "600"))         # خلال ثانية

PHONE_RE = re.compile(r"^0[3579]\d{9}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")
MAX_NOTES = 500

app = FastAPI(title="موقع وظائف شركة الرافدين", version="2.0.0")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY, session_cookie="jobsite_session")


# ═══════════════ قاعدة البيانات ═══════════════
def connect() -> sqlite3.Connection:
    """اتصال جديد — يُغلق دائماً عبر contextlib.closing لتجنّب قفل قاعدة البيانات."""
    con = sqlite3.connect(DB_PATH, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    con.execute("PRAGMA journal_mode = WAL")
    return con


def init_db() -> None:
    """ينشئ الجداول ويعبّئ البيانات الابتدائية عند أول تشغيل."""
    fresh = not DB_PATH.exists()
    with closing(connect()) as con:
        con.executescript((ROOT / "db" / "schema.sql").read_text(encoding="utf-8"))
        con.executescript((ROOT / "db" / "seed.sql").read_text(encoding="utf-8"))
        if fresh or not con.execute("SELECT 1 FROM users WHERE username='admin'").fetchone():
            con.execute(
                "INSERT OR REPLACE INTO users (id, username, password_hash, full_name, role, created_at)"
                " VALUES (1, 'admin', ?, 'مدير النظام', 'admin', ?)",
                (hash_password(ADMIN_PASSWORD), now()),
            )
        con.commit()


def parse_setting(raw: str):
    """قيمة الإعداد مخزّنة كنص JSON — وإن لم تكن كذلك نُرجعها كما هي."""
    try:
        return json.loads(raw)
    except Exception:
        return raw


def now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


# ═══════════════ كلمات المرور ═══════════════
def hash_password(pw: str, salt: bytes | None = None) -> str:
    """PBKDF2-SHA256 من مكتبة بايثون القياسية (استبدلها بـ bcrypt/argon2 إن أردت)."""
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 200_000)
    return f"pbkdf2$200000${salt.hex()}${dk.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        algo, rounds, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


# ═══════════════ الصلاحيات وتقييد الطلبات ═══════════════
def require_admin(request: Request) -> None:
    if not request.session.get("user"):
        raise HTTPException(401, "غير مصرّح — سجّل الدخول")


_hits: dict[str, list[float]] = {}


def rate_limit(request: Request, key: str, limit: int = RATE_LIMIT, window: int = RATE_WINDOW) -> None:
    ip = request.client.host if request.client else "unknown"
    k = f"{key}:{ip}"
    t = time.time()
    _hits[k] = [x for x in _hits.get(k, []) if t - x < window]
    if len(_hits[k]) >= limit:
        raise HTTPException(429, "طلبات كثيرة — حاول بعد قليل")
    _hits[k].append(t)


# ═══════════════ التحقق من المدخلات ═══════════════
def normalize_phone(p: str) -> str:
    p = re.sub(r"[\s\-()]", "", p or "")
    if p.startswith("+964"):
        p = "0" + p[4:]
    elif p.startswith("00964"):
        p = "0" + p[5:]
    return p


def validate_applicant(data: dict) -> dict:
    full_name = (data.get("full_name") or "").strip()
    phone = normalize_phone(data.get("phone") or "")
    email = (data.get("email") or "").strip()
    notes = (data.get("notes") or "").strip()[:MAX_NOTES]
    job_id = data.get("job_id")

    if len(full_name) < 3:
        raise HTTPException(400, "الاسم مطلوب (٣ أحرف على الأقل)")
    if not PHONE_RE.match(phone):
        raise HTTPException(400, "رقم هاتف عراقي صحيح: 07xxxxxxxxxx")
    if email and not EMAIL_RE.match(email):
        raise HTTPException(400, "البريد الإلكتروني غير صحيح")
    if not job_id:
        raise HTTPException(400, "الوظيفة مطلوبة")
    return {"job_id": int(job_id), "full_name": full_name, "phone": phone, "email": email, "notes": notes}


# ═══════════════ التهيئة ═══════════════
@app.on_event("startup")
def on_startup() -> None:
    init_db()


# ═══════════════ 1) التهيئة ═══════════════
@app.get("/api/bootstrap")
def bootstrap():
    """يرسل الجداول الثابتة للواجهة عند التشغيل."""
    with closing(connect()) as con:
        tables = {
            "ranks": [dict(r) for r in con.execute("SELECT * FROM ranks ORDER BY level")],
            "statuses": [dict(r) for r in con.execute("SELECT * FROM statuses ORDER BY sort_order")],
            "settings": [{"key": r["key"], "value": parse_setting(r["value"])} for r in con.execute("SELECT * FROM settings")],
        }
    return {"schema_version": 2, "tables": tables}


# ═══════════════ 2) الوظائف ═══════════════
@app.get("/api/jobs")
def list_jobs(
    q: str = "", rank_id: int | None = None, active: int | None = None,
    limit: int = 50, offset: int = 0,
):
    sql = """SELECT j.*, r.short AS rank_short, r.name AS rank_name,
                    (SELECT COUNT(*) FROM applicants a WHERE a.job_id = j.id) AS applicants_count
             FROM jobs j LEFT JOIN ranks r ON r.id = j.rank_id
             WHERE 1=1"""
    args: list = []
    if rank_id:
        sql += " AND j.rank_id = ?"
        args.append(rank_id)
    if active is not None:
        today = datetime.now().strftime("%Y-%m-%d")
        if active == 1:
            sql += " AND j.is_active = 1 AND (j.deadline IS NULL OR j.deadline = '' OR j.deadline >= ?)"
        else:
            sql += " AND (j.is_active = 0 OR (j.deadline IS NOT NULL AND j.deadline != '' AND j.deadline < ?))"
        args.append(today)
    if q:
        sql += " AND (j.title LIKE ? OR j.dept LIKE ? OR j.location LIKE ? OR j.description LIKE ?)"
        args += [f"%{q}%"] * 4
    sql += " ORDER BY j.rank_id, j.id"
    if limit and limit > 0:                      # limit=0 أو أقل ⇒ بدون حد (الكل)
        sql += " LIMIT ? OFFSET ?"
        args += [limit, offset]

    with closing(connect()) as con:
        return [dict(r) for r in con.execute(sql, args)]


@app.get("/api/jobs/{job_id}")
def get_job(job_id: int):
    with closing(connect()) as con:
        row = con.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if not row:
        raise HTTPException(404, "الوظيفة غير موجودة")
    return dict(row)


# ═══════════════ 3) المتقدمون ═══════════════
@app.get("/api/applicants")
def list_applicants(
    request: Request,
    q: str = "", job_id: int | None = None, status_id: int | None = None,
    rank_id: int | None = None, order: str = "newest",
    limit: int = 50, offset: int = 0,
):
    require_admin(request)
    sql = """SELECT a.*, j.id AS job_id, j.title AS job_title, j.rank_id,
                    r.short AS rank_short, r.name AS rank_name,
                    s.id AS status_id, s.name AS status_name, s.slug AS status_slug, s.css_class AS status_class
             FROM applicants a
             LEFT JOIN jobs j  ON j.id = a.job_id
             LEFT JOIN ranks r ON r.id = j.rank_id
             LEFT JOIN statuses s ON s.id = a.status_id
             WHERE 1=1"""
    args: list = []
    if job_id:
        sql += " AND a.job_id = ?"
        args.append(job_id)
    if status_id:
        sql += " AND a.status_id = ?"
        args.append(status_id)
    if rank_id:
        sql += " AND j.rank_id = ?"
        args.append(rank_id)
    if q:
        sql += " AND (a.full_name LIKE ? OR a.phone LIKE ? OR a.email LIKE ? OR a.notes LIKE ?)"
        args += [f"%{q}%"] * 4
    sql += " ORDER BY a.id " + ("ASC" if order == "oldest" else "DESC")
    if limit and limit > 0:
        sql += " LIMIT ? OFFSET ?"
        args += [limit, offset]

    with closing(connect()) as con:
        rows = [dict(r) for r in con.execute(sql, args)]

    # نفس شكل الربط (join) المتوقع في docs/API.md
    out = []
    for r in rows:
        out.append({
            **r,
            "job": {"id": r.get("job_id"), "title": r.get("job_title"), "rank_id": r.get("rank_id")} if r.get("job_id") else None,
            "status": {"id": r.get("status_id"), "name": r.get("status_name"),
                       "slug": r.get("status_slug"), "css_class": r.get("status_class")},
        })
    return out


@app.post("/api/applicants", status_code=201)
def create_applicant(request: Request, data: dict):
    """تقديم عام — بدون صلاحية، مع تحقق وتقييد طلبات."""
    rate_limit(request, "apply")
    d = validate_applicant(data)

    with closing(connect()) as con:
        job = con.execute("SELECT * FROM jobs WHERE id = ?", (d["job_id"],)).fetchone()
        if not job:
            raise HTTPException(400, "الوظيفة غير موجودة")
        if job["is_active"] != 1:
            raise HTTPException(400, "التقديم على هذه الوظيفة مغلق")
        if job["deadline"] and job["deadline"] < datetime.now().strftime("%Y-%m-%d"):
            raise HTTPException(400, "انتهى موعد التقديم")

        try:
            cur = con.execute(
                "INSERT INTO applicants (job_id, full_name, phone, email, notes, status_id, applied_at, updated_at)"
                " VALUES (?,?,?,?,?,1,?,?)",
                (d["job_id"], d["full_name"], d["phone"], d["email"], d["notes"], now(), now()),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(409, "DUPLICATE")

        applicant_id = cur.lastrowid
        con.execute(
            "INSERT INTO status_history (applicant_id, from_status_id, to_status_id, changed_at, changed_by, note)"
            " VALUES (?,NULL,1,?,'public','تقديم جديد')",
            (applicant_id, now()),
        )
        con.commit()
        row = con.execute("SELECT * FROM applicants WHERE id = ?", (applicant_id,)).fetchone()
    return dict(row)


@app.patch("/api/applicants/{applicant_id}")
def update_applicant(request: Request, applicant_id: int, data: dict):
    """تغيير الحالة (الواجهة تستدعي هذا المسار)."""
    require_admin(request)
    status_id = data.get("status_id")
    note = (data.get("note") or "")[:MAX_NOTES]
    if not status_id:
        raise HTTPException(400, "status_id مطلوب")

    with closing(connect()) as con:
        row = con.execute("SELECT * FROM applicants WHERE id = ?", (applicant_id,)).fetchone()
        if not row:
            raise HTTPException(404, "السجل غير موجود")
        if not con.execute("SELECT 1 FROM statuses WHERE id = ?", (status_id,)).fetchone():
            raise HTTPException(400, "حالة غير معروفة")

        con.execute("UPDATE applicants SET status_id = ?, updated_at = ? WHERE id = ?", (status_id, now(), applicant_id))
        con.execute(
            "INSERT INTO status_history (applicant_id, from_status_id, to_status_id, changed_at, changed_by, note)"
            " VALUES (?,?,?,?,?,?)",
            (applicant_id, row["status_id"], status_id, now(),
             request.session.get("user", "admin"), note),
        )
        con.commit()
        new = con.execute("SELECT * FROM applicants WHERE id = ?", (applicant_id,)).fetchone()
    return dict(new)


@app.patch("/api/applicants/{applicant_id}/status")
def update_status_alias(request: Request, applicant_id: int, data: dict):
    """مسار بديل بنفس الوظيفة (مذكور في docs/API.md)."""
    return update_applicant(request, applicant_id, data)


@app.delete("/api/applicants/{applicant_id}", status_code=204)
def delete_applicant(request: Request, applicant_id: int):
    require_admin(request)
    with closing(connect()) as con:
        res = con.execute("DELETE FROM applicants WHERE id = ?", (applicant_id,))
        con.commit()
    if res.rowcount == 0:
        raise HTTPException(404, "السجل غير موجود")
    return Response(status_code=204)


# ═══════════════ 4) الإحصاءات والتصدير ═══════════════
@app.get("/api/stats")
def stats(request: Request):
    """إحصاءات عامة للزوّار (الوظائف) + إحصاءات السجلات للمدير فقط."""
    is_admin = bool(request.session.get("user"))
    today = datetime.now().strftime("%Y-%m-%d")
    with closing(connect()) as con:
        jobs_open = con.execute(
            "SELECT COUNT(*) c FROM jobs WHERE is_active=1 AND (deadline IS NULL OR deadline='' OR deadline>=?)", (today,)
        ).fetchone()["c"]
        row = lambda s: con.execute("SELECT COUNT(*) c FROM applicants WHERE status_id=?", (s,)).fetchone()["c"]
        data = {
            "jobs_total": con.execute("SELECT COUNT(*) c FROM jobs").fetchone()["c"],
            "jobs_open": jobs_open,
            "jobs_rank1": con.execute(
                "SELECT COUNT(*) c FROM jobs WHERE rank_id=1 AND is_active=1"
            ).fetchone()["c"],
            "by_rank": {r["rank_id"]: r["c"] for r in con.execute(
                "SELECT rank_id, COUNT(*) c FROM jobs GROUP BY rank_id")},
            # ↓ إحصاءات السجلات: للمدير فقط
            "applicants_total": None, "applicants_new": None,
            "applicants_accepted": None, "applicants_rejected": None, "by_status": {},
        }
        if is_admin:
            data.update({
                "applicants_total": con.execute("SELECT COUNT(*) c FROM applicants").fetchone()["c"],
                "applicants_new": row(1),
                "applicants_accepted": row(4),
                "applicants_rejected": row(5),
                "by_status": {r["status_id"]: r["c"] for r in con.execute(
                    "SELECT status_id, COUNT(*) c FROM applicants GROUP BY status_id")},
            })
        return data


@app.get("/api/export.csv")
def export_csv(request: Request, status_id: int | None = None, rank_id: int | None = None, q: str = ""):
    """CSV بترميز UTF-8 مع BOM حتى يفتح صحيحاً في Excel."""
    import csv
    import io

    rows = list_applicants(request, q=q, status_id=status_id, rank_id=rank_id, limit=100000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["#", "الاسم", "الهاتف", "البريد", "الوظيفة", "الرتبة", "الحالة", "التاريخ", "ملاحظات"])
    for r in rows:
        w.writerow([r["id"], r["full_name"], r["phone"], r["email"],
                    (r["job"] or {}).get("title", ""), r.get("rank_short", ""),
                    r["status"]["name"] if r.get("status") else "", r["applied_at"], r["notes"]])
    return Response(content="\ufeff" + buf.getvalue(),
                    media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="applicants.csv"'}) 


# ═══════════════ 5) الدخول ═══════════════
@app.post("/api/auth/login")
def login(request: Request, data: dict):
    rate_limit(request, "login", limit=10, window=600)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    with closing(connect()) as con:
        user = con.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "بيانات الدخول غير صحيحة")
    with closing(connect()) as con:
        con.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now(), user["id"]))
        con.commit()
    request.session["user"] = user["username"]
    request.session["role"] = user["role"]
    return {"ok": True, "user": {"username": user["username"], "role": user["role"]}}


@app.post("/api/auth/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}


@app.get("/api/me")
def me(request: Request):
    return {"user": request.session.get("user"), "role": request.session.get("role")}


# ═══════════════ 6) مسارات مساعدة ═══════════════
@app.get("/api/ranks")
def ranks():
    with closing(connect()) as con:
        return [dict(r) for r in con.execute("SELECT * FROM ranks ORDER BY level")]


@app.get("/api/statuses")
def statuses():
    with closing(connect()) as con:
        return [dict(r) for r in con.execute("SELECT * FROM statuses ORDER BY sort_order")]


@app.get("/api/history")
def history(request: Request, applicant_id: int | None = None, limit: int = 20):
    require_admin(request)
    sql = """SELECT h.*, a.full_name AS applicant_name,
                    sf.name AS from_status_name, st.name AS to_status_name
             FROM status_history h
             LEFT JOIN applicants a ON a.id = h.applicant_id
             LEFT JOIN statuses sf ON sf.id = h.from_status_id
             LEFT JOIN statuses st ON st.id = h.to_status_id"""
    args: list = []
    if applicant_id:
        sql += " WHERE h.applicant_id = ?"
        args.append(applicant_id)
    sql += " ORDER BY h.id DESC LIMIT ?"
    args.append(limit)
    with closing(connect()) as con:
        return [dict(r) for r in con.execute(sql, args)]


@app.post("/api/admin/reset")
def reset(request: Request):
    """استعادة البيانات الابتدائية (مدير فقط)."""
    require_admin(request)
    with closing(connect()) as con:
        con.executescript("DELETE FROM status_history; DELETE FROM applicants; DELETE FROM jobs;"
                          "DELETE FROM ranks; DELETE FROM statuses; DELETE FROM settings;")
        con.executescript((ROOT / "db" / "schema.sql").read_text(encoding="utf-8"))
        con.executescript((ROOT / "db" / "seed.sql").read_text(encoding="utf-8"))
        con.commit()
    return {"ok": True, "message": "تمت استعادة البيانات الابتدائية"}


# ═══════════════ الواجهة (ملفات ثابتة) ═══════════════
app.mount("/assets", StaticFiles(directory=ROOT / "assets"), name="assets")


@app.get("/")
def index():
    return FileResponse(ROOT / "index.html")


@app.get("/health")
def health():
    return {"ok": True, "db": str(DB_PATH), "time": now()}
