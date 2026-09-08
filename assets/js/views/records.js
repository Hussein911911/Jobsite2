/* ============================================================
   views/records.js — منطقة السجلات: بوابة الرمز + لوحة المتابعة
   تقرأ من مستودع db.applicants / db.history
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var u = JobsSite.utils, CONFIG = JobsSite.CONFIG;

  var UNLOCK_KEY = 'rajd_records_unlocked';
  var gateEl, panelEl, pinEl, errEl, bodyEl, rankEl, statusEl, searchEl, historyEl;
  var jobsBodyEl, jobFormEl;
  var unlocked = false;

  function isUnlocked() {
    if (unlocked) return true;
    try { unlocked = global.sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { unlocked = false; }
    return unlocked;
  }
  function unlock() {
    unlocked = true;
    try { global.sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {}
  }

  /* ─────────── البوابة ─────────── */
  function tryGate() {
    if (CONFIG.dataSource === 'api') {
      /* في وضع السيرفر: الدخول يتم عبر POST /api/auth/login */
      login(pinEl.value.trim());
      return;
    }
    if (pinEl.value.trim() === CONFIG.accessPin) {
      unlock();
      errEl.classList.remove('show');
      pinEl.value = '';
      showPanel();
      u.toast('🔓 أهلاً بك في منطقة السجلات');
    } else {
      errEl.classList.add('show');
      pinEl.value = '';
      pinEl.focus();
    }
  }

  async function login(password) {
    try {
      await JobsSite.db.login('admin', password);
      unlock();
      errEl.classList.remove('show');
      pinEl.value = '';
      showPanel();
      u.toast('🔓 تم تسجيل الدخول');
    } catch (e) {
      errEl.textContent = e.message || 'بيانات الدخول غير صحيحة';
      errEl.classList.add('show');
    }
  }

  function showPanel() {
    gateEl.style.display = 'none';
    panelEl.style.display = 'block';
    renderRecords();
    renderJobsAdmin();
  }

  function showGate() {
    gateEl.style.display = 'block';
    panelEl.style.display = 'none';
    pinEl.focus();
  }

  /* ─────────── اللوحة ─────────── */
  async function renderRecords() {
    var s = await JobsSite.db.stats();
    u.qs('#rsTotal').textContent = s.applicants_total;
    u.qs('#rsNew').textContent = s.applicants_new;
    u.qs('#rsOk').textContent = s.applicants_accepted;
    u.qs('#rsNo').textContent = s.applicants_rejected;

    var list = await JobsSite.db.applicants.query({
      q: searchEl.value, rank_id: rankEl.value, status_id: statusEl.value, limit: 0
    });

    bodyEl.innerHTML = list.length
      ? list.map(rowHTML).join('')
      : '<tr><td colspan="9" class="muted" style="text-align:center;padding:22px">لا توجد سجلات مطابقة</td></tr>';

    renderHistory();
  }

  function rowHTML(a) {
    var opts = JobsSite.statusOptions.map(function (s) {
      return '<option value="' + s.id + '"' + (Number(a.status_id) === Number(s.id) ? ' selected' : '') + '>' + u.esc(s.name) + '</option>';
    }).join('');

    return '<tr>' +
      '<td class="muted">' + a.id + '</td>' +
      '<td><b>' + u.esc(a.full_name) + '</b>' +
        (a.email ? '<div class="muted">✉️ ' + u.esc(a.email) + '</div>' : '') +
        (a.notes ? '<div class="muted">📝 ' + u.esc(a.notes) + '</div>' : '') + '</td>' +
      '<td dir="ltr" style="text-align:right">' + u.esc(a.phone) + '</td>' +
      '<td>' + (a.job ? u.esc(a.job.title) : '<span class="muted">وظيفة محذوفة</span>') + '</td>' +
      '<td>' + (a.job ? u.rankBadge(a.job.rank_id) : '—') + '</td>' +
      '<td class="muted">' + u.esc(a.applied_at) + '</td>' +
      '<td>' + u.statusBadge(a.status) + '</td>' +
      '<td><div class="sels">' +
        '<select data-action="status" data-id="' + a.id + '" aria-label="تغيير الحالة">' + opts + '</select>' +
        '<button class="btn btn-sm btn-line" data-action="history" data-id="' + a.id + '" title="سجل التغييرات">⏱</button>' +
        '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + a.id + '">حذف</button>' +
      '</div></td>' +
    '</tr>';
  }

  async function renderHistory() {
    if (!historyEl) return;
    var items = await JobsSite.db.history.recent(8);
    historyEl.innerHTML = items.length
      ? items.map(function (h) {
          var applicantName = h.applicant_name || (h.applicant && h.applicant.full_name) || ('#' + h.applicant_id);
          return '<tr><td class="muted">' + u.esc(h.changed_at) + '</td>' +
            '<td>' + u.esc(applicantName) + '</td>' +
            '<td>' + (h.from_status_id ? u.statusBadge(h.from_status_id) : '<span class="muted">—</span>') + ' ← ' + u.statusBadge(h.to_status_id) + '</td>' +
            '<td class="muted">' + u.esc(h.note || '') + '</td></tr>';
        }).join('')
      : '<tr><td colspan="4" class="muted" style="text-align:center;padding:16px">لا تغييرات مسجّلة</td></tr>';
  }

  /* ═══════════ إدارة الوظائف ═══════════ */
  async function renderJobsAdmin() {
    if (!jobsBodyEl) return;
    try {
      var list = await JobsSite.db.jobs.all();
      jobsBodyEl.innerHTML = list.length ? list.map(jobRowHTML).join('')
        : '<tr><td colspan="8" class="muted" style="text-align:center;padding:18px">لا توجد وظائف — أضف وظيفتك الأولى</td></tr>';
    } catch (e) {
      jobsBodyEl.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:18px">تعذّر تحميل الوظائف: ' + u.esc(e.message) + '</td></tr>';
    }
  }

  function jobRowHTML(j) {
    return '<tr>' +
      '<td class="muted">' + j.id + '</td>' +
      '<td><b>' + u.esc(j.title) + '</b><div class="muted">📍 ' + u.esc(j.location) + '</div></td>' +
      '<td>' + u.rankBadge(j.rank_id) + '</td>' +
      '<td class="muted">' + u.esc(j.dept) + '</td>' +
      '<td class="muted">' + u.esc(j.salary_text || '—') + '</td>' +
      '<td class="muted">' + u.esc(j.deadline || 'مفتوح') + '</td>' +
      '<td>' + (j.is_active ? '<span class="status s-ok">مفتوحة</span>' : '<span class="status s-no">مغلقة</span>') + '</td>' +
      '<td><div class="sels">' +
        '<button class="btn btn-sm btn-line" data-job-action="edit" data-id="' + j.id + '">✏️ تعديل</button>' +
        '<button class="btn btn-sm btn-line" data-job-action="toggle" data-id="' + j.id + '">' + (j.is_active ? '🔒 إغلاق' : '🔓 فتح') + '</button>' +
        '<button class="btn btn-sm btn-danger" data-job-action="delete" data-id="' + j.id + '">حذف</button>' +
      '</div></td>' +
    '</tr>';
  }

  async function openJobForm(id) {
    var job = id ? await JobsSite.db.jobs.find(id) : null;
    var ranks = await JobsSite.db.ranks.all();
    var v = function (k, d) { return job ? (job[k] === null || job[k] === undefined ? d : job[k]) : d; };

    jobFormEl.style.display = 'block';
    jobFormEl.innerHTML =
      '<form class="apply" id="jobForm" data-job-id="' + (job ? job.id : '') + '" novalidate>' +
        '<h3>' + (job ? '✏️ تعديل: ' + u.esc(job.title) : '➕ وظيفة جديدة') + '</h3>' +
        '<div class="row">' +
          '<div><label for="jbTitle">عنوان الوظيفة *</label>' +
            '<input id="jbTitle" value="' + u.esc(v('title', '')) + '" placeholder="مثال: محاسب">' +
            '<div class="field-error"></div></div>' +
          '<div><label for="jbRank">الرتبة *</label>' +
            '<select id="jbRank">' + ranks.map(function (r) {
              return '<option value="' + r.id + '"' + (Number(v('rank_id', 5)) === Number(r.id) ? ' selected' : '') + '>' + u.esc(r.name) + '</option>';
            }).join('') + '</select></div>' +
        '</div>' +
        '<div class="row">' +
          '<div><label for="jbDept">القسم</label><input id="jbDept" value="' + u.esc(v('dept', '—')) + '"></div>' +
          '<div><label for="jbLoc">المكان</label><input id="jbLoc" value="' + u.esc(v('location', '—')) + '"></div>' +
          '<div><label for="jbType">نوع الدوام</label><input id="jbType" value="' + u.esc(v('employment_type', 'دوام كامل')) + '"></div>' +
        '</div>' +
        '<div class="row">' +
          '<div><label for="jbSalText">الراتب (نص)</label><input id="jbSalText" value="' + u.esc(v('salary_text', '')) + '" placeholder="700,000 – 1,000,000 د.ع"></div>' +
          '<div><label for="jbSalMin">الحد الأدنى</label><input id="jbSalMin" type="number" min="0" value="' + u.esc(v('salary_min', '')) + '"></div>' +
          '<div><label for="jbSalMax">الحد الأعلى</label><input id="jbSalMax" type="number" min="0" value="' + u.esc(v('salary_max', '')) + '"></div>' +
        '</div>' +
        '<div class="row">' +
          '<div><label for="jbDeadline">آخر موعد للتقديم</label><input id="jbDeadline" type="date" value="' + u.esc(v('deadline', '')) + '"></div>' +
          '<div><label for="jbActive">الحالة</label><select id="jbActive">' +
            '<option value="1"' + (Number(v('is_active', 1)) === 1 ? ' selected' : '') + '>مفتوحة</option>' +
            '<option value="0"' + (Number(v('is_active', 1)) === 0 ? ' selected' : '') + '>مغلقة</option>' +
          '</select></div>' +
        '</div>' +
        '<label for="jbDesc">وصف الوظيفة</label><textarea id="jbDesc" rows="3">' + u.esc(v('description', '')) + '</textarea>' +
        '<label for="jbReq">الشروط المطلوبة</label><textarea id="jbReq" rows="2">' + u.esc(v('requirements', '')) + '</textarea>' +
        '<div class="actions">' +
          '<button type="submit" class="btn btn-navy" id="btnSaveJob">💾 حفظ</button>' +
          '<button type="button" class="btn btn-line" id="btnCancelJob">إلغاء</button>' +
        '</div>' +
      '</form>';
    u.qs('#jbTitle', jobFormEl).focus();
  }

  function closeJobForm() {
    jobFormEl.style.display = 'none';
    jobFormEl.innerHTML = '';
  }

  async function submitJobForm(e) {
    e.preventDefault();
    var form = e.target;
    var id = form.dataset.jobId ? Number(form.dataset.jobId) : null;
    var data = {
      title: u.qs('#jbTitle', form).value.trim(),
      rank_id: Number(u.qs('#jbRank', form).value),
      dept: u.qs('#jbDept', form).value.trim() || '—',
      location: u.qs('#jbLoc', form).value.trim() || '—',
      employment_type: u.qs('#jbType', form).value.trim() || '—',
      salary_text: u.qs('#jbSalText', form).value.trim(),
      salary_min: u.qs('#jbSalMin', form).value || null,
      salary_max: u.qs('#jbSalMax', form).value || null,
      deadline: u.qs('#jbDeadline', form).value,
      description: u.qs('#jbDesc', form).value.trim(),
      requirements: u.qs('#jbReq', form).value.trim(),
      is_active: Number(u.qs('#jbActive', form).value)
    };

    var titleEl = u.qs('#jbTitle', form);
    u.setFieldError(titleEl, '');
    if (data.title.length < 3) { u.setFieldError(titleEl, 'العنوان مطلوب (٣ أحرف على الأقل)'); return; }
    if (data.salary_min && data.salary_max && Number(data.salary_min) > Number(data.salary_max)) {
      u.toast('الحد الأدنى للراتب أكبر من الأعلى', false); return;
    }

    var btn = u.qs('#btnSaveJob', form);
    btn.disabled = true;
    try {
      if (id) await JobsSite.db.jobs.update(id, data);
      else await JobsSite.db.jobs.create(data);
      u.toast(id ? '✅ تم تعديل الوظيفة' : '✅ تمت إضافة الوظيفة');
      closeJobForm();
      renderJobsAdmin();
      JobsSite.app.refreshStats();
    } catch (err) {
      u.toast('تعذّر الحفظ: ' + err.message, false);
      btn.disabled = false;
    }
  }

  async function onJobsClick(e) {
    var btn = e.target.closest('[data-job-action]');
    if (!btn) return;
    var id = Number(btn.dataset.id), action = btn.dataset.jobAction;   /* data-job-action ⇒ dataset.jobAction */
    try {
      if (action === 'edit') { openJobForm(id); return; }

      if (action === 'toggle') {
        var job = await JobsSite.db.jobs.find(id);
        if (!job) { u.toast('الوظيفة غير موجودة', false); return; }
        await JobsSite.db.jobs.update(id, { is_active: job.is_active ? 0 : 1 });
        u.toast(job.is_active ? '🔒 تم إغلاق الوظيفة' : '🔓 تم فتح الوظيفة');
        renderJobsAdmin();
        JobsSite.app.refreshStats();
        return;
      }

      if (action === 'delete') {
        var j = await JobsSite.db.jobs.find(id);
        if (!j) { u.toast('الوظيفة غير موجودة', false); return; }
        if (!global.confirm('حذف وظيفة «' + j.title + '»؟\nسيُحذف معها كل سجلات المتقدمين عليها.')) return;
        await JobsSite.db.jobs.remove(id);
        u.toast('تم حذف الوظيفة');
        renderJobsAdmin();
        renderRecords();
        JobsSite.app.refreshStats();
      }
    } catch (err) {
      u.toast('تعذّر تنفيذ الإجراء: ' + err.message, false);
    }
  }

  /* ─────────── الإجراءات ─────────── */
  async function onPanelClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var id = Number(el.dataset.id);

    if (el.dataset.action === 'delete') {
      var r = await JobsSite.db.applicants.find(id);
      if (!r) return;
      if (!global.confirm('حذف سجل «' + r.full_name + '» نهائياً؟')) return;
      await JobsSite.db.applicants.remove(id);
      JobsSite.app.refreshStats();
      renderRecords();
      u.toast('تم حذف السجل');
    }

    if (el.dataset.action === 'history') {
      var items = await JobsSite.db.history.forApplicant(id);
      var txt = items.length
        ? items.map(function (h) {
            var from = h.from_status_id ? JobsSite.db.statusOf(h.from_status_id).name + ' ← ' : '';
            var to = JobsSite.db.statusOf(h.to_status_id).name;
            return '• ' + h.changed_at + ' — ' + from + to + (h.note ? ' (' + h.note + ')' : '');
          }).join('\n')
        : 'لا تغييرات مسجّلة لهذا السجل';
      global.alert('سجل التغييرات:\n\n' + txt);
    }
  }

  async function onPanelChange(e) {
    var el = e.target.closest('[data-action="status"]');
    if (!el) return;
    await JobsSite.db.applicants.setStatus(Number(el.dataset.id), el.value, 'admin');
    JobsSite.app.refreshStats();
    renderRecords();
    u.toast('تم تحديث حالة السجل إلى: ' + el.options[el.selectedIndex].text);
  }

  async function exportCSV() {
    var n = await JobsSite.db.exportCSV({ rank_id: rankEl.value, status_id: statusEl.value, q: searchEl.value });
    if (n >= 0) u.toast('📤 تم تصدير ' + n + ' سجل — افتحه بـ Excel');
    else u.toast('📤 يُرجى حفظ ملف CSV من النافذة الجديدة');
  }

  async function resetData() {
    if (!global.confirm('سيتم حذف كل البيانات المحلية واستعادة البيانات الابتدائية. متابعة؟')) return;
    await JobsSite.db.reset();
    JobsSite.app.refreshStats();
    renderRecords();
    u.toast('↺ تمت استعادة البيانات الابتدائية');
  }

  /* ─────────── الربط ─────────── */
  async function bind() {
    gateEl = u.qs('#gateBox');
    panelEl = u.qs('#recordsBox');
    pinEl = u.qs('#pinInput');
    errEl = u.qs('#gateErr');
    bodyEl = u.qs('#recBody');
    historyEl = u.qs('#historyBody');
    jobsBodyEl = u.qs('#jobsAdminBody');
    jobFormEl = u.qs('#jobFormBox');
    rankEl = u.qs('#recRankF');
    statusEl = u.qs('#recStatusF');
    searchEl = u.qs('#recSearch');

    /* تعبئة قائمة الحالات من جدول statuses */
    var statuses = await JobsSite.db.statuses.all();
    JobsSite.statusOptions = statuses;
    statusEl.innerHTML = '<option value="">كل الحالات</option>' +
      statuses.map(function (s) { return '<option value="' + s.id + '">' + u.esc(s.name) + '</option>'; }).join('');

    if (CONFIG.dataSource === 'api') {
      pinEl.type = 'password';
      pinEl.placeholder = 'كلمة المرور';
      pinEl.maxLength = 64;
      u.qs('#gateHint').textContent = 'الدخول يتم عبر سيرفر الشركة (POST /api/auth/login)';
    }

    u.qs('#btnGate').addEventListener('click', tryGate);
    pinEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryGate(); });
    pinEl.addEventListener('input', function () { errEl.classList.remove('show'); });

    [rankEl, statusEl].forEach(function (el) { el.addEventListener('change', renderRecords); });
    searchEl.addEventListener('input', renderRecords);

    panelEl.addEventListener('click', onPanelClick);
    panelEl.addEventListener('change', onPanelChange);

    /* إدارة الوظائف */
    jobsBodyEl.addEventListener('click', onJobsClick);
    jobFormEl.addEventListener('submit', submitJobForm);
    jobFormEl.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'btnCancelJob') closeJobForm();
    });
    u.qs('#btnAddJob').addEventListener('click', function () { openJobForm(null); });
    u.qs('#btnReloadJobs').addEventListener('click', renderJobsAdmin);

    u.qs('#btnExport').addEventListener('click', exportCSV);
    u.qs('#btnResetData').addEventListener('click', resetData);
    u.qs('#btnLock').addEventListener('click', function () {
      unlocked = false;
      try { global.sessionStorage.removeItem(UNLOCK_KEY); } catch (e) {}
      showGate();
      u.toast('🔒 تم قفل منطقة السجلات');
    });
  }

  JobsSite.views = JobsSite.views || {};
  JobsSite.views.records = {
    bind: bind,
    show: function () { if (isUnlocked()) showPanel(); else showGate(); }
  };
})(window);
