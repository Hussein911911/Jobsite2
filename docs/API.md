# عقد REST — نظام الفيض

الأصل: نفس المضيف. الكوكي `alfayd_session` (HttpOnly).

| المسار | الوصف |
|---|---|
| `GET /api/health` | نبض بدون صلاحية |
| `POST /api/auth/login` | `{ username, password }` → `{ user }` + كوكي |
| `POST /api/auth/logout` | إنهاء الجلسة |
| `GET /api/auth/me` | المستخدم الحالي |
| `GET /api/snapshot` | المخزون + الفواتير + المشتريات + الزبائن |
| `PUT /api/snapshot` | حفظ الحالة كاملة (معاملة واحدة) |
| `POST /api/admin/restore` | استعادة التجريبية (مدير) |
| `POST /api/admin/clear` | مسح البيانات (مدير) |

الحقول بنفس أسماء الواجهة (`sellPrice`, `stripsPerPiece`, `customerId`...).

مثال دخول:

```bash
curl -c jar -X POST http://localhost:8010/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"1234"}'

curl -b jar http://localhost:8010/api/snapshot
```
