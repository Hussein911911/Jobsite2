/* ============================================================
   db/adapters/local.js — محرّك التخزين المحلي (localStorage)
   يعمل بدون سيرفر، ويحفظ قاعدة البيانات كاملة على شكل JSON.
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};
  var CONFIG = JobsSite.CONFIG;

  var storage = (function () {
    try {
      var k = '__t__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return global.localStorage;
    } catch (e) { return null; }
  })();

  function readAll() {
    if (!storage) return null;
    try {
      var raw = storage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeAll(db) {
    if (!storage) return false;
    try { storage.setItem(CONFIG.storageKey, JSON.stringify(db)); return true; }
    catch (e) { return false; }
  }

  JobsSite.adapters = JobsSite.adapters || {};
  JobsSite.adapters.local = {
    name: 'local',
    remote: false,
    isPersistent: !!storage,

    /* ── الواجهة العامة (نفس واجهة adaptor السيرفر) ── */
    load: function () { return Promise.resolve(readAll()); },
    save: function (db) { return Promise.resolve(writeAll(db)); },

    read: function (table, params) { return Promise.resolve(JobsSite.db.tables[table] || []); },
    row: function (table, id) {
      var rows = JobsSite.db.tables[table] || [];
      return Promise.resolve(rows.filter(function (r) { return r.id === Number(id); })[0] || null);
    },
    insert: function (table, data) { return Promise.resolve(data); },
    update: function (table, id, patch) { return Promise.resolve(patch); },
    remove: function (table, id) { return Promise.resolve(true); },
    stats: function () { return Promise.resolve(null); },
    exportUrl: function () { return ''; }
  };
})(window);
