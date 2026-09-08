/* ============================================================
   db/schema.sql — مخطط قاعدة البيانات (SQLite)
   يعمل كما هو على SQLite، وللانتقال إلى PostgreSQL شوف الملاحظات
   في نهاية الملف (قسم "ملاحظات Postgres").
   نفس هذا المخطط معرّف في assets/js/db/schema.js
   ============================================================ */

PRAGMA foreign_keys = ON;

/* ── الرتب الوظيفية ── */
CREATE TABLE IF NOT EXISTS ranks (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,          -- الرتبة الأولى — إدارة عليا
  short      TEXT    NOT NULL,          -- ر1 .. ر5
  level      INTEGER NOT NULL DEFAULT 5,-- 1 = الأعلى
  css_class  TEXT    NOT NULL DEFAULT 'r5'
);

/* ── حالات السجل ── */
CREATE TABLE IF NOT EXISTS statuses (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,          -- جديد، قيد المراجعة ...
  slug        TEXT    NOT NULL UNIQUE,   -- new, review, interview, accepted, rejected
  css_class   TEXT    NOT NULL DEFAULT 's-new',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

/* ── الوظائف ── */
CREATE TABLE IF NOT EXISTS jobs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  rank_id          INTEGER NOT NULL DEFAULT 5 REFERENCES ranks(id),
  title            TEXT    NOT NULL,
  dept             TEXT    NOT NULL DEFAULT '—',
  location         TEXT    NOT NULL DEFAULT '—',
  employment_type  TEXT    NOT NULL DEFAULT '—',
  salary_text      TEXT    NOT NULL DEFAULT '',
  salary_min       INTEGER,
  salary_max       INTEGER,
  deadline         TEXT,                 -- YYYY-MM-DD
  description      TEXT    NOT NULL DEFAULT '',
  requirements     TEXT    NOT NULL DEFAULT '',
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_rank      ON jobs(rank_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active    ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline  ON jobs(deadline);

/* ── المتقدمون (السجلات) ── */
CREATE TABLE IF NOT EXISTS applicants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  full_name   TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  email       TEXT    NOT NULL DEFAULT '',
  notes       TEXT    NOT NULL DEFAULT '',
  status_id   INTEGER NOT NULL DEFAULT 1 REFERENCES statuses(id),
  applied_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  /* ← قيد يمنع التقديم المكرر بنفس الرقم على نفس الوظيفة */
  UNIQUE (job_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_app_job     ON applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_app_status  ON applicants(status_id);
CREATE INDEX IF NOT EXISTS idx_app_date    ON applicants(applied_at);

/* ── سجل تغيّر الحالات (تدقيق) ── */
CREATE TABLE IF NOT EXISTS status_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id   INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  from_status_id INTEGER REFERENCES statuses(id),
  to_status_id   INTEGER NOT NULL REFERENCES statuses(id),
  changed_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  changed_by     TEXT    NOT NULL DEFAULT 'admin',
  note           TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_hist_applicant ON status_history(applicant_id);
CREATE INDEX IF NOT EXISTS idx_hist_date      ON status_history(changed_at);

/* ── مستخدمو لوحة الإدارة ── */
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,      -- bcrypt / argon2 (لا تُحفظ كلمات مرور صريحة أبداً)
  full_name      TEXT    NOT NULL DEFAULT '',
  role           TEXT    NOT NULL DEFAULT 'admin',
  created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  last_login_at  TEXT
);

/* ── إعدادات الموقع ── */
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT                            -- JSON كنص
);

/* ── عرض جاهز للسجلات مع بيانات الوظيفة والرتبة والحالة ── */
CREATE VIEW IF NOT EXISTS v_applicants AS
SELECT a.id, a.full_name, a.phone, a.email, a.notes, a.applied_at, a.updated_at,
       a.job_id, j.title AS job_title, j.rank_id,
       r.short AS rank_short, r.name AS rank_name,
       a.status_id, s.name AS status_name, s.slug AS status_slug, s.css_class AS status_class
FROM applicants a
LEFT JOIN jobs     j ON j.id = a.job_id
LEFT JOIN ranks    r ON r.id = j.rank_id
LEFT JOIN statuses s ON s.id = a.status_id;

/* ── ملاحظات Postgres ──
   - AUTOINCREMENT → GENERATED ALWAYS AS IDENTITY (أو SERIAL)
   - INTEGER ... CHECK (is_active IN (0,1)) → BOOLEAN NOT NULL DEFAULT TRUE
   - datetime('now','localtime') → now()
   - TEXT → TEXT, و UNIQUE (job_id, phone) تبقى نفسها
   - الفهارس نفسها تعمل بدون تغيير
*/
