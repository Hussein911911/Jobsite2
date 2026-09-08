# 🗄️ قاعدة البيانات

الواجهة تستخدم **نفس مخطط السيرفر**: 7 جداول مرتبطة ببعضها، مُعرّفة مرة واحدة في
`assets/js/db/schema.js` (للمتصفح) ومرة في `db/schema.sql` (للسيرفر).

```
                 ┌───────────┐
                 │   ranks   │  5 رتب ثابتة
                 └─────┬─────┘
                       │ 1
                       │
                       ▼ N
┌────────────┐   ┌───────────┐
│ applicants │N──┤   jobs    │  الوظائف
└─────┬──────┘1  └───────────┘
      │ 1
      │                 ┌───────────┐
      └──── N ──────────┤ statuses  │  5 حالات ثابتة
        status_history  └───────────┘
                              │ 1
                              ▼ N
                        (from/to status)

users    ← مستخدمو لوحة الإدارة (سيرفر فقط)
settings ← إعدادات الموقع (مفتاح/قيمة JSON)
```

## الجداول

| الجدول | الوصف | أهم الأعمدة |
|---|---|---|
| `ranks` | الرتب الوظيفية (ثابت) | `id, name, short, level, css_class` |
| `statuses` | حالات السجل (ثابت) | `id, name, slug, css_class, sort_order` |
| `jobs` | الوظائف | `rank_id, title, dept, location, employment_type, salary_min/max, deadline, is_active` |
| `applicants` | المتقدمون | `job_id, full_name, phone, email, notes, status_id, applied_at` |
| `status_history` | تدقيق الحالات | `applicant_id, from_status_id, to_status_id, changed_at, changed_by, note` |
| `users` | مستخدمو الإدارة | `username, password_hash, role, last_login_at` |
| `settings` | إعدادات الموقع | `key, value(JSON)` |

## العلاقات والقيود

| العلاقة | النوع | القيد |
|---|---|---|
| `jobs.rank_id → ranks.id` | N:1 | افتراضي 5 |
| `applicants.job_id → jobs.id` | N:1 | `ON DELETE CASCADE` |
| `applicants.status_id → statuses.id` | N:1 | افتراضي 1 (جديد) |
| `status_history.applicant_id → applicants.id` | N:1 | `ON DELETE CASCADE` |
| **`UNIQUE (applicants.job_id, applicants.phone)`** | — | **يمنع التقديم المكرر** |

الفهارس: `jobs(rank_id, is_active, deadline)` · `applicants(job_id, status_id, applied_at)` ·
`status_history(applicant_id, changed_at)`

## الترحيلات (Migrations)

الإصدار الحالي: **schema_version = 2**.

- `1 → 2`: يحول بيانات النسخة القديمة (ملف HTML واحد) إلى الجداول الجديدة:
  `records → applicants` (مع تحويل اسم الحالة العربي إلى `status_id`) و `jobs.loc → jobs.location` ... إلخ.
- الاستيراد يتم تلقائياً عند أول تشغيل إذا وُجد المفتاح القديم `rajd_jobs_data` في المتصفح.
- لإضافة ترحيل جديد: زِد `schema.version` في `schema.js` وأضف `MIGRATIONS[الإصدار_الحالي].up()` في `database.js`.

## طبقات الوصول (Adapters)

```
الواجهات (views)  →  المستودعات db.jobs / db.applicants  →  Adapter
                                                            ├─ local.js  (localStorage)
                                                            └─ http.js   (سيرفر بايثون)
```

التبديل يتم من سطر واحد في `assets/js/config.js`:

```js
dataSource: 'local',   // أو 'api'
apiBaseUrl: '/api',
```

كل عمليات المستودعات **غير متزامنة (Promise)**، فلا يحتاج أي كود في الواجهات للتغيير عند الانتقال للسيرفر.

## أمثلة استخدام من الكونسول

```js
await db.jobs.query({ rank_id: 1, active: true })     // وظائف الرتبة الأولى المفتوحة
await db.applicants.query({ status_id: 4, limit: 0 }) // كل المقبولين
await db.applicants.create({ job_id: 5, full_name: 'سارة', phone: '07701112233' })
await db.applicants.setStatus(3, 4, 'admin', 'اجتاز المقابلة')
await db.history.forApplicant(3)                      // سجل التغييرات
await db.stats()                                      // الإحصاءات
db.meta()                                             // {source, remote, schema_version, ...}
```

## تشغيل قاعدة SQLite محلياً

```bash
python3 -c "
import sqlite3, io
con = sqlite3.connect('jobsite.db')
con.executescript(open('db/schema.sql', encoding='utf-8').read())
con.executescript(open('db/seed.sql',  encoding='utf-8').read())
print(con.execute('select count(*) from jobs').fetchone())
"
```
