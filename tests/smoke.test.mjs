/* ============================================================
   tests/smoke.test.mjs — اختبار دخان (Smoke Test) للنظام كامل
   التشغيل:  npm install  &&  npm test
   يفتح الموقع داخل DOM وهمي (jsdom) ويجرب كل المسارات.
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

/* ── سيرفر ملفات بسيط للتجربة ── */
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, '')) || 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) errors.push('JS: ' + e.message); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = await JSDOM.fromURL(BASE, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;
await new Promise(r => setTimeout(r, 600));

const $ = s => doc.querySelector(s);
const $$ = s => [...doc.querySelectorAll(s)];
const results = [];
const check = (name, cond, extra = '') => results.push(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* 1) القائمة والإحصاءات */
check('يعرض كل الوظائف', $$('.jcard').length === 10, `${$$('.jcard').length} بطاقة`);
check('إحصاء الوظائف المفتوحة (9)', $('#stJobs').textContent === '9');
check('إحصاء السجلات (5)', $('#stRecs').textContent === '5');
check('يُعلّم الوظيفة المغلقة', doc.body.innerHTML.includes('مغلقة'));
check('خالٍ من سكربتات التتبع الخارجية', !doc.documentElement.innerHTML.includes('cloudflare'));

/* 2) الفلاتر */
$('#rankF').value = '1'; fire($('#rankF'), 'change');
check('فلترة الرتبة الأولى → وظيفة واحدة', $$('.jcard').length === 1);
$('#rankF').value = ''; fire($('#rankF'), 'change');
$('#searchQ').value = 'محاسب'; fire($('#searchQ'), 'input');
check('البحث النصي يعمل', $$('.jcard').length === 1);
$('#searchQ').value = ''; fire($('#searchQ'), 'input');

/* 3) التفاصيل والتقديم */
click($$('.jcard')[0]);
await wait(80);
check('يفتح صفحة التفاصيل', $('#jobDetailBox').style.display === 'block' && !!$('#applyForm'));
check('المسار #/job/1', window.location.hash === '#/job/1');

fire($('#applyForm'), 'submit');
await wait(50);
check('يرفض الإرسال الناقص مع رسالة خطأ', !!$('.field-error.show') && window.JobsSite.store.db.records.length === 5);

$('#apName').value = 'أحمد علي';
$('#apPhone').value = '0770 987 6543';
$('#apEmail').value = 'ahmed@test.com';
fire($('#applyForm'), 'submit');
await wait(80);
check('يضيف السجل بعد إدخال صحيح', window.JobsSite.store.db.records.length === 6);
check('يحفظ في localStorage', JSON.parse(window.localStorage.getItem('rajd_jobs_data')).records.length === 6);

$('#apName').value = 'أحمد علي';
$('#apPhone').value = '07709876543';
fire($('#applyForm'), 'submit');
await wait(50);
check('يمنع التقديم المكرر بنفس الرقم', window.JobsSite.store.db.records.length === 6);

/* 4) الحماية من حقن الأكواد (XSS) */
window.JobsSite.store.db.records.push({
  id: 999, jobId: 1, name: '<img src=x onerror="window.__XSS=1">', phone: '07701112222',
  email: 'x@x.com', notes: '<script>window.__XSS2=1<\/script>', status: 'جديد', time: '2026-09-09 10:00'
});
window.location.hash = '#/records';
await wait(80);

/* 5) بوابة السجلات */
check('تظهر بوابة الرمز', $('#gateBox').style.display === 'block');
$('#pinInput').value = '0000'; click($('#btnGate'));
await wait(50);
check('يرفض الرمز الخطأ', $('#gateErr').classList.contains('show') && $('#recordsBox').style.display === 'none');
$('#pinInput').value = '1234'; click($('#btnGate'));
await wait(80);
check('يقبل الرمز الصحيح ويفتح اللوحة', $('#recordsBox').style.display === 'block');
check('يعرض السجلات في الجدول', $$('#recBody tr').length === 7);
check('لا تنفيذ للأكواد المحقونة', window.__XSS === undefined && window.__XSS2 === undefined);
check('يُرمّز HTML في أسماء المتقدمين', $('#recBody').innerHTML.includes('&lt;img'));

/* 6) إجراءات اللوحة */
const sel = $$('#recBody [data-action="status"]')[0];
sel.value = 'مقبول'; fire(sel, 'change');
await wait(50);
check('تغيير الحالة + تحديث الإحصاء', Number($('#rsOk').textContent) > 0);

window.confirm = () => true;
click($$('#recBody [data-action="delete"]')[0]);
await wait(50);
check('حذف السجل', window.JobsSite.store.db.records.length === 6);

/* 7) الرجوع */
window.location.hash = '#/jobs';
await wait(80);
check('الرجوع لقائمة الوظائف', $('#jobsGrid').style.display === 'grid' && $$('.jcard').length === 10);

/* 8) التعافي من بيانات تالفة */
const dom2 = await JSDOM.fromURL(BASE, {
  runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { w.localStorage.setItem('rajd_jobs_data', '{بيانات تالفة'); }
});
await wait(1500);
check('يتعافى من بيانات تالفة في التخزين', dom2.window.document.querySelectorAll('.jcard').length === 10);
dom2.window.close();

server.close();
window.close();

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('❌'));
console.log(`\nالنتيجة: ${results.length - failed.length}/${results.length} ناجح`);
if (errors.length) console.log('أخطاء JS:\n' + errors.join('\n'));
process.exit(failed.length || errors.length ? 1 : 0);
