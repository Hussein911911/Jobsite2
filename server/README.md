# 🐍 السيرفر المرجعي (FastAPI + SQLite)

سيرفر **نموذجي/مرجعي** يطبّق العقد الموجود في [`../docs/API.md`](../docs/API.md).
استخدمه كما هو للتجربة، أو انسخ منطقه إلى موقعك البايثوني (Flask/Django/FastAPI).

## التشغيل

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt          # من جذر المشروع: pip install -r server/requirements.txt

export JOBSITE_SECRET="سر-عشوائي-طويل"
export JOBSITE_ADMIN_PASSWORD="كلمة-مرور-قوية"      # الافتراضي admin123 ⚠️

.venv/bin/uvicorn --app-dir server app:app --reload --host 0.0.0.0 --port 8010
```

ثم افتح **http://localhost:8010** — السيرفر يقدّم الواجهة وملفاتها بنفسه.

> أول تشغيل ينشئ `jobsite.db` من `db/schema.sql` + `db/seed.sql` ويضبط مستخدم `admin`.

## متغيرات البيئة

| المتغير | الافتراضي | الوصف |
|---|---|---|
| `JOBSITE_DB` | `jobsite.db` | مسار قاعدة SQLite |
| `JOBSITE_SECRET` | عشوائي مؤقت | مفتاح توقيع الجلسة ⚠️ غيّره |
| `JOBSITE_ADMIN_PASSWORD` | `admin123` | كلمة مرور المدير ⚠️ غيّرها |
| `JOBSITE_RATE_LIMIT` | `5` | عدد طلبات التقديم المسموحة |
| `JOBSITE_RATE_WINDOW` | `600` | نافذة التقييد بالثواني |

## المسارات

| المسار | الصلاحية | الوصف |
|---|---|---|
| `GET /api/bootstrap` | عام | الرتب والحالات والإعدادات |
| `GET /api/jobs` · `GET /api/jobs/{id}` | عام | الوظائف (`?q=&rank_id=&active=&limit=&offset=`) |
| `POST /api/applicants` | عام | تقديم جديد (تحقق + منع تكرار 409 + تقييد طلبات) |
| `GET /api/applicants` | مدير | السجلات مربوطة بالوظيفة والحالة |
| `PATCH /api/applicants/{id}` | مدير | تغيير الحالة + سطر في `status_history` |
| `DELETE /api/applicants/{id}` | مدير | حذف السجل |
| `GET /api/stats` | عام/مدير | الوظائف للجميع + السجلات للمدير فقط |
| `GET /api/export.csv` | مدير | CSV بترميز UTF-8 مع BOM |
| `POST /api/auth/login` · `/logout` | — | جلسة بالكوكي |
| `GET /api/ranks` · `/api/statuses` · `/api/history` | — | مسارات مساعدة |
| `POST /api/admin/reset` | مدير | استعادة البيانات الابتدائية |
| `GET /health` | عام | فحص صحة |

## الحماية المطبّقة هنا

- كلمة المرور مُهشّة بـ **PBKDF2-SHA256** مع ملح (استبدلها بـ bcrypt/argon2 إن أردت)
- جلسة بالكوكي عبر `SessionMiddleware`
- **تقييد طلبات** على التقديم والدخول
- تحقق من المدخلات على السيرفر (الاسم، الهاتف العراقي، البريد، طول الملاحظات)
- منع التكرار عبر قيد `UNIQUE(job_id, phone)` في القاعدة
- الإحصاءات الحسّاسة للمدير فقط

## اختباره مع الواجهة

```bash
# من جذر المشروع، والسيرفر شغال على 8010
npm run test:e2e
```

هذا الاختبار يفتح الصفحة داخل متصفح وهمي ويتأكد أن كل شيء يمر عبر السيرفر فعلياً.
