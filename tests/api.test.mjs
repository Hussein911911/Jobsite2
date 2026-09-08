/* ============================================================
   tests/api.test.mjs — اختبار وضع السيرفر (dataSource: 'api')
   يشغّل سيرفر وهمي يحاكي سيرفر بايثون بحسب العقد في docs/API.md،
   ويتأكد أن الواجهة تتحدث معه بشكل صحيح.
   التشغيل: npm run test:api
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

/* ── "قاعدة بيانات" السيرفر الوهمي ── */
const SERVER_DB = {
  ranks: [
    { id: 1, name: 'الرتبة الأولى — إدارة عليا', short: 'ر1', level: 1, css_class: 'r1' },
    { id: 5, name: 'الرتبة الخامسة — مبتدئ',      short: 'ر5', level: 5, css_class: 'r5' }
  ],
  statuses: [
    { id: 1, name: 'جديد',  slug: 'new',      css_class: 's-new', sort_order: 1 },
    { id: 4, name: 'مقبول', slug: 'accepted', css_class: 's-ok',  sort_order: 4 }
  ],
  jobs: [
    { id: 1, rank_id: 1, title: 'مدير من السيرفر', dept: 'الإدارة', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '2,000,000 د.ع', salary_min: 2000000, salary_max: 2500000, deadline: '2030-01-01', description: 'وصف من السيرفر', requirements: 'شروط من السيرفر', is_active: 1, created_at: '2026-09-01 10:00', updated_at: '2026-09-01 10:00' },
    { id: 2, rank_id: 5, title: 'موظف من السيرفر', dept: 'الاستقبال', location: 'بغداد', employment_type: 'نوبات', salary_text: '600,000 د.ع', salary_min: 600000, salary_max: 700000, deadline: '2030-02-01', description: 'وصف 2', requirements: 'شروط 2', is_active: 1, created_at: '2026-09-02 10:00', updated_at: '2026-09-02 10:00' }
  ],
  applicants: [],
  status_history: [],
  nextId: 1
};

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function body(req) {
  return new Promise(resolve => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
  });
}

const calls = [];   /* نراقب الطلبات للتأكد أن الواجهة نادت المسارات الصحيحة */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const method = req.method;

  /* ══════ الـ API ══════ */
  if (p.startsWith('/api/')) {
    calls.push(method + ' ' + p);

    if (p === '/api/bootstrap' && method === 'GET') {
      return json(res, 200, { schema_version: 2, tables: { ranks: SERVER_DB.ranks, statuses: SERVER_DB.statuses, jobs: [], applicants: [], status_history: [] } });
    }
    if (p === '/api/jobs' && method === 'GET') {
      let list = SERVER_DB.jobs.slice();
      if (url.searchParams.get('rank_id')) list = list.filter(j => String(j.rank_id) === url.searchParams.get('rank_id'));
      if (url.searchParams.get('q')) list = list.filter(j => j.title.includes(url.searchParams.get('q')));
      return json(res, 200, list);
    }
    if (p === '/api/jobs/1' && method === 'GET') return json(res, 200, SERVER_DB.jobs[0]);
    if (p === '/api/jobs/2' && method === 'GET') return json(res, 200, SERVER_DB.jobs[1]);

    if (p === '/api/applicants' && method === 'GET') {
      return json(res, 200, SERVER_DB.applicants.map(a => Object.assign({}, a, {
        job: SERVER_DB.jobs.find(j => j.id === a.job_id),
        status: SERVER_DB.statuses.find(s => s.id === a.status_id)
      })));
    }
    if (p === '/api/applicants' && method === 'POST') {
      const d = await body(req);
      if (!d.full_name || !d.phone) return json(res, 400, { error: 'الاسم والهاتف مطلوبان' });
      if (SERVER_DB.applicants.some(a => a.job_id === d.job_id && a.phone === d.phone)) {
        return json(res, 409, { error: 'DUPLICATE' });
      }
      const row = Object.assign({ id: SERVER_DB.nextId++, status_id: 1, applied_at: '2026-09-09 12:00', updated_at: '2026-09-09 12:00' }, d);
      SERVER_DB.applicants.push(row);
      SERVER_DB.status_history.push({ id: SERVER_DB.nextId++, applicant_id: row.id, from_status_id: null, to_status_id: 1, changed_at: '2026-09-09 12:00', changed_by: 'system', note: 'تقديم جديد' });
      return json(res, 201, row);
    }
    let m = p.match(/^\/api\/applicants\/(\d+)$/);
    if (m && method === 'PATCH') {
      const d = await body(req);
      const row = SERVER_DB.applicants.find(a => a.id === Number(m[1]));
      if (!row) return json(res, 404, { error: 'غير موجود' });
      row.status_id = Number(d.status_id);
      SERVER_DB.status_history.push({ id: SERVER_DB.nextId++, applicant_id: row.id, from_status_id: 1, to_status_id: row.status_id, changed_at: '2026-09-09 12:30', changed_by: 'admin', note: d.note || '' });
      return json(res, 200, row);
    }
    if (p === '/api/stats' && method === 'GET') {
      return json(res, 200, {
        jobs_total: SERVER_DB.jobs.length, jobs_open: SERVER_DB.jobs.length, jobs_rank1: 1,
        applicants_total: SERVER_DB.applicants.length,
        applicants_new: SERVER_DB.applicants.filter(a => a.status_id === 1).length,
        applicants_accepted: SERVER_DB.applicants.filter(a => a.status_id === 4).length,
        applicants_rejected: 0
      });
    }
    if (p === '/api/statuses' && method === 'GET') return json(res, 200, SERVER_DB.statuses);
    if (p === '/api/ranks' && method === 'GET') return json(res, 200, SERVER_DB.ranks);
    if (p === '/api/history' && method === 'GET') return json(res, 200, SERVER_DB.status_history.slice().reverse());
    if (p === '/api/auth/login' && method === 'POST') {
      const d = await body(req);
      if (d.password === 'secret') return json(res, 200, { ok: true, user: { username: 'admin', role: 'admin' } });
      return json(res, 401, { error: 'بيانات الدخول غير صحيحة' });
    }
    return json(res, 404, { error: 'مسار غير موجود' });
  }

  /* ══════ الملفات الثابتة ══════ */
  const file = path.join(ROOT, decodeURIComponent(p.replace(/^\/+/, '')) || 'index.html');
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

