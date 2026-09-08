/* ============================================================
   db/database.js — محرّك قاعدة البيانات + المستودعات (Repositories)
   - يطبّق المخطط (schema.js) على الصفوف: أنواع، قيم افتراضية، فهارس، قيود
   - يشغّل الترحيلات (migrations) عند الحاجة
   - يعرض واجهة موحّدة للمستودعات تعمل محلياً أو عبر سيرفر
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite;
  var CONFIG = JobsSite.CONFIG;
  var schema = JobsSite.schema;
  var u = JobsSite.utils;

  var state = { schema_version: schema.version, tables: {} };
  var adapter = null;
  var cache = { ranks: {}, statuses: {} };

  /* ══════════ أدوات المخطط ══════════ */
  function coerceValue(type, v) {
    if (v === null || v === undefined || v === '') {
      return { int: null, bool: 0, string: '', text: '', date: '', datetime: '', json: null }[type];
    }
    switch (type) {
      case 'int':      { var n = Number(v); return isNaN(n) ? null : Math.trunc(n); }
      case 'bool':     return (v === 1 || v === '1' || v === true || v === 'true') ? 1 : 0;
      case 'date':     return String(v).slice(0, 10);
      case 'datetime': return String(v).slice(0, 16);
      case 'json':     return typeof v === 'object' ? v : v;
      default:         return String(v);
    }
  }

  /* يطبّق تعريف الجدول على صف: يصحّح الأنواع، يحط القيم الافتراضية، يحذف الأعمدة الغريبة */
  function coerceRow(table, row) {
    var cols = schema.columns(table), out = {};
    Object.keys(cols).forEach(function (name) {
      var def = cols[name];
      var v = row[name];
      if ((v === undefined || v === null || v === '') && def.default !== undefined) v = def.default;
      out[name] = coerceValue(def.type, v);
      if (def.required && (out[name] === null || out[name] === '')) {
        if (def.type === 'int') out[name] = 0;
      }
    });
    return out;
  }

  function rows(table) { return state.tables[table] || (state.tables[table] = []); }
  function nextId(table) {
    return rows(table).reduce(function (m, r) { return Math.max(m, Number(r.id) || 0); }, 0) + 1;
  }
  function findRow(table, id) {
    var list = rows(table);
    for (var i = 0; i < list.length; i++) { if (Number(list[i].id) === Number(id)) return list[i]; }
    return null;
  }
  function persist() { return adapter.remote ? Promise.resolve(true) : adapter.save(state); }

  /* ══════════ الترحيلات (Migrations) ══════════ */
  var MIGRATIONS = {
    /* 1 → 2: تحويل البيانات القديمة (ملف HTML واحد) إلى الجداول الجديدة */
    1: {
      up: function (legacy) {
        var statusByName = {};
        rows('statuses').forEach(function (s) { statusByName[s.name] = s.id; });

        var jobs = (legacy.jobs || []).map(function (j) {
          return coerceRow('jobs', {
            id: j.id, rank_id: j.rank, title: j.title, dept: j.dept,
            location: j.loc, employment_type: j.type, salary_text: j.salary,
            deadline: j.deadline, description: j.desc, requirements: j.req,
            is_active: j.active, created_at: j.time || u.nowStamp(), updated_at: u.nowStamp()
          });
        });
        var applicants = (legacy.records || []).map(function (r) {
          return coerceRow('applicants', {
            id: r.id, job_id: r.jobId, full_name: r.name, phone: r.phone,
            email: r.email, notes: r.notes,
            status_id: statusByName[r.status] || 1,
            applied_at: r.time, updated_at: r.time
          });
        });
        state.tables.jobs = jobs;
        state.tables.applicants = applicants;
        state.schema_version = 2;
        return state;
      }
    }
  };

  function runMigrations(loaded) {
    var v = loaded && loaded.schema_version ? Number(loaded.schema_version) : 0;
    while (v < schema.version) {
      var m = MIGRATIONS[v];
      if (m) m.up(loaded || {});
      v = (v || 0) + 1;
      state.schema_version = v;
    }
  }

  /* يستورد بيانات النسخة القديمة من localStorage إن وُجدت */
  function importLegacy() {
    try {
      var raw = global.localStorage.getItem(CONFIG.legacyStorageKey);
      if (!raw) return false;
      var legacy = JSON.parse(raw);
      if (!legacy || !legacy.jobs) return false;
      MIGRATIONS[1].up(legacy);
      global.localStorage.removeItem(CONFIG.legacyStorageKey);
      return true;
    } catch (e) { return false; }
  }

  /* ══════════ محرّك الاستعلام المحلي ══════════ */
  function localJobsQuery(params) {
    params = params || {};
    var q = (params.q || '').trim().toLowerCase();
    var list = rows('jobs').filter(function (j) {
      if (params.rank_id && Number(j.rank_id) !== Number(params.rank_id)) return false;
      if (params.active === true || params.active === 1 || params.active === '1') {
        if (!isOpen(j)) return false;
      }
      if (params.active === false || params.active === 0 || params.active === '0') {
        if (isOpen(j)) return false;
      }
      if (q) {
        var hay = (j.title + ' ' + j.dept + ' ' + j.location + ' ' + j.employment_type + ' ' + j.description).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (params.salary_min !== undefined && params.salary_min !== null) {
        if (j.salary_max === null || j.salary_max < Number(params.salary_min)) return false;
      }
      return true;
    });

    list.sort(function (a, b) {
      return (a.rank_id - b.rank_id) || (a.id - b.id);
    });
    return list;
  }

  function localApplicantsQuery(params) {
    params = params || {};
    var q = (params.q || '').trim().toLowerCase();
    var list = rows('applicants').filter(function (a) {
      if (params.job_id && Number(a.job_id) !== Number(params.job_id)) return false;
      if (params.status_id && Number(a.status_id) !== Number(params.status_id)) return false;
      if (params.rank_id) {
        var j = findRow('jobs', a.job_id);
        if (!j || Number(j.rank_id) !== Number(params.rank_id)) return false;
      }
      if (q) {
        var hay = (a.full_name + ' ' + (a.phone || '') + ' ' + (a.email || '') + ' ' + (a.notes || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (params.order === 'oldest') return a.id - b.id;
      return b.id - a.id;
    });
    return list;
  }

  function paginate(list, params) {
    var p = params || {};
    var offset = Number(p.offset || 0);
    var limit = p.limit === 0 ? list.length : Number(p.limit || CONFIG.pageSize);
    return list.slice(offset, offset + limit);
  }

  /* ══════════ الربط (Join) ══════════ */
  function hydrateJob(j) {
    if (!j) return null;
    j.rank = ranksGet(j.rank_id);
    j.is_open = isOpen(j);
    j.applicants_count = rows('applicants').filter(function (a) { return Number(a.job_id) === Number(j.id); }).length;
    return j;
  }
  function hydrateApplicant(a) {
    if (!a) return null;
    a.job = findRow('jobs', a.job_id);
    if (a.job) a.job.rank = ranksGet(a.job.rank_id);
    a.status = statusesGet(a.status_id);
    return a;
  }

  function isOpen(job) {
    if (!job || Number(job.is_active) !== 1) return false;
    var d = u.daysLeft(job.deadline);
    return d === null || d >= 0;
  }

  function ranksGet(id) { return cache.ranks[id] || CONFIG_FALLBACK_RANK(id); }
  function statusesGet(id) { return cache.statuses[id] || CONFIG_FALLBACK_STATUS(id); }
  function CONFIG_FALLBACK_RANK(id) {
    var f = JobsSite.FALLBACK_RANKS[id] || JobsSite.FALLBACK_RANKS[5];
    return { id: Number(id), name: f.name, short: f.short, css_class: f.cls, level: f.level };
  }
  function CONFIG_FALLBACK_STATUS(id) {
    var f = JobsSite.FALLBACK_STATUSES.filter(function (s) { return s.id === Number(id); })[0] || JobsSite.FALLBACK_STATUSES[0];
    return { id: f.id, name: f.name, slug: f.slug, css_class: f.cls, sort_order: f.id };
  }
  function rebuildCaches() {
    cache.ranks = {}; cache.statuses = {};
    rows('ranks').forEach(function (r) { cache.ranks[r.id] = r; });
    rows('statuses').forEach(function (s) { cache.statuses[s.id] = s; });
  }

  /* ══════════ المستودعات ══════════ */
  var Jobs = {
    /* قائمة مع فلترة — params: {q, rank_id, active, limit, offset} */
    query: async function (params) {
      if (adapter.remote) {
        var remote = await adapter.read('jobs', params);
        return (remote || []).map(function (j) { return hydrateJob(j); });
      }
      return localJobsQuery(params).map(hydrateJob);
    },
    all: function () { return Jobs.query({ limit: 0 }); },
    find: async function (id) {
      if (adapter.remote) return hydrateJob(await adapter.row('jobs', id));
      return hydrateJob(findRow('jobs', id));
    },
    open: function () { return Jobs.query({ active: true, limit: 0 }); },
    create: async function (data) {
      var row = coerceRow('jobs', Object.assign({ id: nextId('jobs'), created_at: u.nowStamp(), updated_at: u.nowStamp() }, data));
      if (adapter.remote) return hydrateJob(await adapter.insert('jobs', row));
      rows('jobs').push(row); await persist(); return hydrateJob(row);
    },
    update: async function (id, patch) {
      patch.updated_at = u.nowStamp();
      if (adapter.remote) return hydrateJob(await adapter.update('jobs', id, patch));
      var row = findRow('jobs', id);
      if (!row) throw new Error('الوظيفة غير موجودة');
      Object.assign(row, coerceRow('jobs', Object.assign({}, row, patch)));
      await persist();
      return hydrateJob(row);
    },
    remove: async function (id) {
      if (adapter.remote) { await adapter.remove('jobs', id); return true; }
      state.tables.jobs = rows('jobs').filter(function (r) { return Number(r.id) !== Number(id); });
      /* حذف السجلات المرتبطة (Cascade) */
      state.tables.applicants = rows('applicants').filter(function (a) { return Number(a.job_id) !== Number(id); });
      await persist();
      return true;
    }
  };

  var Applicants = {
    /* params: {q, job_id, status_id, rank_id, order, limit, offset} */
    query: async function (params) {
      if (adapter.remote) {
        var remote = await adapter.read('applicants', params);
        return (remote || []).map(function (a) { return hydrateApplicant(a); });
      }
      return paginate(localApplicantsQuery(params).map(hydrateApplicant), params);
    },
    find: async function (id) {
      if (adapter.remote) return hydrateApplicant(await adapter.row('applicants', id));
      return hydrateApplicant(findRow('applicants', id));
    },

    /* إدراج سجل جديد مع احترام قيد (job_id + phone) الفريد */
    create: async function (data) {
      var row = coerceRow('applicants', Object.assign({
        id: nextId('applicants'), status_id: 1, applied_at: u.nowStamp(), updated_at: u.nowStamp()
      }, data));

      if (adapter.remote) {
        try { return hydrateApplicant(await adapter.insert('applicants', row)); }
        catch (e) { if (/DUPLICATE|duplicate|409/i.test(e.message)) throw new Error('DUPLICATE'); throw e; }
      }

      var phone = u.normalizePhone(row.phone);
      var dup = rows('applicants').some(function (a) {
        return Number(a.job_id) === Number(row.job_id) && u.normalizePhone(a.phone) === phone;
      });
      if (dup) throw new Error('DUPLICATE');

      rows('applicants').push(row);
      History.log(row.id, null, row.status_id, 'تقديم جديد');
      await persist();
      return hydrateApplicant(row);
    },

    setStatus: async function (id, statusId, by, note) {
      var newId = Number(statusId);
      if (adapter.remote) {
        return hydrateApplicant(await adapter.update('applicants', id, { status_id: newId }));
      }
      var row = findRow('applicants', id);
      if (!row) throw new Error('السجل غير موجود');
      var oldId = Number(row.status_id);
      if (oldId !== newId) {
        row.status_id = newId;
        row.updated_at = u.nowStamp();
        History.log(id, oldId, newId, note || '', by);
        await persist();
      }
      return hydrateApplicant(row);
    },

    remove: async function (id) {
      if (adapter.remote) { await adapter.remove('applicants', id); return true; }
      state.tables.applicants = rows('applicants').filter(function (a) { return Number(a.id) !== Number(id); });
      state.tables.status_history = rows('status_history').filter(function (h) { return Number(h.applicant_id) !== Number(id); });
      await persist();
      return true;
    },

    countByStatus: function () {
      var out = {};
      rows('statuses').forEach(function (s) { out[s.id] = 0; });
      rows('applicants').forEach(function (a) { out[a.status_id] = (out[a.status_id] || 0) + 1; });
      return out;
    }
  };

  var History = {
    log: function (applicantId, fromStatus, toStatus, note, by) {
      if (adapter.remote) return Promise.resolve(null);   /* السيرفر يسجّلها بنفسه */
      var row = coerceRow('status_history', {
        id: nextId('status_history'), applicant_id: applicantId,
        from_status_id: fromStatus, to_status_id: toStatus,
        changed_at: u.nowStamp(), changed_by: by || 'admin', note: note || ''
      });
      rows('status_history').push(row);
      return Promise.resolve(row);
    },
    forApplicant: function (id) {
      if (adapter.remote) return adapter.read('status_history', { applicant_id: id });
      return Promise.resolve(rows('status_history')
        .filter(function (h) { return Number(h.applicant_id) === Number(id); })
        .sort(function (a, b) { return b.id - a.id; })
        .map(decorate));
    },
    recent: function (limit) {
      if (adapter.remote) return adapter.read('status_history', { limit: limit || 10 });
      return Promise.resolve(rows('status_history')
        .slice()
        .sort(function (a, b) { return b.id - a.id; })
        .slice(0, limit || 10)
        .map(decorate));
    }
  };

  function decorate(h) {
    h.to_status = statusesGet(h.to_status_id);
    h.from_status = h.from_status_id ? statusesGet(h.from_status_id) : null;
    var a = findRow('applicants', h.applicant_id);
    h.applicant = a || null;
    h.applicant_name = a ? a.full_name : null;
    return h;
  };

  var Stats = {
    get: async function () {
      if (adapter.remote) return adapter.stats();
      var jobsList = rows('jobs');
      var byStatus = Applicants.countByStatus();
      var openList = jobsList.filter(isOpen);
      return {
        jobs_total: jobsList.length,
        jobs_open: openList.length,
        jobs_rank1: openList.filter(function (j) { return Number(j.rank_id) === 1; }).length,
        applicants_total: rows('applicants').length,
        applicants_new: byStatus[1] || 0,
        applicants_accepted: byStatus[4] || 0,
        applicants_rejected: byStatus[5] || 0,
        by_status: byStatus,
        by_rank: jobsList.reduce(function (acc, j) {
          var k = j.rank_id; acc[k] = (acc[k] || 0) + 1; return acc;
        }, {})
      };
    }
  };

  /* ══════════ التصدير ══════════ */
  function exportCSV(params) {
    if (adapter.remote) {
      global.open(adapter.exportUrl(params), '_blank');
      return Promise.resolve(-1);
    }
    return Applicants.query(Object.assign({ limit: 0 }, params || {})).then(function (list) {
      var head = ['#', 'الاسم', 'الهاتف', 'البريد', 'الوظيفة', 'الرتبة', 'الحالة', 'التاريخ', 'ملاحظات'];
      var lines = [head.join(',')];
      list.forEach(function (a) {
        lines.push([
          a.id, a.full_name, a.phone, a.email,
          a.job ? a.job.title : '', a.job && a.job.rank ? a.job.rank.short : '',
          a.status ? a.status.name : '', a.applied_at, a.notes
        ].map(u.csvCell).join(','));
      });
      return lines.length - 1;
    });
  }

  /* ══════════ التشغيل ══════════ */
  async function init() {
    /* dataSource: 'local' → محرّك المتصفح | 'api' → محرّك السيرفر */
    var adapterName = CONFIG.dataSource === 'api' ? 'http' : 'local';
    adapter = JobsSite.adapters[adapterName] || JobsSite.adapters.local;

    var loaded = null;
    try { loaded = await adapter.load(); } catch (e) { loaded = null; }

    if (loaded && loaded.tables) {
      state.tables = {};
      schema.tableNames.forEach(function (t) {
        state.tables[t] = (loaded.tables[t] || []).map(function (r) { return coerceRow(t, r); });
      });
      state.schema_version = Number(loaded.schema_version || 0);
      runMigrations(state);
    } else {
      /* أول تشغيل: تعبئة البيانات الابتدائية */
      schema.tableNames.forEach(function (t) {
        state.tables[t] = (JobsSite.SEED[t] || []).map(function (r) { return coerceRow(t, r); });
      });
      state.schema_version = schema.version;
      var imported = !adapter.remote && importLegacy();   /* استيراد بيانات النسخة القديمة */
      await persist();
      if (imported) u.toast('📦 تم استيراد بيانات النسخة السابقة إلى قاعدة البيانات');
    }

    rebuildCaches();
    return db;
  }

  async function reset() {
    schema.tableNames.forEach(function (t) {
      state.tables[t] = (JobsSite.SEED[t] || []).map(function (r) { return coerceRow(t, r); });
    });
    state.schema_version = schema.version;
    rebuildCaches();
    await persist();
  }

  var db = {
    init: init,
    reset: reset,
    login: function (username, password) {
      if (adapter.remote && adapter.login) return adapter.login(username, password);
      return Promise.reject(new Error('الدخول عبر السيرفر فقط — فعّل dataSource: "api"'));
    },
    logout: function () {
      if (adapter.remote && adapter.logout) return adapter.logout();
      return Promise.resolve(true);
    },
    isOpen: isOpen,
    exportCSV: exportCSV,
    stats: function () { return Stats.get(); },
    jobs: Jobs,
    applicants: Applicants,
    history: History,
    ranks: {
      all: async function () {
        if (adapter.remote) return adapter.read('ranks');
        return rows('ranks').slice().sort(function (a, b) { return a.level - b.level; });
      },
      get: function (id) { return Promise.resolve(ranksGet(id)); }
    },
    statuses: {
      all: async function () {
        if (adapter.remote) return adapter.read('statuses');
        return rows('statuses').slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
      },
      get: function (id) { return Promise.resolve(statusesGet(id)); }
    },
    users: {
      all: async function () { return adapter.remote ? adapter.read('users') : rows('users').slice(); },
      findByUsername: function (name) {
        return Promise.resolve(rows('users').filter(function (x) { return x.username === name; })[0] || null);
      }
    },
    settings: {
      get: function (key) {
        var row = rows('settings').filter(function (s) { return s.key === key; })[0];
        return Promise.resolve(row ? row.value : null);
      },
      set: async function (key, value) {
        var row = rows('settings').filter(function (s) { return s.key === key; })[0];
        if (row) row.value = value;
        else rows('settings').push({ key: key, value: value });
        await persist();
        return value;
      }
    },
    /* وصول متزامن (مخبّأ) للرتب والحالات — للاستخدام في العرض */
    rankOf: function (id) { return ranksGet(id); },
    statusOf: function (id) { return statusesGet(id); },

    /* للتشخيص والاختبار */
    get tables() { return state.tables; },
    meta: function () {
      return {
        source: adapter.name,
        remote: !!adapter.remote,
        persistent: !!adapter.isPersistent,
        schema_version: state.schema_version,
        migrations_applied: state.schema_version >= schema.version
      };
    },
    _state: state
  };

  JobsSite.db = db;
})(window);
