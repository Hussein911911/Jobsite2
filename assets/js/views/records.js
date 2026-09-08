/* ============================================================
   views/records.js — منطقة السجلات: بوابة الرمز + لوحة المتابعة
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var u = JobsSite.utils, store = JobsSite.store, CONFIG = JobsSite.CONFIG;

  var UNLOCK_KEY = 'rajd_records_unlocked';
  var gateEl, panelEl, pinEl, errEl, bodyEl, rankEl, statusEl, searchEl;
  var unlocked = false;

  function isUnlocked() {
    if (unlocked) return true;
    try { unlocked = global.sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { unlocked = false; }
    return unlocked;
  }
  function unlock() {
    unlocked = true;
    try { global.sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) { /* تُطلب مرة أخرى بعد التحديث */ }
  }

  /* ─────────── البوابة ─────────── */
  function tryGate() {
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
  function renderRecords() {
    var rf = rankEl.value, sf = statusEl.value;
    var q = (searchEl.value || '').trim().toLowerCase();
    var s = store.stats();

    u.qs('#rsTotal').textContent = s.records;
    u.qs('#rsNew').textContent = s.newRecords;
    u.qs('#rsOk').textContent = s.okRecords;
    u.qs('#rsNo').textContent = s.noRecords;

    var list = store.allRecords().filter(function (r) {
      var j = store.jobById(r.jobId) || {};
      var okR = !rf || String(j.rank || '') === rf;
      var okS = !sf || r.status === sf;
      var okQ = !q || (r.name + ' ' + (r.phone || '') + ' ' + (r.email || '')).toLowerCase().indexOf(q) > -1;
      return okR && okS && okQ;
    });

    if (!list.length) {
      bodyEl.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:22px">لا توجد سجلات مطابقة</td></tr>';
      return;
    }
    bodyEl.innerHTML = list.map(rowHTML).join('');
  }

  function rowHTML(r) {
    var j = store.jobById(r.jobId);
    var cls = JobsSite.STATUS_CLASS[r.status] || 's-new';
    var opts = JobsSite.STATUSES.map(function (s) {
      return '<option value="' + u.esc(s) + '"' + (r.status === s ? ' selected' : '') + '>' + u.esc(s) + '</option>';
    }).join('');

    return '<tr>' +
      '<td class="muted">' + r.id + '</td>' +
      '<td><b>' + u.esc(r.name) + '</b>' +
        (r.email ? '<div class="muted">✉️ ' + u.esc(r.email) + '</div>' : '') +
        (r.notes ? '<div class="muted">📝 ' + u.esc(r.notes) + '</div>' : '') + '</td>' +
      '<td dir="ltr" style="text-align:right">' + u.esc(r.phone) + '</td>' +
      '<td>' + (j ? u.esc(j.title) : '<span class="muted">وظيفة محذوفة</span>') + '</td>' +
      '<td>' + (j ? u.rankBadge(j.rank) : '—') + '</td>' +
      '<td class="muted">' + u.esc(r.time) + '</td>' +
      '<td><span class="status ' + cls + '">' + u.esc(r.status) + '</span></td>' +
      '<td><div class="sels">' +
        '<select data-action="status" data-id="' + r.id + '" aria-label="تغيير الحالة">' + opts + '</select>' +
        '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + r.id + '">حذف</button>' +
      '</div></td>' +
    '</tr>';
  }

  /* ─────────── الإجراءات ─────────── */
  function onPanelClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var id = Number(el.dataset.id);

    if (el.dataset.action === 'delete') {
      var r = store.recordById(id);
      if (!r) return;
      if (!global.confirm('حذف سجل «' + r.name + '» نهائياً؟')) return;
      store.deleteRecord(id);
      JobsSite.app.renderStats();
      renderRecords();
      u.toast('تم حذف السجل');
    }
  }

  function onPanelChange(e) {
    var el = e.target.closest('[data-action="status"]');
    if (!el) return;
    if (store.setStatus(Number(el.dataset.id), el.value)) {
      JobsSite.app.renderStats();
      renderRecords();
      u.toast('تم تحديث حالة السجل إلى: ' + el.value);
    }
  }

  function exportCSV() {
    var n = store.exportCSV();
    u.toast('📤 تم تصدير ' + n + ' سجل — افتحه بـ Excel');
  }

  function resetData() {
    if (!global.confirm('سيتم حذف كل التعديلات المحلية واستعادة البيانات الابتدائية. متابعة؟')) return;
    store.reset();
    JobsSite.app.renderStats();
    renderRecords();
    u.toast('↺ تمت استعادة البيانات الابتدائية');
  }

  /* ─────────── الربط ─────────── */
  function bind() {
    gateEl = u.qs('#gateBox');
    panelEl = u.qs('#recordsBox');
    pinEl = u.qs('#pinInput');
    errEl = u.qs('#gateErr');
    bodyEl = u.qs('#recBody');
    rankEl = u.qs('#recRankF');
    statusEl = u.qs('#recStatusF');
    searchEl = u.qs('#recSearch');

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
    show: function () {
      if (isUnlocked()) showPanel(); else showGate();
    }
  };
})(window);
