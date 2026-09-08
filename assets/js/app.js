/* ============================================================
   app.js — الموجّه (Router) + الإحصاءات + تشغيل النظام
   المسارات:
     #/jobs        → قائمة الوظائف
     #/job/:id     → تفاصيل وظيفة + نموذج التقديم
     #/records     → منطقة السجلات
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var u = JobsSite.utils, CONFIG = JobsSite.CONFIG;

  var views = {}, els = {};
  var currentJobId = null;

  /* ─────────── الموجّه ─────────── */
  var router = {
    path: function () {
      var h = global.location.hash.replace(/^#/, '');
      return h || '/jobs';
    },
    go: function (path) {
      if (global.location.hash === '#' + path) resolve();
      else global.location.hash = '#' + path;
    },
    currentJobId: function () { return currentJobId; }
  };

  async function resolve() {
    var parts = router.path().split('/').filter(Boolean);

    if (parts[0] === 'records') {
      showView('records');
      currentJobId = null;
      setNav('records');
      views.records.show();
      document.title = 'السجلات — ' + CONFIG.company;
      return;
    }

    if (parts[0] === 'job' && parts[1]) {
      showView('jobs');
      currentJobId = Number(parts[1]);
      setNav('jobs');
      await views.jobs.detail(currentJobId);
      return;
    }

    showView('jobs');
    currentJobId = null;
    setNav('jobs');
    await views.jobs.list();
    document.title = 'شركة الرافدين — موقع الوظائف (الرتب والسجلات)';
  }

  function showView(name) {
    els.jobs.style.display = name === 'jobs' ? '' : 'none';
    els.records.style.display = name === 'records' ? '' : 'none';
  }

  function setNav(name) {
    els.navJobs.classList.toggle('on', name === 'jobs');
    els.navRec.classList.toggle('on', name === 'records');
  }

  /* ─────────── الإحصاءات ─────────── */
  async function refreshStats() {
    try {
      var s = await JobsSite.db.stats();
      u.qs('#stJobs').textContent = s.jobs_open;
      u.qs('#stR1').textContent = s.jobs_rank1;
      u.qs('#stRecs').textContent = s.applicants_total;
      u.qs('#stNew').textContent = s.applicants_new;
    } catch (e) {
      u.toast('تعذّر تحميل الإحصاءات: ' + e.message, false);
    }
  }

  /* ─────────── حالة قاعدة البيانات في الفوتر ─────────── */
  function showDbMeta() {
    var m = JobsSite.db.meta();
    var el = u.qs('#dbMeta');
    if (!el) return;
    el.textContent = '💾 قاعدة البيانات: ' +
      (m.remote ? 'سيرفر (' + CONFIG.apiBaseUrl + ')' : 'محلية (localStorage)') +
      ' — المخطط v' + m.schema_version;
    if (!m.persistent) el.textContent += ' ⚠️ التخزين معطّل';
  }

  /* ─────────── بيانات التواصل ─────────── */
  function fillContact() {
    var phone = u.qs('#fPhone'), email = u.qs('#fEmail'), addr = u.qs('#fAddr');
    if (phone) { phone.textContent = '📞 ' + CONFIG.phone; phone.href = 'tel:' + CONFIG.phone.replace(/\s/g, ''); }
    if (email) { email.textContent = '✉️ ' + CONFIG.email; email.href = 'mailto:' + CONFIG.email; }
    if (addr) u.qs('span', addr).textContent = CONFIG.address;
    var year = u.qs('#fYear');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ─────────── التشغيل ─────────── */
  async function init() {
    els.jobs = u.qs('#viewJobs');
    els.records = u.qs('#viewRecords');
    els.navJobs = u.qs('#navJobs');
    els.navRec = u.qs('#navRec');

    /* 1) تشغيل قاعدة البيانات (الترحيلات + التعبئة) */
    try {
      await JobsSite.db.init();
    } catch (e) {
      u.toast('تعذّر تشغيل قاعدة البيانات: ' + e.message, false);
    }

    views.jobs = JobsSite.views.jobs;
    views.records = JobsSite.views.records;

    /* 2) ربط الواجهات بقاعدة البيانات */
    await views.jobs.bind();
    await views.records.bind();

    /* 3) التنقل */
    u.qsa('[data-route]').forEach(function (btn) {
      btn.addEventListener('click', function () { router.go(btn.dataset.route); });
    });
    u.qs('#btnApplyTop').addEventListener('click', function () { views.jobs.showTop(); });
    global.addEventListener('hashchange', resolve);

    fillContact();
    showDbMeta();
    await refreshStats();
    await resolve();

    var m = JobsSite.db.meta();
    if (!m.persistent) u.toast('⚠️ التخزين معطّل في هذا المتصفح — البيانات مؤقتة', false);

    global.JobsSiteReady = true;
  }

  JobsSite.router = router;
  JobsSite.app = { refreshStats: refreshStats, init: init };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
