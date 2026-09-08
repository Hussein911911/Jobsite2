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
  var u = JobsSite.utils, store = JobsSite.store, CONFIG = JobsSite.CONFIG;

  var views = {}, els = {};
  var currentJobId = null;

  /* ─────────── الموجّه ─────────── */
  var router = {
    path: function () {
      var h = global.location.hash.replace(/^#/, '');
      return h || '/jobs';
    },
    go: function (path) {
      if (global.location.hash === '#' + path) resolve();   /* نفس المسار → أعد الرسم */
      else global.location.hash = '#' + path;
    },
    currentJobId: function () { return currentJobId; }
  };

  function resolve() {
    var path = router.path();
    var parts = path.split('/').filter(Boolean);   /* ['jobs'] | ['job','3'] | ['records'] */

    if (parts[0] === 'records') {
      showView('records');
      currentJobId = null;
      views.records.show();
      setNav('records');
      document.title = 'السجلات — ' + CONFIG.company;
      return;
    }

    if (parts[0] === 'job' && parts[1]) {
      showView('jobs');
      currentJobId = Number(parts[1]);
      views.jobs.detail(currentJobId);
      setNav('jobs');
      return;
    }

    showView('jobs');
    currentJobId = null;
    views.jobs.list();
    setNav('jobs');
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

  /* ─────────── بيانات التواصل (من config.js) ─────────── */
  function fillContact() {
    var phone = u.qs('#fPhone'), email = u.qs('#fEmail'), addr = u.qs('#fAddr');
    if (phone) { phone.textContent = '📞 ' + CONFIG.phone; phone.href = 'tel:' + CONFIG.phone.replace(/\s/g, ''); }
    if (email) { email.textContent = '✉️ ' + CONFIG.email; email.href = 'mailto:' + CONFIG.email; }
    if (addr) u.qs('span', addr).textContent = CONFIG.address;
    var year = u.qs('#fYear');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ─────────── الإحصاءات ─────────── */
  function renderStats() {
    var s = store.stats();
    u.qs('#stJobs').textContent = s.openJobs;
    u.qs('#stR1').textContent = s.rank1;
    u.qs('#stRecs').textContent = s.records;
    u.qs('#stNew').textContent = s.newRecords;
  }

  /* ─────────── التشغيل ─────────── */
  function init() {
    els.jobs = u.qs('#viewJobs');
    els.records = u.qs('#viewRecords');
    els.navJobs = u.qs('#navJobs');
    els.navRec = u.qs('#navRec');

    views.jobs = JobsSite.views.jobs;
    views.records = JobsSite.views.records;

    views.jobs.bind();
    views.records.bind();

    /* أزرار التنقل (تفويض) */
    u.qsa('[data-route]').forEach(function (btn) {
      btn.addEventListener('click', function () { router.go(btn.dataset.route); });
    });
    u.qs('#btnApplyTop').addEventListener('click', function () { views.jobs.showTop(); });

    /* بيانات التواصل والفوتر من ملف الإعدادات */
    fillContact();

    global.addEventListener('hashchange', resolve);

    renderStats();
    resolve();

    if (!store.isPersistent) {
      u.toast('⚠️ التخزين معطّل في هذا المتصفح — البيانات مؤقتة', false);
    }
  }

  JobsSite.router = router;
  JobsSite.app = { renderStats: renderStats, init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
