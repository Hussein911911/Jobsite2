/* ============================================================
   db/adapters/http.js — محرّك الاتصال بسيرفر بايثون (REST)
   مُعطّل افتراضياً. لتشغيله: CONFIG.dataSource = 'api'
   العقد الكامل لل endpoints موجود في docs/API.md
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};
  var CONFIG = JobsSite.CONFIG;

  /* أسماء الجداول → مسارات الـ API */
  var ROUTES = {
    jobs: 'jobs',
    applicants: 'applicants',
    ranks: 'ranks',
    statuses: 'statuses',
    status_history: 'history',
    users: 'users',
    settings: 'settings'
  };

  function url(path) { return CONFIG.apiBaseUrl.replace(/\/$/, '') + '/' + path; }

  function parseError(status, text) {
    var msg = 'خطأ من السيرفر: ' + status;
    try { var d = JSON.parse(text); msg = d.error || d.message || msg; } catch (e) { /* ليس JSON */ }
    return new Error(msg);
  }

  /* ── الطلب عبر fetch (إن توفّر) ── */
  function fetchRequest(method, path, body) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, CONFIG.apiTimeout) : null;

    return fetch(url(path), {
      method: method,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined,
      headers: body
        ? { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        : { 'Accept': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
      .then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw parseError(res.status, t); });
        if (res.status === 204) return null;
        return res.json();
      })
      .catch(function (err) {
        if (err.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بالسيرفر');
        if (err instanceof TypeError) throw new Error('تعذّر الوصول للسيرفر — تأكد أنه يعمل على ' + CONFIG.apiBaseUrl);
        throw err;
      })
      .then(function (r) { if (timer) clearTimeout(timer); return r; });
  }

  /* ── بديل عبر XMLHttpRequest (متصفحات قديمة أو بيئات بدون fetch) ── */
  function xhrRequest(method, path, body) {
    return new Promise(function (resolve, reject) {
      var x;
      try { x = new XMLHttpRequest(); }
      catch (e) { reject(new Error('المتصفح لا يدعم الاتصال بالسيرفر')); return; }

      x.open(method, url(path), true);
      x.timeout = CONFIG.apiTimeout;
      x.setRequestHeader('Accept', 'application/json');
      if (body) x.setRequestHeader('Content-Type', 'application/json');

      x.onload = function () {
        if (x.status >= 200 && x.status < 300) {
          if (x.status === 204 || !x.responseText) return resolve(null);
          try { resolve(JSON.parse(x.responseText)); }
          catch (e) { resolve(null); }
        } else {
          reject(parseError(x.status, x.responseText));
        }
      };
      x.onerror = function () { reject(new Error('تعذّر الوصول للسيرفر — تأكد أنه يعمل على ' + CONFIG.apiBaseUrl)); };
      x.ontimeout = function () { reject(new Error('انتهت مهلة الاتصال بالسيرفر')); };
      x.send(body ? JSON.stringify(body) : null);
    });
  }

  function request(method, path, body) {
    return (typeof fetch === 'function') ? fetchRequest(method, path, body) : xhrRequest(method, path, body);
  }

  function qs(params) {
    if (!params) return '';
    var parts = Object.keys(params)
      .filter(function (k) { return params[k] !== '' && params[k] !== null && params[k] !== undefined; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); });
    return parts.length ? '?' + parts.join('&') : '';
  }

  JobsSite.adapters = JobsSite.adapters || {};
  JobsSite.adapters.http = {
    name: 'http',
    remote: true,
    isPersistent: true,

    load: function () { return request('GET', 'bootstrap'); },   /* {schema_version, tables} */
    save: function () { return Promise.resolve(true); },         /* السيرفر يحفظ مباشرة */

    read: function (table, params) { return request('GET', ROUTES[table] + qs(params)); },
    row: function (table, id) { return request('GET', ROUTES[table] + '/' + id); },
    insert: function (table, data) { return request('POST', ROUTES[table], data); },
    update: function (table, id, patch) { return request('PATCH', ROUTES[table] + '/' + id, patch); },
    remove: function (table, id) { return request('DELETE', ROUTES[table] + '/' + id); },

    stats: function (params) { return request('GET', 'stats' + qs(params)); },
    login: function (username, password) { return request('POST', 'auth/login', { username: username, password: password }); },
    logout: function () { return request('POST', 'auth/logout'); },
    exportUrl: function (params) { return url('export.csv' + qs(params)); }
  };
})(window);
