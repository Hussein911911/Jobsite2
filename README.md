# مكتب الفيض الدوائي العلمي — نظام إدارة الأدوية

نظام متكامل للمخزون والمبيعات والمشتريات والتقارير، جاهز للنشر على سيرفر.

الواجهة React، والسيرفر FastAPI، والبيانات SQLite مع جلسات آمنة وكلمات مرور مُهشّة.

---

## التشغيل السريع

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt
npm install
npm run build
ALFAYD_ADMIN_PASSWORD='كلمة-قوية' ALFAYD_STAFF_PASSWORD='كلمة-قوية' npm start
```

افتح `http://localhost:8010`

للتطوير (واجهة حية + سيرفر):

```bash
pip install -r server/requirements.txt
npm install
npm run server          # المنفذ 8010
npm run dev             # المنفذ 5173 — يوجّه /api تلقائياً
```

بـ Docker:

```bash
docker compose up --build
```

---

## الدخول التجريبي

| المستخدم | كلمة المرور | الدور |
|---|---|---|
| `admin` | `1234` | مدير النظام |
| `staff` | `1234` | موظفة مبيعات |

**غيّر الكلمتين قبل تسليم الزبون** عبر متغيرات البيئة أو ملف `.env`.

---

## ماذا يفعل النظام

- لوحة تحكم: قيمة المخزون، تنبيهات، مبيعات الأسبوع
- المخزون: أصناف، باج، صلاحية، حد الطلب، تجهيز كارتون/قطعة/شريط
- المبيعات: فواتير للمذاخر والصيدليات، خصم، اعتماد وخصم من المخزون، طباعة
- المشتريات: طلبيات الشركات الأربع، الاستلام يحدّث الكمية وسعر الشراء
- التقارير: CSV، نسخة احتياطية JSON، استيراد
- تنبيهات: نافد / منخفض / قرب الانتهاء / منتهي

---

## هيكل المشروع

```
├── src/                 الواجهة (React + Vite + Tailwind)
├── server/app.py        السيرفر (FastAPI + جلسات)
├── db/schema.sql        مخطط SQLite
├── tests/test_api.py    فحوصات الـ API
├── docs/DEPLOY.md       النشر على السيرفر
└── docker-compose.yml
```

البيانات تُحفظ في `data/alfayd.db` (خارج Git).

---

## الاختبار

```bash
pip install -r server/requirements.txt
npm test
```

---

## التخصيص قبل التسليم

| المطلوب | أين |
|---|---|
| كلمات مرور المدير والموظف | `ALFAYD_ADMIN_PASSWORD` / `ALFAYD_STAFF_PASSWORD` |
| مسار قاعدة البيانات | `ALFAYD_DB` (الافتراضي `data/alfayd.db`) |
| كوكي آمن خلف HTTPS | `ALFAYD_COOKIE_SECURE=1` |
| اسم المكتب والألوان | `index.html` + `src/index.css` |

التفاصيل: [docs/DEPLOY.md](docs/DEPLOY.md) · [docs/API.md](docs/API.md)
