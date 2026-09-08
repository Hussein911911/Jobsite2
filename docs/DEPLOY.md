# 🚀 دليل النشر — من "شغال عندي" إلى "منشور للناس"

## 0) قبل النشر: قائمة تحقّق إلزامية

- [ ] **احذف الملف القديم** `موقع-وظائف-بالرتب-والسجلات (2).html` من `main` (جاهز في الـ PR).
- [ ] **غيّر كلمة مرور المدير**: `JOBSITE_ADMIN_PASSWORD` (الافتراضي `admin123` ⚠️).
- [ ] **سر الجلسة**: `JOBSITE_SECRET` قيمة عشوائية طويلة من متغير بيئة (لا تُكتب في الكود).
- [ ] **فعّل HTTPS** واجعل الكوكي `secure` + `httponly` + `samesite=lax`.
- [ ] **قاعدة بيانات إنتاج**: Postgres للإنتاج (ملاحظات التحويل في `db/schema.sql`) أو SQLite مع نسخ احتياطي يومي.
- [ ] **لا ترفع** `jobsite.db` ولا `.env` ولا `.venv` إلى Git (موجودة في `.gitignore`).
- [ ] **تقييد الطلبات** على `/api/applicants` و `/api/auth/login` (موجود في السيرفر المرجعي، راجعه خلف البروكسي: استخدم `X-Forwarded-For`).
- [ ] **جرّب التقديم بنفسك** بعد النشر: قدّم طلب، دخل اللوحة، غيّر حالة، صدّر CSV.

---

## 1) ثلاث طرق لربطه بموقعك البايثوني

### الطريقة أ — انسخ الـ endpoints إلى مشروعك (الأنسب)
الواجهة لا تهتم بلغة السيرفر، فقط بالمسارات في [`docs/API.md`](API.md).
انسخ المنطق من `server/app.py` إلى Flask/Django/FastAPI حقك:

| Flask | Django | الوظيفة |
|---|---|---|
| `@app.get("/api/jobs")` | `path("api/jobs", views.jobs)` | قائمة الوظائف |
| `@app.post("/api/applicants")` | `path("api/applicants", views.apply)` | تقديم عام |
| `@app.patch("/api/applicants/<int:id>")` | `path("api/applicants/<int:id>", views.update)` | تغيير الحالة |
| `session["user"]` | `request.user.is_authenticated` | الصلاحية |

مثال Flask لخدمة الواجهة + المسارات:

```python
from flask import Flask, send_from_directory, jsonify, request, session
app = Flask(__name__, static_folder="../", static_url_path="")

@app.get("/")
def index():
    return send_from_directory("../", "index.html")

@app.get("/api/jobs")
def jobs():
    # نفس SQL الموجود في server/app.py
    return jsonify([...])
```

### الطريقة ب — الواجهة من بايثون والـ API منفصل
قدّم `index.html` + `assets/` من موقعك، ووجّه `/api` إلى السيرفر:

```nginx
location /api/ { proxy_pass http://127.0.0.1:8010; }
```
ثم في `assets/js/config.js`: `apiBaseUrl: '/api'`.

### الطريقة ج — فصل كامل (دومينين)
الواجهة على Netlify/Vercel/CDN والـ API على `api.example.com` — يحتاج **CORS** على السيرفر:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["https://example.com"],
                   allow_credentials=True, methods=["*"], headers=["*"])
```
وفي الواجهة: `apiBaseUrl: 'https://api.example.com/api'` + `fetch(..., credentials:'include')`.

---

## 2) النشر على VPS (الأكثر تحكّماً)

```bash
# على السيرفر
python3 -m venv .venv && .venv/bin/pip install -r server/requirements.txt
export JOBSITE_SECRET="$(openssl rand -hex 32)"
export JOBSITE_ADMIN_PASSWORD="كلمة-مرور-قوية"
export JOBSITE_DB=/var/www/jobsite/jobsite.db
```

`/etc/systemd/system/jobsite.service`:

```ini
[Unit]
Description=Jobsite API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/jobsite
Environment="JOBSITE_SECRET=...المتغيرات..."
ExecStart=/var/www/jobsite/.venv/bin/uvicorn --app-dir server app:app --host 127.0.0.1 --port 8010 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now jobsite
```

nginx:

```nginx
server {
  listen 443 ssl;
  server_name example.com;
  ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  root /var/www/jobsite;          # الواجهة (index.html + assets)
  location / { try_files $uri $uri/ /index.html; }

  location /api/ {
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

نسخ احتياطي يومي (cron):

```bash
0 3 * * * sqlite3 /var/www/jobsite/jobsite.db ".backup /backups/jobsite-$(date +\%F).db"
```

---

## 3) استضافة سهلة (بدون إدارة سيرفر)

| المنصة | الملاحظات |
|---|---|
| **Render / Railway / Fly.io** | يدعمون ASGI مباشرة: أمر التشغيل `uvicorn --app-dir server app:app --host 0.0.0.0 --port $PORT` |
| **PythonAnywhere** | WSGI فقط → استخدم Flask بدل FastAPI، أو شغّل عبر `uvicorn` بمهمة مجدولة (غير مثالي) |
| **Vercel / Netlify** | للواجهة الثابتة فقط؛ الـ API يحتاج مكان آخر |
| **Shared hosting (cPanel)** | غالباً WSGI/Flask فقط + SQLite |

> إن كان موقعك الحالي **Flask/Django (WSGI)** خُذ المنطق من `server/app.py` وحطّه في views حقك —
> كل الاستعلامات SQL جاهزة وما فيها شيء خاص بـ FastAPI.

---

## 4) بعد النشر

- [ ] راقب اللوجات: `journalctl -u jobsite -f`
- [ ] فحص صحة تلقائي: `curl https://example.com/health`
- [ ] غيّر بيانات التواصل في `assets/js/config.js` (الهاتف، البريد، العنوان)
- [ ] راجع بيانات الوظائف في `db/seed.sql` قبل أول تشغيل على الإنتاج
- [ ] أضف صفحة/رابط سياسة الخصوصية إن جمعت بيانات شخصية
- [ ] اختبر على الجوال (التصميم RTL متجاوب)

---

## 5) أخطاء شائعة قبل النشر

| العَرَض | السبب | الحل |
|---|---|---|
| `database is locked` | اتصال SQLite غير مُغلق أو WAL غير مفعّل | أغلق الاتصال دائماً (`closing`) + `PRAGMA journal_mode=WAL` |
| `401` على `/api/stats` للزوار | الإحصاءات الإدارية محمية (سلوك صحيح) | الزائر يرى `—`، والمدير يرى الأرقام |
| الواجهة فاضية مع السيرفر | `limit=0` بالـ API يرجّع صفر صفوف | السيرفر يتعامل مع `limit<=0` كـ "بدون حد" |
| الكوكي ما ينحفظ | نطاق مختلف أو `Secure` بدون HTTPS | نفس النطاق + HTTPS في الإنتاج |
| التكرار ما ينمنع | القيد `UNIQUE(job_id, phone)` غير مطبّق | تأكد من تنفيذه في قاعدة بياناتك |
