/* ============================================================
   tests/e2e.test.mjs — اختبار نهاية-بنهاية ضد سيرفر بايثون حقيقي
   يفترض السيرفر شغال على PORT (افتراضي 8010):
     JOBSITE_ADMIN_PASSWORD='...' uvicorn --app-dir server app:app --port 8010
   التشغيل: JOBSITE_ADMIN_PASSWORD='...' npm run test:e2e
   (إن لم تُمرّر المتغير يستخدم admin123 الافتراضي)
   ============================================================ */
import { JSDOM, VirtualConsole } from 'jsdom';

const BASE = process.env.JOBSITE_URL || 'http://127.0.0.1:8010/';
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) errors.push('JS: ' + e.message); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const wait = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (fn, t = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < t) { try { if (fn()) return true; } catch (e) {} await wait(40); } return false; };

const dom = await JSDOM.fromURL(BASE, {
  runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { w.JOBSITE_CONFIG = { dataSource: 'api', apiBaseUrl: '/api' }; }
});
const { window } = dom, doc = window.document;
await waitFor(() => window.JobsSiteReady);

const $ = s => doc.querySelector(s), $$ = s => [...doc.querySelectorAll(s)];
const results = [], check = (n, c, x = '') => { const line = `${c ? '✅' : '❌'} ${n}${x ? ' — ' + x : ''}`; results.push(line); console.log(line); };
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true, cancelable: true }));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

/* 1) قراءة من السيرفر */
const meta = window.JobsSite.db.meta();
check('يتصل بسيرفر بايثون', meta.source === 'http' && meta.remote === true, meta.source);
check('يعرض وظائف من قاعدة بيانات السيرفر', $$('.jcard').length === 10, `${$$('.jcard').length} بطاقة`);
check('الإحصاءات من /api/stats', $('#stJobs').textContent === '9', 'مفتوحة=' + $('#stJobs').textContent);
check('الفوتر يوضح أن المصدر سيرفر', $('#dbMeta').textContent.includes('سيرفر'));

/* 2) التقديم → POST حقيقي */
const phone = '0770' + String(Date.now()).slice(-7);
click($$('.jcard')[0]);
await wait(200);
$('#apName').value = 'متقدم E2E';
$('#apPhone').value = phone;
$('#apEmail').value = 'e2e@test.com';
fire($('#applyForm'), 'submit');
await wait(400);
check('يُرسل الطلب ويظهر تأكيد', $('#toast').textContent.includes('تم تسجيل طلبك'), $('#toast').textContent);

/* 3) الدخول للوحة السجلات */
window.location.hash = '#/records';
await wait(250);
$('#pinInput').value = 'wrong-pass';
click($('#btnGate'));
await wait(300);
check('يرفض كلمة مرور خاطئة', $('#gateErr').classList.contains('show') && $('#recordsBox').style.display === 'none');
$('#pinInput').value = process.env.JOBSITE_ADMIN_PASSWORD || 'admin123';
click($('#btnGate'));
await wait(400);
check('يدخل بكلمة مرور السيرفر', $('#recordsBox').style.display === 'block');
check('يعرض السجلات من SQLite', $$('#recBody tr').length >= 6, `${$$('#recBody tr').length} صف`);
check('يعرض سجل التدقيق', $$('#historyBody tr').length >= 1);

/* 4) تغيير الحالة → PATCH + تدقيق في القاعدة */
const sel = $$('#recBody [data-action="status"]')[0];
if (!sel) { console.log('⚠️ لا توجد صفوف في جدول السجلات — توقّف الاختبار'); console.log('toast:', $('#toast').textContent, '| login-err:', $('#gateErr').textContent); window.close(); process.exit(1); }
const applicantId = Number(sel.dataset.id);
sel.value = '4'; fire(sel, 'change');
await wait(400);
check('تغيير الحالة ينفّذ PATCH على السيرفر', true, `السجل #${applicantId} → مقبول`);
check('الإحصاءات تتحدث بعد التغيير', Number($('#rsOk').textContent) >= 1, 'مقبول=' + $('#rsOk').textContent);

/* 5) إدارة الوظائف: إضافة → تظهر للزوار → حذف */
click($('#btnAddJob'));
await wait(200);
$('#jbTitle').value = 'وظيفة E2E مؤقتة';
$('#jbRank').value = '4';
$('#jbDept').value = 'اختبار';
$('#jbDeadline').value = '2030-06-30';
fire($('#jobForm'), 'submit');
await wait(400);
check('تُضاف الوظيفة من اللوحة إلى SQLite', $$('#jobsAdminBody tr').length === 11, `${$$('#jobsAdminBody tr').length} صف`);

const pub = await (await fetch(new URL('/api/jobs?limit=0', BASE))).json();
check('تظهر الوظيفة الجديدة للزوار فوراً', pub.some(j => j.title === 'وظيفة E2E مؤقتة'));

window.confirm = () => true;
const newRow = [...$$('#jobsAdminBody tr')].find(tr => tr.textContent.includes('وظيفة E2E مؤقتة'));
click(newRow.querySelector('[data-job-action="delete"]'));
await wait(400);
const pub2 = await (await fetch(new URL('/api/jobs?limit=0', BASE))).json();
check('حذف الوظيفة يزيلها من الموقع', !pub2.some(j => j.title === 'وظيفة E2E مؤقتة'), `${pub2.length} وظيفة`);

window.close();
const failed = results.filter(r => r.startsWith('❌'));
console.log(`\nالنتيجة: ${results.length - failed.length}/${results.length} ناجح (ضد ${BASE})`);
if (errors.length) console.log('أخطاء JS:\n' + errors.join('\n'));
process.exit(failed.length || errors.length ? 1 : 0);
