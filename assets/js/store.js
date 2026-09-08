/* ============================================================
   store.js — طبقة البيانات (localStorage)
   كل عمليات القراءة والكتابة تمر من هنا.
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};
  var CONFIG = JobsSite.CONFIG;

  /* ── توفّر localStorage (بعض المتصفحات تمنعه في التصفح الخاص) ── */
  var storage = (function () {
    try {
      var k = '__t__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return global.localStorage;
    } catch (e) {
      return null;   /* الوضع الآمن: يعمل الموقع بدون حفظ */
    }
  })();

  var DB = null;

  /* ── تنظيف/تصحيح البيانات القادمة من المتصفح ── */
  function normalizeJob(j) {
    return {
      id: Number(j.id) || 0,
      rank: JobsSite.RANKS[j.rank] ? Number(j.rank) : 5,
      title: String(j.title || 'بدون عنوان'),
      dept: String(j.dept || '—'),
      loc: String(j.loc || '—'),
      type: String(j.type || '—'),
      salary: String(j.salary || ''),
      deadline: String(j.deadline || ''),
      desc: String(j.desc || ''),
      req: String(j.req || ''),
      active: j.active === 1 || j.active === '1' ? 1 : 0
    };
  }

  function normalizeRecord(r) {
    return {
      id: Number(r.id) || 0,
      jobId: Number(r.jobId) || 0,
      name: String(r.name || '—'),
      phone: String(r.phone || ''),
      email: String(r.email || ''),
      notes: String(r.notes || '').slice(0, CONFIG.maxNotesLength),
      status: JobsSite.STATUSES.indexOf(r.status) > -1 ? r.status : 'جديد',
      time: String(r.time || JobsSite.utils.nowStamp())
    };
  }

  function normalize(db) {
    var jobs = Array.isArray(db && db.jobs) ? db.jobs.map(normalizeJob).filter(function (j) { return j.id > 0; }) : null;
    var records = Array.isArray(db && db.records) ? db.records.map(normalizeRecord).filter(function (r) { return r.id > 0; }) : null;
    if (!jobs) return null;
    return { jobs: jobs, records: records || [] };
  }

  function load() {
    if (storage) {
      try {
        var raw = storage.getItem(CONFIG.storageKey);
        if (raw) {
          var parsed = normalize(JSON.parse(raw));
          if (parsed) return parsed;
        }
      } catch (e) { /* بيانات تالفة → نرجع للبيانات الابتدائية */ }
    }
    return normalize(JSON.parse(JSON.stringify(JobsSite.SEED))) || { jobs: [], records: [] };
  }

  function save() {
    if (!storage) {
      JobsSite.utils.toast('⚠️ التخزين معطّل في هذا المتصفح — لن تُحفظ البيانات', false);
      return false;
    }
    try {
      storage.setItem(CONFIG.storageKey, JSON.stringify(DB));
      return true;
    } catch (e) {
      JobsSite.utils.toast('⚠️ تعذّر الحفظ: مساحة التخزين ممتلئة', false);
      return false;
    }
  }

  function nextId(list) {
    return list.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1;
  }

  /* ── الوظائف ── */
  function allJobs() { return DB.jobs.slice().sort(function (a, b) { return a.rank - b.rank || a.id - b.id; }); }
  function jobById(id) {
    for (var i = 0; i < DB.jobs.length; i++) { if (DB.jobs[i].id === Number(id)) return DB.jobs[i]; }
    return null;
  }
  /* مفتوحة = مفعّلة ولم يتجاوز آخر موعد */
  function isOpen(job) {
    if (!job || job.active !== 1) return false;
    var d = JobsSite.utils.daysLeft(job.deadline);
    return d === null || d >= 0;
  }
  function openJobs() { return allJobs().filter(isOpen); }

  /* ── السجلات ── */
  function allRecords() { return DB.records.slice().sort(function (a, b) { return b.id - a.id; }); }
  function recordById(id) {
    for (var i = 0; i < DB.records.length; i++) { if (DB.records[i].id === Number(id)) return DB.records[i]; }
    return null;
  }

  function addRecord(data) {
    var rec = normalizeRecord({
      id: nextId(DB.records),
      jobId: data.jobId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      status: 'جديد',
      time: JobsSite.utils.nowStamp()
    });
    DB.records.unshift(rec);
    save();
    return rec;
  }

  function hasDuplicate(jobId, phone) {
    var p = JobsSite.utils.normalizePhone(phone);
    return DB.records.some(function (r) {
      return r.jobId === Number(jobId) && JobsSite.utils.normalizePhone(r.phone) === p;
    });
  }

  function setStatus(id, status) {
    var r = recordById(id);
    if (!r || JobsSite.STATUSES.indexOf(status) < 0) return false;
    r.status = status;
    save();
    return true;
  }

  function deleteRecord(id) {
    var r = recordById(id);
    if (!r) return false;
    DB.records = DB.records.filter(function (x) { return x.id !== Number(id); });
    save();
    return true;
  }

  /* ── إحصاءات ── */
  function stats() {
    var recs = DB.records;
    return {
      openJobs: openJobs().length,
      rank1: openJobs().filter(function (j) { return j.rank === 1; }).length,
      records: recs.length,
      newRecords: recs.filter(function (r) { return r.status === 'جديد'; }).length,
      okRecords: recs.filter(function (r) { return r.status === 'مقبول'; }).length,
      noRecords: recs.filter(function (r) { return r.status === 'مرفوض'; }).length
    };
  }

  /* ── تصدير CSV ── */
  function exportCSV() {
    var u = JobsSite.utils;
    var rows = [['#', 'الاسم', 'الهاتف', 'البريد', 'الوظيفة', 'الرتبة', 'الحالة', 'التاريخ', 'ملاحظات']];
    allRecords().forEach(function (r) {
      var j = jobById(r.jobId) || {};
      rows.push([
        r.id, r.name, r.phone, r.email, j.title || '',
        (JobsSite.RANKS[j.rank] || {}).short || '', r.status, r.time, r.notes
      ]);
    });
    var csv = '﻿' + rows.map(function (row) {
      return row.map(u.csvCell).join(',');
    }).join('\r\n');

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'سجلات-المتقدمين.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return rows.length - 1;
  }

  /* ── استعادة البيانات الابتدائية ── */
  function reset() {
    DB = normalize(JSON.parse(JSON.stringify(JobsSite.SEED)));
    save();
  }

  DB = load();

  JobsSite.store = {
    get db() { return DB; },
    isPersistent: !!storage,
    isOpen: isOpen,
    allJobs: allJobs, openJobs: openJobs, jobById: jobById,
    allRecords: allRecords, recordById: recordById,
    addRecord: addRecord, hasDuplicate: hasDuplicate,
    setStatus: setStatus, deleteRecord: deleteRecord,
    stats: stats, exportCSV: exportCSV, reset: reset, save: save
  };
})(window);
