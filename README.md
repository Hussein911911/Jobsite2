# 🏢 موقع وظائف شركة الرافدين — نظام الرتب والسجلات

موقع وظائف (HTML/CSS/JS) يعرض الوظائف الشاغرة مرتّبة حسب **الرتبة الوظيفية**،
ويستقبل طلبات التقديم ويحفظها في **سجلات** يتابعها المسؤول من لوحة خاصة.
البيانات كلها **قاعدة بيانات بجداول وعلاقات**، تعمل داخل المتصفح الآن،
وتتحوّل إلى سيرفر بايثون بتغيير سطر واحد.

---

## 📁 هيكل المشروع

```
Jobsite2/
├── index.html                    # الصفحة (الهيكل فقط)
├── assets/
│   ├── css/style.css             # كل التنسيقات (RTL، متغيرات، جوال)
│   └── js/
│       ├── config.js             # ⚙️ الإعدادات (مصدر البيانات، الرمز، التواصل)
│       ├── utils.js              # 🧰 ترميز HTML، توست، تواريخ، تحقق، CSV
│       ├── db/
│       │   ├── schema.js         # 🗂️ تعريف الجداول والأعمدة والعلاقات والفهارس
│       │   ├── seed.js           # 🌱 البيانات الابتدائية كصفوف جداول
│       │   ├── database.js       # 🧠 المحرّك + المستودعات + الترحيلات
│       │   └── adapters/
│       │       ├── local.js      # 💾 تخزين محلي (localStorage)
│       │       └── http.js       # 🌐 REST → سيرفر بايثون
│       ├── views/
│       │   ├── jobs.js           # 📋 القائمة + التفاصيل + نموذج التقديم
│       │   └── records.js        # 🗃️ بوابة الدخول + لوحة السجلات
│       └── app.js                # 🧭 الموجّه + الإحصاءات + التشغيل
├── db/
│   ├── schema.sql                # 📐 مخطط SQLite (نفس schema.js)
│   └── seed.sql                  # 📦 نفس البيانات الابتدائية كـ SQL
├── docs/
│   ├── DATABASE.md               # 🗄️ شرح النموذج والعلاقات والترحيلات
│   └── API.md                    # 📡 عقد الـ REST للسيرفر البايثوني
├── server/
│   ├── app.py                    # 🐍 سيرفر مرجعي (FastAPI + SQLite)
│   └── requirements.txt
├── tests/
│   ├── smoke.test.mjs            # ✅ 43 فحص (الوضع المحلي)
│   ├── api.test.mjs              # ✅ 15 فحص (سيرفر وهمي)
│   └── e2e.test.mjs              # ✅ 11 فحص (ضد سيرفر بايثون حقيقي)
└── package.json
```

---

## ▶️ التشغيل

```bash
npm start          # أو: python3 -m http.server 8000
# افتح http://localhost:8000
```

(يفتح `index.html` مباشرة بالنقر المزدوج أيضاً — بدون أي سيرفر.)

## 🧪 الاختبار

```bash
npm install
npm test           # 58 فحص: 43 محلي + 15 عبر سيرفر وهمي

# واختبار نهاية-بنهاية ضد سيرفر بايثون حقيقي:
pip install -r server/requirements.txt
JOBSITE_ADMIN_PASSWORD="كلمة-قوية" uvicorn --app-dir server app:app --port 8010
npm run test:e2e   # 11 فحص
```

---

## 🗄️ قاعدة البيانات

سبع جداول مرتبطة — نفس المخطط في المتصفح (`assets/js/db/schema.js`) وعلى السيرفر (`db/schema.sql`):

```
ranks ──┐                    ┌── statuses
        │ N:1                │
       jobs ──── 1:N ── applicants ── 1:N ── status_history
                                                  └── N:1 ── statuses
users (إدارة)          settings (إعدادات مفتاح/قيمة)
```

| الجدول | الوصف |
|---|---|
| `ranks` | الرتب الخمس (إدارة عليا → مبتدئ) |
| `statuses` | الحالات الخمس (جديد، قيد المراجعة، تمت المقابلة، مقبول، مرفوض) |
| `jobs` | الوظائف + `salary_min/max` + آخر موعد |
| `applicants` | المتقدمون، مع قيد **`UNIQUE(job_id, phone)`** يمنع التقديم المكرر |
| `status_history` | سجل تدقيق لكل تغيير حالة (من → إلى، الوقت، المستخدم) |
| `users` | مستخدمو لوحة الإدارة (كلمات مرور مُهشّة على السيرفر) |
| `settings` | إعدادات الموقع (JSON) |

