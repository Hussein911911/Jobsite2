/* ============================================================
   tests/smoke.test.mjs — اختبار شامل: قاعدة البيانات + الواجهات
   التشغيل:  npm install  &&  npm test
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/+/, '')) || 'index.html';
  const file = path.join(ROOT, rel);
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
const wait = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (fn, timeout = 2000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (fn()) return true; } catch (e) { /* تجاهل */ }
    await new Promise(r => setTimeout(r, 30));
  }
  return false;
};

await waitFor(() => window.JobsSiteReady, 3000);

const $ = s => doc.querySelector(s);
const $$ = s => [...doc.querySelectorAll(s)];
const results = [];
const check = (name, cond, extra = '') => results.push(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const db = () => window.JobsSite.db;

/* ══════ 1) قاعدة البيانات ══════ */
const meta = db().meta();
check('تشغيل قاعدة البيانات (محلية)', meta.source === 'local' && meta.remote === false, meta.source);
check('إصدار المخطط = 2', meta.schema_version === 2, 'v' + meta.schema_version);
check('كل الجداول معبّأة', Object.keys(db().tables).length === 7, Object.keys(db().tables).join(','));
check('جدول الرتب فيه 5 رتب', db().tables.ranks.length === 5);
check('جدول الحالات فيه 5 حالات', db().tables.statuses.length === 5);
check('جدول الوظائف فيه 10 وظائف', db().tables.jobs.length === 10);
check('جدول المتقدمين فيه 5 سجلات', db().tables.applicants.length === 5);
check('سجل التغييرات فيه 5 أحداث', db().tables.status_history.length === 5);
check('تطبيق المخطط على الصفوف (أنواع/قيم افتراضية)',
  typeof db().tables.jobs[0].rank_id === 'number' && db().tables.jobs[0].is_active === 1);

/* القيد الفريد (job_id + phone) */
let dupError = null;
try {
  await db().applicants.create({ job_id: 1, full_name: 'تكرار', phone: '07701234567' });
} catch (e) { dupError = e.message; }
check('قيد فريد يمنع التقديم المكرر', dupError === 'DUPLICATE', String(dupError));

const created = await db().applicants.create({ job_id: 1, full_name: '<img src=x onerror="window.__XSS=1">', phone: '0770 987 6543', notes: 'سجل اختبار' });
check('إدراج سجل جديد ينجح', created.id > 5 && created.status_id === 1);
check('تسجيل الحدث في status_history تلقائياً',
  db().tables.status_history.some(h => h.applicant_id === created.id && h.to_status_id === 1));

const before = db().tables.applicants.find(a => a.id === 2).status_id;
await db().applicants.setStatus(2, 4, 'tester', 'اختبار');
check('تغيير الحالة + تدقيق', db().tables.applicants.find(a => a.id === 2).status_id === 4 &&
  db().tables.status_history.some(h => h.applicant_id === 2 && h.from_status_id === before && h.to_status_id === 4));

const stats = await db().stats();
check('الإحصاءات صحيحة', stats.jobs_open === 9 && stats.applicants_total === 6 && stats.applicants_new === 1,
  `مفتوحة=${stats.jobs_open} سجلات=${stats.applicants_total} جديدة=${stats.applicants_new}`);

const joined = await db().applicants.query({ limit: 0 });
check('الربط (join) مع الوظيفة والحالة', !!joined[0].job && !!joined[0].status && !!joined[0].job.rank);

/* ══════ 2) واجهة الوظائف ══════ */
check('يعرض كل الوظائف', $$('.jcard').length === 10, `${$$('.jcard').length} بطاقة`);
check('إحصاء الوظائف المفتوحة (9)', $('#stJobs').textContent === '9');
check('يُعلّم الوظيفة المغلقة', doc.body.innerHTML.includes('مغلقة'));
check('خالٍ من سكربتات التتبع الخارجية', !doc.documentElement.innerHTML.includes('cloudflare'));
check('يعرض مصدر قاعدة البيانات في الفوتر', $('#dbMeta').textContent.includes('محلية'));

$('#rankF').value = '1'; fire($('#rankF'), 'change');
await wait(60);
check('فلترة بالرتبة', $$('.jcard').length === 1);
$('#rankF').value = ''; fire($('#rankF'), 'change');
await wait(60);
$('#searchQ').value = 'محاسب'; fire($('#searchQ'), 'input');
await wait(60);
check('البحث النصي', $$('.jcard').length === 1);
$('#searchQ').value = ''; fire($('#searchQ'), 'input');
await wait(60);

/* ══════ 3) التفاصيل والتقديم ══════ */
click($$('.jcard')[0]);
await wait(120);
check('يفتح صفحة التفاصيل', $('#jobDetailBox').style.display === 'block' && !!$('#applyForm'));
check('المسار #/job/1', window.location.hash === '#/job/1');
check('يعرض عدد المتقدمين للوظيفة', $('#jobDetailBox').textContent.includes('متقدم'));

fire($('#applyForm'), 'submit');
await wait(80);
check('يرفض الإرسال الناقص مع رسالة خطأ', !!$('.field-error.show'));

$('#apName').value = 'أحمد علي';
$('#apPhone').value = '07705544332';
$('#apEmail').value = 'ahmed@test.com';
fire($('#applyForm'), 'submit');
await wait(150);
check('يضيف السجل من النموذج', db().tables.applicants.some(a => a.phone === '07705544332'));
check('يحفظ في localStorage', JSON.parse(window.localStorage.getItem('rajd_db')).schema_version === 2);

/* ══════ 4) لوحة السجلات ══════ */
window.location.hash = '#/records';
await wait(120);
check('تظهر بوابة الرمز', $('#gateBox').style.display === 'block');
$('#pinInput').value = '0000'; click($('#btnGate'));
await wait(80);
check('يرفض الرمز الخطأ', $('#gateErr').classList.contains('show') && $('#recordsBox').style.display === 'none');
$('#pinInput').value = '1234'; click($('#btnGate'));
await wait(150);
check('يقبل الرمز الصحيح ويفتح اللوحة', $('#recordsBox').style.display === 'block');
check('يعرض السجلات في الجدول', $$('#recBody tr').length === 7, `${$$('#recBody tr').length} صف`);
check('قائمة الحالات مبنية من جدول statuses', $$('#recStatusF option').length === 6);
check('يعرض سجل التغييرات', $$('#historyBody tr').length > 0);
check('لا تنفيذ للأكواد المحقونة (XSS)', window.__XSS === undefined);
check('يُرمّز HTML في أسماء المتقدمين', $('#recBody').innerHTML.includes('&lt;img'));

const sel = $$('#recBody [data-action="status"]')[0];
sel.value = '4'; fire(sel, 'change');
await wait(120);
check('تغيير الحالة من اللوحة + تحديث الإحصاء', Number($('#rsOk').textContent) >= 1, 'مقبول=' + $('#rsOk').textContent);

const totalBefore = db().tables.applicants.length;
window.confirm = () => true;
click($$('#recBody [data-action="delete"]')[0]);
await wait(120);
check('حذف السجل من اللوحة', db().tables.applicants.length === totalBefore - 1);

/* ══════ 5) الرجوع ══════ */
window.location.hash = '#/jobs';
await wait(120);
check('الرجوع لقائمة الوظائف', $('#jobsGrid').style.display === 'grid' && $$('.jcard').length === 10);

/* ══════ 6) التعافي من بيانات تالفة ══════ */
const dom2 = await JSDOM.fromURL(BASE, {
  runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { w.localStorage.setItem('rajd_db', '{بيانات تالفة'); }
});
await waitFor(() => dom2.window.JobsSiteReady, 3000);
check('يتعافى من بيانات تالفة', dom2.window.document.querySelectorAll('.jcard').length === 10,
  `${dom2.window.document.querySelectorAll('.jcard').length} بطاقة`);
dom2.window.close();

/* ══════ 7) استيراد بيانات النسخة القديمة (migration 1→2) ══════ */
const dom3 = await JSDOM.fromURL(BASE, {
  runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) {
    w.localStorage.setItem('rajd_jobs_data', JSON.stringify({
      jobs: [{ id: 1, rank: 2, title: 'وظيفة قديمة', dept: 'قسم', loc: 'بغداد', type: 'دوام كامل', salary: '1,000,000', deadline: '2030-01-01', desc: 'وصف', req: 'شروط', active: 1 }],
      records: [{ id: 1, jobId: 1, name: 'متقدم قديم', phone: '07701110000', email: 'a@b.com', notes: '', status: 'مقبول', time: '2026-01-01 09:00' }]
    }));
  }
});
await waitFor(() => dom3.window.JobsSiteReady, 3000);
const legacy = dom3.window.JobsSite.db;
check('يستورد بيانات النسخة القديمة', legacy.tables.jobs.length === 1 && legacy.tables.applicants.length === 1,
  `وظائف=${legacy.tables.jobs.length} سجلات=${legacy.tables.applicants.length}`);
check('تحويل الحالة النصية إلى status_id', legacy.tables.applicants[0].status_id === 4, String(legacy.tables.applicants[0].status_id));
check('تحويل rank إلى rank_id', legacy.tables.jobs[0].rank_id === 2);
dom3.window.close();

server.close();
window.close();

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('❌'));
console.log(`\nالنتيجة: ${results.length - failed.length}/${results.length} ناجح`);
if (errors.length) console.log('أخطاء JS:\n' + errors.join('\n'));
process.exit(failed.length || errors.length ? 1 : 0);
