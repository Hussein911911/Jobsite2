# 📡 عقد الـ API (ما يحتاجه السيرفر البايثوني)

الواجهة جاهزة للتحدث مع السيرفر مباشرة — كل المطلوب:

```js
// assets/js/config.js
dataSource: 'api',
apiBaseUrl: '/api',
```

كل الاستجابات JSON بترميز UTF-8. الأخطاء تُرجع بالشكل:

```json
{ "error": "رسالة الخطأ" }
```

مع أكواد HTTP المناسبة: `400` إدخال خاطئ، `401` غير مصرّح، `404` غير موجود، `409` تكرار.

---

## 1) التهيئة

### `GET /api/bootstrap`
يُستدعى مرة واحدة عند تشغيل الصفحة.

```json
{
  "schema_version": 2,
  "tables": {
    "ranks":    [{ "id": 1, "name": "الرتبة الأولى — إدارة عليا", "short": "ر1", "level": 1, "css_class": "r1" }],
    "statuses": [{ "id": 1, "name": "جديد", "slug": "new", "css_class": "s-new", "sort_order": 1 }],
    "jobs": [], "applicants": [], "status_history": [], "users": [], "settings": []
  }
}
```

> للجداول الكبيرة يمكن إرجاع `jobs` و `applicants` فارغة — الواجهة تسحبها عند الحاجة من المسارات التالية.

---

## 2) الوظائف

### `GET /api/jobs`
| بارامتر | مثال | الوصف |
|---|---|---|
| `q` | `محاسب` | بحث في العنوان/القسم/المكان/الوصف |
| `rank_id` | `1` | فلترة بالرتبة |
| `active` | `1` | `1` المفتوحة فقط، `0` المغلقة فقط |
| `limit` / `offset` | `50` / `0` | ترقيم الصفحات — **`limit=0` تعني "بدون حد" (الكل)** |

```json
[{ "id": 1, "rank_id": 1, "title": "مدير فرع بغداد", "dept": "الإدارة العامة",
   "location": "بغداد", "employment_type": "دوام كامل",
   "salary_text": "2,500,000 – 3,000,000 د.ع", "salary_min": 2500000, "salary_max": 3000000,
   "deadline": "2026-10-05", "description": "...", "requirements": "...",
   "is_active": 1, "created_at": "...", "updated_at": "..." }]
```

```sql
SELECT * FROM jobs
WHERE (:rank_id IS NULL OR rank_id = :rank_id)
  AND (:q IS NULL OR title LIKE '%'||:q||'%' OR dept LIKE '%'||:q||'%' OR location LIKE '%'||:q||'%')
ORDER BY rank_id, id LIMIT :limit OFFSET :offset;
```

### `GET /api/jobs/:id` · `POST /api/jobs` · `PATCH /api/jobs/:id` · `DELETE /api/jobs/:id`
الإنشاء والتعديل يتحققان من الصلاحية (مدير فقط). الحذف يمسح السجلات المرتبطة (`ON DELETE CASCADE`).

---

## 3) المتقدمون

### `GET /api/applicants`
| بارامتر | الوصف |
|---|---|
| `q` | بحث بالاسم/الهاتف/البريد/الملاحظات |
| `job_id` · `status_id` · `rank_id` | فلترة |
| `order` | `newest` (افتراضي) أو `oldest` |
| `limit` / `offset` | ترقيم — `limit=0` ⇒ الكل |

يُفضّل إرجاع الصفوف مربوطة (join):

```json
[{ "id": 1, "job_id": 1, "full_name": "استبرق كريم", "phone": "07701234567",
   "email": "a@x.com", "notes": "خبرة 9 سنوات", "status_id": 2,
   "applied_at": "2026-09-08 10:20", "updated_at": "2026-09-08 11:00",
   "job": { "id": 1, "title": "مدير فرع بغداد", "rank_id": 1 },
   "status": { "id": 2, "name": "قيد المراجعة", "slug": "review", "css_class": "s-rev" } }]
```

```sql
SELECT a.*, j.title AS job_title, j.rank_id,
       s.name AS status_name, s.slug AS status_slug, s.css_class AS status_class
FROM applicants a
LEFT JOIN jobs j ON j.id = a.job_id
LEFT JOIN statuses s ON s.id = a.status_id
WHERE (:job_id IS NULL OR a.job_id = :job_id)
  AND (:status_id IS NULL OR a.status_id = :status_id)
  AND (:rank_id IS NULL OR j.rank_id = :rank_id)
  AND (:q IS NULL OR a.full_name LIKE '%'||:q||'%' OR a.phone LIKE '%'||:q||'%')
ORDER BY a.id DESC LIMIT :limit OFFSET :offset;
```

