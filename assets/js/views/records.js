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
