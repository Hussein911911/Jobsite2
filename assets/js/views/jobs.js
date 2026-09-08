/* ============================================================
   views/jobs.js — صفحة الوظائف: القائمة + التفاصيل + نموذج التقديم
   يقرأ كل بياناته من مستودع db.jobs / db.applicants
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var u = JobsSite.utils;

  var gridEl, detailEl, searchEl, rankEl, filtersEl;

  /* ─────────── القائمة ─────────── */
  async function renderList() {
    var list = await JobsSite.db.jobs.query({ q: searchEl.value, rank_id: rankEl.value, limit: 0 });

    gridEl.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : '<div class="emptystate">لا توجد وظائف مطابقة — جرب فلتراً آخر 🙏</div>';

    detailEl.style.display = 'none';
    detailEl.innerHTML = '';
    gridEl.style.display = 'grid';
  }

  function cardHTML(j) {
    var open = j.is_open;
    return '<article class="jcard" data-job-id="' + j.id + '" tabindex="0" role="button">' +
      '<div class="top">' + u.rankBadge(j.rank_id) +
        (open ? '' : '<span class="rbadge r5">مغلقة</span>') +
        (j.applicants_count ? '<span class="muted">👥 ' + j.applicants_count + '</span>' : '') + '</div>' +
      '<h3>' + u.esc(j.title) + '</h3>' +
      '<div class="meta"><span>🏢 ' + u.esc(j.dept) + '</span><span>📍 ' + u.esc(j.location) + '</span><span>🕐 ' + u.esc(j.employment_type) + '</span></div>' +
      '<div class="salary">💰 ' + u.esc(j.salary_text || 'حسب الخبرة') + '</div>' +
      '<div class="foot">' +
        '<span class="muted">' + u.deadlineText(j.deadline) + '</span>' +
        (open ? '<span class="btn btn-gold btn-sm">سجّل الآن</span>' : '<span class="muted">انتهى التقديم</span>') +
      '</div>' +
    '</article>';
  }

  /* ─────────── التفاصيل + نموذج التقديم ─────────── */
  async function renderDetail(id) {
    var j = await JobsSite.db.jobs.find(id);
    if (!j) {
      u.toast('الوظيفة المطلوبة غير موجودة', false);
      JobsSite.router.go('/jobs');
      return;
    }
    var open = j.is_open;

    gridEl.style.display = 'none';
    filtersEl.style.display = 'none';
    detailEl.style.display = 'block';
    detailEl.innerHTML =
      '<div class="detail">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">' +
          '<h1>💼 ' + u.esc(j.title) + '</h1>' + u.rankBadge(j.rank_id) +
        '</div>' +
        '<div class="dmeta">' +
          '<span>🏢 ' + u.esc(j.dept) + '</span><span>📍 ' + u.esc(j.location) + '</span><span>🕐 ' + u.esc(j.employment_type) + '</span>' +
          (j.salary_text ? '<span>💰 ' + u.esc(j.salary_text) + '</span>' : '') +
          '<span>' + u.deadlineText(j.deadline) + '</span>' +
          '<span>👥 ' + j.applicants_count + ' متقدم</span>' +
        '</div>' +
        '<h4>📝 وصف الوظيفة</h4><p>' + u.esc(j.description || '—') + '</p>' +
        '<h4>✅ الشروط المطلوبة</h4><p>' + u.esc(j.requirements || '—') + '</p>' +
        (open ? applyFormHTML(j) : '<div class="closed-note">🚫 التقديم على هذه الوظيفة مغلق حالياً</div>') +
        '<p style="margin-top:14px"><a href="#/jobs" style="color:var(--navy);font-size:13px;font-weight:700">← رجوع لكل الوظائف</a></p>' +
      '</div>';

    global.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = j.title + ' — ' + JobsSite.CONFIG.company;
    if (open) { var first = u.qs('#apName', detailEl); if (first) first.focus(); }
  }

  function applyFormHTML(j) {
    return '<form class="apply" id="applyForm" data-job-id="' + j.id + '" novalidate>' +
      '<h3>📩 سجّل طلبك لهذه الوظيفة (يضاف إلى السجلات فوراً)</h3>' +
      '<div class="row">' +
        '<div><label for="apName">الاسم الكامل *</label>' +
          '<input id="apName" name="full_name" autocomplete="name" placeholder="مثال: أحمد علي">' +
          '<div class="field-error"></div></div>' +
        '<div><label for="apPhone">رقم الهاتف *</label>' +
          '<input id="apPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxxx">' +
          '<div class="field-error"></div></div>' +
      '</div>' +
      '<label for="apEmail">البريد الإلكتروني</label>' +
      '<input id="apEmail" name="email" type="email" autocomplete="email" placeholder="example@mail.com">' +
      '<div class="field-error"></div>' +
      '<label for="apNotes">ملاحظات / خبرات سابقة</label>' +
      '<textarea id="apNotes" name="notes" rows="2" maxlength="' + JobsSite.CONFIG.maxNotesLength + '" placeholder="خبراتك السابقة..."></textarea>' +
      '<div class="actions">' +
        '<button type="submit" class="btn btn-navy" id="btnSubmitApply">✅ تسجيل الطلب</button>' +
        '<span class="muted">* الحقول المطلوبة: الاسم ورقم الهاتف</span>' +
      '</div>' +
    '</form>';
  }

  /* ─────────── إرسال الطلب ─────────── */
  async function submitApply(jobId) {
    var job = await JobsSite.db.jobs.find(jobId);
    if (!job || !job.is_open) { u.toast('التقديم على هذه الوظيفة مغلق', false); return; }

    var form = u.qs('#applyForm', detailEl);
    var nameEl = u.qs('#apName', form), phoneEl = u.qs('#apPhone', form),
        emailEl = u.qs('#apEmail', form), notesEl = u.qs('#apNotes', form),
        btn = u.qs('#btnSubmitApply', form);

    var name = nameEl.value.trim(), phone = phoneEl.value.trim(),
        email = emailEl.value.trim(), notes = notesEl.value.trim();

    var ok = true;
    [nameEl, phoneEl, emailEl].forEach(function (el) { u.setFieldError(el, ''); });
    if (name.length < 3) { u.setFieldError(nameEl, 'الاسم مطلوب (٣ أحرف على الأقل)'); ok = false; }
    if (!u.isValidPhone(phone)) { u.setFieldError(phoneEl, 'رقم هاتف عراقي صحيح: 07xxxxxxxxxx'); ok = false; }
    if (!u.isValidEmail(email)) { u.setFieldError(emailEl, 'البريد الإلكتروني غير صحيح'); ok = false; }
    if (!ok) { u.toast('تحقق من الحقول المعلّمة بالأحمر', false); return; }

    btn.disabled = true;
    try {
      await JobsSite.db.applicants.create({ job_id: jobId, full_name: name, phone: phone, email: email, notes: notes });
      JobsSite.app.refreshStats();
      u.toast('🎉 شكراً ' + name + '! تم تسجيل طلبك لـ«' + job.title + '» — أُضيف إلى السجلات');
      renderDetail(jobId);
    } catch (err) {
      if (err.message === 'DUPLICATE') {
        u.setFieldError(phoneEl, 'مسجّل مسبقاً على هذه الوظيفة');
        u.toast('هذا الرقم قدّم على نفس الوظيفة مسبقاً', false);
      } else {
        u.toast('تعذّر حفظ الطلب: ' + err.message, false);
      }
      btn.disabled = false;
    }
  }

  /* ─────────── أعلى وظيفة من حيث الرتبة ─────────── */
  async function showTop() {
    var open = await JobsSite.db.jobs.open();
    if (!open.length) { u.toast('لا توجد وظائف مفتوحة حالياً', false); return; }
    var top = open.reduce(function (a, b) { return a.rank_id <= b.rank_id ? a : b; });
    JobsSite.router.go('/job/' + top.id);
  }

  /* ─────────── الربط بالأحداث ─────────── */
  function bind() {
    gridEl = u.qs('#jobsGrid');
    detailEl = u.qs('#jobDetailBox');
    filtersEl = u.qs('#jobsFilters');
    searchEl = u.qs('#searchQ');
    rankEl = u.qs('#rankF');

    searchEl.addEventListener('input', renderList);
    rankEl.addEventListener('change', renderList);
    u.qs('#btnTop').addEventListener('click', showTop);

    gridEl.addEventListener('click', function (e) {
      var card = e.target.closest('.jcard[data-job-id]');
      if (card) JobsSite.router.go('/job/' + card.dataset.jobId);
    });
    gridEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.jcard[data-job-id]');
      if (card) { e.preventDefault(); JobsSite.router.go('/job/' + card.dataset.jobId); }
    });

    detailEl.addEventListener('submit', function (e) {
      if (e.target && e.target.id === 'applyForm') {
        e.preventDefault();
        submitApply(Number(e.target.dataset.jobId));
      }
    });
  }

  JobsSite.views = JobsSite.views || {};
  JobsSite.views.jobs = {
    bind: bind,
    list: function () { filtersEl.style.display = 'flex'; return renderList(); },
    detail: renderDetail,
    showTop: showTop
  };
})(window);