### `POST /api/applicants` — تقديم **عام** (بدون صلاحية)
```json
{ "job_id": 1, "full_name": "أحمد علي", "phone": "07709876543", "email": "a@b.com", "notes": "خبرة 5 سنوات" }
```

**واجبات السيرفر هنا:**
1. التحقق من المدخلات (اسم ≥ 3 أحرف، هاتف عراقي `07XXXXXXXXX`، بريد صحيح إن وُجد).
2. منع التكرار عبر القيد `UNIQUE(job_id, phone)` — وعند التكرار أرجع `409` مع `{"error":"DUPLICATE"}`.
3. تحديد حدّ للطلبات (Rate limit) مثل 5 طلبات/ساعة لكل IP.
4. إدراج صف في `status_history` بالحالة الأولى.

### `PATCH /api/applicants/:id/status` — يحتاج صلاحية
```json
{ "status_id": 4, "note": "مطابق للشروط" }
```
يسجّل السطر في `status_history` ويحدّث `updated_at`.

### `DELETE /api/applicants/:id` — يحتاج صلاحية

---

## 4) الإحصاءات والتصدير

### `GET /api/stats`
**عام** — يرجّع إحصاءات الوظائف للجميع، وإحصاءات السجلات (`applicants_*`, `by_status`)
للمدير فقط (غير المُصرّح له يستلمها `null`).

```json
{ "jobs_total": 10, "jobs_open": 9, "jobs_rank1": 1,
  "applicants_total": 5, "applicants_new": 1, "applicants_accepted": 1, "applicants_rejected": 1,
  "by_status": {"1":1,"2":1,"3":1,"4":1,"5":1},
  "by_rank":  {"1":1,"2":2,"3":2,"4":3,"5":2} }
```

### `GET /api/export.csv?status_id=&rank_id=&q=`
يُرجع ملف CSV بترميز UTF-8 **مع BOM** (`\ufeff`) حتى يفتح صحيحاً في Excel.

---

## 5) الدخول والحماية

### `POST /api/auth/login`
```json
{ "username": "admin", "password": "••••" }
```
يرجع كوكي جلسة (`HttpOnly; SameSite=Lax; Secure` في الإنتاج). **لا تُرجع كلمة المرور ولا الهاش.**

### `POST /api/auth/logout`

> ⚠️ كل بيانات لوحة السجلات يجب أن تكون محمية بصلاحية على السيرفر.
> تحقق الواجهة لا يُعتمد عليه للأمان، بل لتجربة استخدام أفضل فقط.

---

## 6) مسارات مساعدة

| المسار | الوصف |
|---|---|
| `GET /api/ranks` | الرتب الخمس (ثابتة) |
| `GET /api/statuses` | الحالات الخمس (ثابتة) |
| `GET /api/history?applicant_id=&limit=` | سجل التغييرات |
| `POST /api/admin/reset` | استعادة البيانات الابتدائية (مدير فقط) |

---

## 7) سيرفر مرجعي جاهز

موجود في `server/app.py` (FastAPI + SQLite) يطبّق هذا العقد كاملاً:

```bash
pip install -r server/requirements.txt
JOBSITE_ADMIN_PASSWORD="كلمة-قوية" uvicorn --app-dir server app:app --port 8010
```

طريقة النشر والبدائل (Flask/Django/VPS/استضافة): [`docs/DEPLOY.md`](DEPLOY.md)

## ✅ قائمة تحقّق للسيرفر

- [ ] تفعيل `PRAGMA foreign_keys = ON` في SQLite (أو استخدام Postgres)
- [ ] كلمات المرور بـ `bcrypt`/`argon2` مع ملح (salt)
- [ ] تقييد الطلبات (Rate limiting) على `/api/applicants` و `/api/auth/login`
- [ ] حماية CSRF إن استخدمت الكوكيز
- [ ] حجم أقصى للحقول (`notes` ≤ 500 حرف) ورفع الملفات إن أُضيف السيرة الذاتية
- [ ] نسخ احتياطي دوري لقاعدة البيانات
