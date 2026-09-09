# نشر نظام مكتب الفيض الدوائي العلمي

## قبل التسليم — إلزامي

1. غيّر كلمات المرور:
   ```bash
   export ALFAYD_ADMIN_PASSWORD='كلمة-طويلة-عشوائية'
   export ALFAYD_STAFF_PASSWORD='كلمة-أخرى-قوية'
   ```
2. لا ترفع ملف `data/alfayd.db` ولا `.env` إلى Git.
3. فعّل HTTPS ثم:
   ```bash
   export ALFAYD_COOKIE_SECURE=1
   ```
4. خذ نسخة احتياطية من صفحة التقارير (JSON) بعد إدخال بيانات الزبون الحقيقية.

إذا شغّلت النظام مرة بكلمة `1234` ثم غيّرت المتغير، الحسابات القديمة **لا تُستبدل تلقائياً**. احذف `data/alfayd.db` (أو أعد إنشاء المستخدمين يدوياً) حتى تُنشأ الحسابات بالكلمات الجديدة.

---

## طريقة 1: Docker (الأسهل على VPS)

```bash
git clone <رابط-المستودع> alfayd && cd alfayd
cp .env.example .env
# عدّل .env
docker compose up -d --build
```

النظام على المنفذ `8010`. اربطه بـ nginx:

```nginx
server {
    listen 80;
    server_name pharmacy.example.com;
    location / {
        proxy_pass http://127.0.0.1:8010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

ثم Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pharmacy.example.com
```

---

## طريقة 2: بدون Docker

المتطلبات: Python 3.10+ و Node 20+.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
npm install
npm run build
```

systemd — `/etc/systemd/system/alfayd.service`:

```ini
[Unit]
Description=Alfayd Pharma
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/alfayd
Environment=ALFAYD_ADMIN_PASSWORD=change-me
Environment=ALFAYD_STAFF_PASSWORD=change-me
Environment=ALFAYD_DB=/var/lib/alfayd/alfayd.db
Environment=ALFAYD_COOKIE_SECURE=1
ExecStart=/opt/alfayd/.venv/bin/uvicorn server.app:app --host 127.0.0.1 --port 8010
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now alfayd
```

---

## النسخ الاحتياطي

- من الواجهة: التقارير → نسخة احتياطية (JSON).
- من السيرفر: انسخ `data/alfayd.db` يومياً.

```bash
install -d /var/backups/alfayd
cp data/alfayd.db /var/backups/alfayd/alfayd-$(date +%F).db
```

---

## استضافة جاهزة

يعمل على أي VPS (Ubuntu) أو Render/Railway:

- أمر التشغيل: `npm run build && uvicorn server.app:app --host 0.0.0.0 --port $PORT`
- قرص دائم لمسار `ALFAYD_DB`
