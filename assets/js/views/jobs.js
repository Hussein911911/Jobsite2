/* ============================================================
   views/jobs.js — صفحة الوظائف: القائمة + التفاصيل + نموذج التقديم
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var u = JobsSite.utils, store = JobsSite.store;

  var gridEl, detailEl, searchEl, rankEl, filtersEl;

  /* ─────────── القائمة ─────────── */
  function renderList() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var rf = rankEl.value;

    var list = store.allJobs().filter(function (j) {
      var okQ = !q || (j.title + ' ' + j.dept + ' ' + j.loc + ' ' + j.type).toLowerCase().indexOf(q) > -1;
      var okR = !rf || String(j.rank) === rf;
      return okQ && okR;
    });

    if (!list.length) {
      gridEl.innerHTML = '<div class="emptystate">لا توجد وظائف مطابقة — جرب فلتراً آخر 🙏</div>';
    } else {
      gridEl.innerHTML = list.map(cardHTML).join('');
    }

    detailEl.style.display = 'none';
    detailEl.innerHTML = '';
    gridEl.style.display = 'grid';
  }

  function cardHTML(j) {
    var open = store.isOpen(j);
    return '<article class="jcard" data-job-id="' + j.id + '" tabindex="0" role="button">' +
      '<div class="top">' + u.rankBadge(j.rank) +
        (open ? '' : '<span class="rbadge r5">مغلقة</span>') + '</div>' +
      '<h3>' + u.esc(j.title) + '</h3>' +
      '<div class="meta"><span>🏢 ' + u.esc(j.dept) + '</span><span>📍 ' + u.esc(j.loc) + '</span><span>🕐 ' + u.esc(j.type) + '</span></div>' +
      '<div class="salary">💰 ' + u.esc(j.salary || 'حسب الخبرة') + '</div>' +
      '<div class="foot">' +
        '<span class="muted">' + u.deadlineText(j.deadline) + '</span>' +
        (open
          ? '<span class="btn btn-gold btn-sm">سجّل الآن</span>'
          : '<span class="muted">انتهى التقديم</span>') +
      '</div>' +
    '</article>';
  }

  /* ─────────── التفاصيل + نموذج التقديم ─────────── */
  function renderDetail(id) {
    var j = store.jobById(id);
    if (!j) {
      u.toast('الوظيفة المطلوبة غير موجودة', false);
      JobsSite.router.go('/jobs');
      return;
    }
    var open = store.isOpen(j);

    gridEl.style.display = 'none';
    filtersEl.style.display = 'none';
    detailEl.style.display = 'block';
    detailEl.innerHTML =
      '<div class="detail">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">' +
          '<h1>💼 ' + u.esc(j.title) + '</h1>' + u.rankBadge(j.rank) +
        '</div>' +
        '<div class="dmeta">' +
          '<span>🏢 ' + u.esc(j.dept) + '</span><span>📍 ' + u.esc(j.loc) + '</span><span>🕐 ' + u.esc(j.type) + '</span>' +
          (j.salary ? '<span>💰 ' + u.esc(j.salary) + '</span>' : '') +
          '<span>' + u.deadlineText(j.deadline) + '</span>' +
        '</div>' +
        '<h4>📝 وصف الوظيفة</h4><p>' + u.esc(j.desc || '—') + '</p>' +
        '<h4>✅ الشروط المطلوبة</h4><p>' + u.esc(j.req || '—') + '</p>' +
        (open
          ? applyFormHTML(j)
          : '<div class="closed-note">🚫 التقديم على هذه الوظيفة مغلق حالياً</div>') +
        '<p style="margin-top:14px"><a href="#/jobs" style="color:var(--navy);font-size:13px;font-weight:700">← رجوع لكل الوظائف</a></p>' +
      '</div>';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = j.title + ' — ' + JobsSite.CONFIG.company;

    if (open) {
      var first = u.qs('#apName', detailEl);
      if (first) first.focus();
    }
  }

  function applyFormHTML(j) {
    return '<form class="apply" id="applyForm" data-job-id="' + j.id + '" novalidate>' +
      '<h3>📩 سجّل طلبك لهذه الوظيفة (يضاف إلى السجلات فوراً)</h3>' +
      '<div class="row">' +
        '<div><label for="apName">الاسم الكامل *</label>' +
          '<input id="apName" name="name" autocomplete="name" placeholder="مثال: أحمد علي">' +
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
        '<button type="submit" class="btn btn-navy">✅ تسجيل الطلب</button>' +
        '<span class="muted">* الحقول المطلوبة: الاسم ورقم الهاتف</span>' +
      '</div>' +
    '</form>';
  }

  /* ─────────── إرسال الطلب ─────────── */
  function submitApply(jobId) {
    var job = store.jobById(jobId);
    if (!job || !store.isOpen(job)) {
      u.toast('التقديم على هذه الوظيفة مغلق', false);
      return;
    }
    var form = u.qs('#applyForm', detailEl);
    var nameEl = u.qs('#apName', form), phoneEl = u.qs('#apPhone', form),
        emailEl = u.qs('#apEmail', form), notesEl = u.qs('#apNotes', form);

    var name = nameEl.value.trim(), phone = phoneEl.value.trim(),
        email = emailEl.value.trim(), notes = notesEl.value.trim();

    var ok = true;
    u.setFieldError(nameEl, '');
    u.setFieldError(phoneEl, '');
    u.setFieldError(emailEl, '');

    if (name.length < 3) { u.setFieldError(nameEl, 'الاسم مطلوب (٣ أحرف على الأقل)'); ok = false; }
    if (!u.isValidPhone(phone)) { u.setFieldError(phoneEl, 'رقم هاتف عراقي صحيح: 07xxxxxxxxxx'); ok = false; }
    if (!u.isValidEmail(email)) { u.setFieldError(emailEl, 'البريد الإلكتروني غير صحيح'); ok = false; }
    if (!ok) { u.toast('تحقق من الحقول المعلّمة بالأحمر', false); return; }

    if (store.hasDuplicate(jobId, phone)) {
      u.setFieldError(phoneEl, 'مسجّل مسبقاً على هذه الوظيفة');
      u.toast('هذا الرقم قدّم على نفس الوظيفة مسبقاً', false);
      return;
    }

    store.addRecord({ jobId: jobId, name: name, phone: phone, email: email, notes: notes });
    JobsSite.app.renderStats();
    u.toast('🎉 شكراً ' + name + '! تم تسجيل طلبك لـ«' + job.title + '» — أُضيف إلى السجلات');
    renderDetail(jobId);
  }

  /* ─────────── أعلى وظيفة من حيث الرتبة ─────────── */
  function showTop() {
    var open = store.openJobs();
    if (!open.length) { u.toast('لا توجد وظائف مفتوحة حالياً', false); return; }
    var top = open.reduce(function (a, b) { return a.rank <= b.rank ? a : b; });
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

    /* تفويض الأحداث داخل القائمة (كل البطاقة قابلة للنقر + Enter بلوحة المفاتيح) */
    gridEl.addEventListener('click', function (e) {
      var card = e.target.closest('.jcard[data-job-id]');
      if (card) JobsSite.router.go('/job/' + card.dataset.jobId);
    });
    gridEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.jcard[data-job-id]');
      if (card) { e.preventDefault(); JobsSite.router.go('/job/' + card.dataset.jobId); }
    });

    /* تفويض الأحداث داخل التفاصيل (النموذج يُبنى ديناميكياً) */
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
    list: function () { filtersEl.style.display = 'flex'; renderList(); },
    detail: renderDetail,
    showTop: showTop
  };
})(window);