التفاصيل الكاملة: **[docs/DATABASE.md](docs/DATABASE.md)**

---

## 🔌 الربط مع سيرفر بايثون (جاهز)

التبديل يتم من سطر واحد في `assets/js/config.js`:

```js
dataSource: 'api',      // بدل 'local'
apiBaseUrl: '/api',
```

أو بدون تعديل الملفات، من صفحة HTML:

```html
<script>window.JOBSITE_CONFIG = { dataSource: 'api', apiBaseUrl: '/api' }</script>
```

الواجهة تتوقع هذه المسارات (الشرح الكامل مع أمثلة JSON واستعلامات SQL في **[docs/API.md](docs/API.md)**):

| المسار | الوصف |
|---|---|
| `GET /api/bootstrap` | التهيئة (الرتب، الحالات، الإعدادات) |
| `GET /api/jobs` · `GET /api/jobs/:id` | الوظائف + فلترة `?q=&rank_id=&active=` |
| `POST /api/applicants` | تقديم **عام** (يتحقق السيرفر ويمنع التكرار بـ `409`) |
| `GET /api/applicants` · `PATCH /api/applicants/:id` · `DELETE /api/applicants/:id` | لوحة السجلات (بصلاحية) |
| `GET /api/stats` · `GET /api/export.csv` | الإحصاءات والتصدير |
| `POST /api/auth/login` · `POST /api/auth/logout` | الدخول (جلسة/كوكي) |
| `GET /api/ranks` · `GET /api/statuses` · `GET /api/history` | مسارات مساعدة |

قاعدة بيانات SQLite جاهزة:

```bash
npm run db:init     # ينشئ jobsite.db من db/schema.sql + db/seed.sql
```

**وسيرفر مرجعي جاهز للتجربة** في `server/app.py` (FastAPI) يطبّق العقد كاملاً
مع هشّ لكلمات المرور وجلسات وتقييد طلبات — شغّال ومُختبَر ✅
([server/README.md](server/README.md) · [docs/DEPLOY.md](docs/DEPLOY.md) للنشر).

> ✅ `tests/api.test.mjs` يشغّل سيرفر وهمي بنفس العقد ويتأكد أن الواجهة تتحدث معه صح،
> يعني تقدر تبدأ بايثون (Flask/FastAPI/Django) وتطابق المسارات وتجرب مباشرة.

---

## 🚀 النشر

قائمة التحقّق الكاملة قبل النشر (كلمات مرور، HTTPS، Postgres، نسخ احتياطي، nginx،
استضافة Render/Railway/VPS، وربطه بموقعك الحالي Flask/Django):
**[docs/DEPLOY.md](docs/DEPLOY.md)**

## ⚙️ التخصيص

| المطلوب | الملف |
|---|---|
| اسم الشركة والتواصل ورمز الدخول | `assets/js/config.js` |
| الوظائف والسجلات الابتدائية | `assets/js/db/seed.js` (و `db/seed.sql` للسيرفر) |
| إضافة عمود/جدول | `assets/js/db/schema.js` + `db/schema.sql` + ترحيل في `database.js` |
| الألوان والخطوط | متغيرات `:root` في `assets/css/style.css` |

---

## ✨ مميزات النظام

- 5 رتب وظيفية بألوان وشارات، والقائمة مرتّبة تلقائياً من الأعلى رتبة
- بحث + فلترة بالرتبة/الحالة/الوظيفة، وترقيم صفحات جاهز
- تحقق من الهاتف العراقي والبريد، ومنع التقديم المكرر
- إغلاق التقديم تلقائياً بعد آخر موعد + عدّاد الأيام المتبقية
- لوحة سجلات: إحصاءات، تغيير حالة، حذف، تصدير CSV، **سجل تدقيق كامل**
- ترميز كل المدخلات (حماية من XSS) وتعافي تلقائي من البيانات التالفة
- مسارات قابلة للمشاركة: `#/jobs` · `#/job/3` · `#/records`

---

## 🔐 ملاحظة أمنية

رمز الدخول الحالي داخل كود الصفحة (تجريبي فقط). عند الربط مع السيرفر لازم:

1. كلمة مرور مُهشّة (bcrypt/argon2) + جلسة على السيرفر.
2. التحقق من المدخلات على السيرفر (تحقق المتصفح للراحة فقط).
3. تقييد الطلبات (Rate limit) على التقديم والدخول.
4. حماية CSRF إن استخدمت الكوكيز.