const dom = await JSDOM.fromURL(BASE, {
  runScripts: 'dangerously', resources: 'usable', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { w.JOBSITE_CONFIG = { dataSource: 'api', apiBaseUrl: '/api' }; }
});
const { window } = dom;
const doc = window.document;

const wait = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (fn, timeout = 3000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { if (fn()) return true; } catch (e) {} await wait(30); }
  return false;
};
await waitFor(() => window.JobsSiteReady);

const $ = s => doc.querySelector(s);
const $$ = s => [...doc.querySelectorAll(s)];
const results = [];
const check = (name, cond, extra = '') => results.push(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

/* ══════ 1) الاتصال ══════ */
const meta = window.JobsSite.db.meta();
check('يعمل على وضع السيرفر', meta.source === 'http' && meta.remote === true, meta.source);
check('سحب التهيئة من /api/bootstrap', calls.includes('GET /api/bootstrap'));
check('سحب الوظائف من /api/jobs', calls.includes('GET /api/jobs'));
check('يعرض وظائف السيرفر', $$('.jcard').length === 2 && doc.body.textContent.includes('مدير من السيرفر'),
  `${$$('.jcard').length} بطاقة`);
check('الإحصاءات من /api/stats', $('#stJobs').textContent === '2');
check('يعرض مصدر البيانات في الفوتر', $('#dbMeta').textContent.includes('سيرفر'));

/* ══════ 2) التقديم يذهب للسيرفر ══════ */
click($$('.jcard')[0]);
await wait(150);
check('يفتح تفاصيل وظيفة السيرفر', $('#applyForm') !== null && doc.body.textContent.includes('وصف من السيرفر'));

$('#apName').value = 'متقدم عبر API';
$('#apPhone').value = '07701112233';
fire($('#applyForm'), 'submit');
await wait(250);
check('يرسل الطلب POST /api/applicants', calls.includes('POST /api/applicants'));
check('السجل محفوظ عند السيرفر', SERVER_DB.applicants.length === 1, JSON.stringify(SERVER_DB.applicants[0]?.full_name));

/* تكرار */
$('#apName').value = 'متقدم عبر API';
$('#apPhone').value = '07701112233';
fire($('#applyForm'), 'submit');
await wait(250);
check('يرفض التكرار برسالة 409 من السيرفر', SERVER_DB.applicants.length === 1 && $('#toast').textContent.includes('مسبقاً'));

/* ══════ 3) لوحة السجلات عبر الدخول للسيرفر ══════ */
window.location.hash = '#/records';
await wait(150);
$('#pinInput').value = 'wrong';
click($('#btnGate'));
await wait(200);
check('يرفض كلمة المرور الخطأ (401)', $('#gateErr').classList.contains('show') && $('#recordsBox').style.display === 'none');
$('#pinInput').value = 'secret';
click($('#btnGate'));
await wait(250);
check('يدخل بكلمة المرور الصحيحة', $('#recordsBox').style.display === 'block' && calls.includes('POST /api/auth/login'));
check('يعرض سجلات السيرفر في الجدول', $$('#recBody tr').length === 1);
check('يعرض سجل التغييرات من /api/history', $$('#historyBody tr').length >= 1);

const sel = $$('#recBody [data-action="status"]')[0];
if (sel) { sel.value = '4'; fire(sel, 'change'); await wait(250); }
check('تغيير الحالة يرسل PATCH', calls.some(c => /^PATCH \/api\/applicants\/\d+$/.test(c)) && SERVER_DB.applicants[0].status_id === 4);

server.close();
window.close();

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('❌'));
console.log(`\nالنتيجة: ${results.length - failed.length}/${results.length} ناجح`);
if (errors.length) console.log('أخطاء JS:\n' + errors.join('\n'));
process.exit(failed.length || errors.length ? 1 : 0);
