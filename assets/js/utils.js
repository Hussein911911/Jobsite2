/* ============================================================
   utils.js — أدوات مساعدة مشتركة (HTML آمن، توست، تواريخ، تحقق)
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /* ── ترميز النصوص قبل إدراجها في HTML (يمنع حقن الأكواد XSS) ── */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  }

  /* ── الوصول السريع للعناصر ── */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ── الرسائل العائمة ── */
  var toastTimer = null;
  function toast(msg, ok) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (ok === false ? ' bad' : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 3200);
  }

  /* ── شارة الرتبة ── */
  function rankBadge(rank) {
    var R = JobsSite.RANKS[rank] || JobsSite.RANKS[5];
    var label = R.name.indexOf('—') > -1 ? R.name.split('—')[1].trim() : R.name;
    return '<span class="rbadge ' + R.cls + '">⭐ ' + esc(R.short) + ' — ' + esc(label) + '</span>';
  }

  /* ── التاريخ والوقت ── */
  function nowStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function todayISO() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* عدد الأيام المتبقية على آخر موعد (سالب = انتهى) */
  function daysLeft(deadline) {
    if (!deadline) return null;
    var a = new Date(deadline + 'T00:00:00');
    var b = new Date(todayISO() + 'T00:00:00');
    if (isNaN(a.getTime())) return null;
    return Math.round((a - b) / 86400000);
  }

  function deadlineText(deadline) {
    if (!deadline) return '📅 آخر موعد: مفتوح';
    var d = daysLeft(deadline);
    var tail = '';
    if (d === null) tail = '';
    else if (d > 1) tail = ' <span class="dl-left">(متبقٍ ' + d + ' يوم)</span>';
    else if (d === 1) tail = ' <span class="dl-today">(آخر يوم!)</span>';
    else if (d === 0) tail = ' <span class="dl-today">(ينتهي اليوم)</span>';
    else tail = ' <span class="dl-past">(انتهى الموعد)</span>';
    return '📅 آخر موعد: ' + esc(deadline) + tail;
  }

  /* ── التحقق من المدخلات ── */
  function normalizePhone(phone) {
    var p = String(phone || '').replace(/[\s\-()]/g, '');
    if (p.indexOf('+964') === 0) p = '0' + p.slice(4);
    if (p.indexOf('00964') === 0) p = '0' + p.slice(5);
    return p;
  }
  function isValidPhone(phone) { return /^0[3579]\d{9}$/.test(normalizePhone(phone)); }
  function isValidEmail(email) {
    if (!email) return true;                       /* البريد اختياري */
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  /* ── حقول النموذج: رسائل خطأ تحت الحقل ── */
  function setFieldError(inputEl, message) {
    if (!inputEl) return;
    var wrap = inputEl.parentNode;
    var err = qs('.field-error', wrap);
    if (message) {
      inputEl.classList.add('invalid');
      if (err) { err.textContent = message; err.classList.add('show'); }
    } else {
      inputEl.classList.remove('invalid');
      if (err) { err.textContent = ''; err.classList.remove('show'); }
    }
  }

  /* ── CSV: تأطير القيم اللي فيها فاصلة/علامة تنصيص/سطر جديد ── */
  function csvCell(value) {
    var v = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  JobsSite.utils = {
    esc: esc, qs: qs, qsa: qsa, toast: toast,
    rankBadge: rankBadge, nowStamp: nowStamp, todayISO: todayISO,
    daysLeft: daysLeft, deadlineText: deadlineText,
    normalizePhone: normalizePhone, isValidPhone: isValidPhone, isValidEmail: isValidEmail,
    setFieldError: setFieldError, csvCell: csvCell
  };
})(window);
