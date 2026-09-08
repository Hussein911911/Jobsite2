/* ============================================================
   db/schema.js — تعريف الجداول والأعمدة والعلاقات والفهارس
   هذا الملف هو "المخطط" (Schema) الرسمي لقاعدة البيانات،
   وهو نفس المخطط المنفّذ في db/schema.sql على السيرفر.
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};

  /* إصدار المخطط — أي تغيير على الجداول يرفع الرقم ويُضاف ترحيل (migration) */
  var SCHEMA_VERSION = 2;

  /* ══════════════════════════════════════════════════════════
     الجداول
     type: int | string | text | bool | date | datetime | json
     ══════════════════════════════════════════════════════════ */
  var TABLES = {

    /* ── الرتب الوظيفية (جدول ثابت: 5 رتب) ── */
    ranks: {
      pk: 'id',
      columns: {
        id:        { type: 'int',    required: true },
        name:      { type: 'string', required: true },
        short:     { type: 'string', required: true },   /* ر1 .. ر5 */
        level:     { type: 'int',    default: 5 },       /* 1 = الأعلى */
        css_class: { type: 'string', default: 'r5' }
      }
    },

    /* ── حالات السجل (جدول ثابت: 5 حالات) ── */
    statuses: {
      pk: 'id',
      columns: {
        id:         { type: 'int',    required: true },
        name:       { type: 'string', required: true },  /* جديد، مقبول... */
        slug:       { type: 'string', required: true },  /* new, accepted.. */
        css_class:  { type: 'string', default: 's-new' },
        sort_order: { type: 'int',    default: 0 }
      }
    },

    /* ── الوظائف ── */
    jobs: {
      pk: 'id',
      columns: {
        id:               { type: 'int',    required: true },
        rank_id:          { type: 'int',    default: 5, refs: 'ranks.id' },
        title:            { type: 'string', required: true },
        dept:             { type: 'string', default: '—' },
        location:         { type: 'string', default: '—' },
        employment_type:  { type: 'string', default: '—' },
        salary_text:      { type: 'string', default: '' },
        salary_min:       { type: 'int',    default: null },
        salary_max:       { type: 'int',    default: null },
        deadline:         { type: 'date',   default: '' },   /* YYYY-MM-DD */
        description:      { type: 'text',   default: '' },
        requirements:     { type: 'text',   default: '' },
        is_active:        { type: 'bool',   default: 1 },
        created_at:       { type: 'datetime', default: '' },
        updated_at:       { type: 'datetime', default: '' }
      },
      indexes: ['rank_id', 'is_active', 'deadline'],
      order: ['rank_id', 'id']
    },

    /* ── المتقدمون (السجلات) ── */
    applicants: {
      pk: 'id',
      columns: {
        id:          { type: 'int',    required: true },
        job_id:      { type: 'int',    required: true, refs: 'jobs.id' },
        full_name:   { type: 'string', required: true },
        phone:       { type: 'string', required: true },
        email:       { type: 'string', default: '' },
        notes:       { type: 'text',   default: '' },
        status_id:   { type: 'int',    default: 1, refs: 'statuses.id' },
        applied_at:  { type: 'datetime', default: '' },
        updated_at:  { type: 'datetime', default: '' }
      },
      indexes: ['job_id', 'status_id', 'applied_at'],
      unique: [['job_id', 'phone']],       /* ← يمنع التقديم المكرر على نفس الوظيفة */
      order: ['-id']
    },

    /* ── سجل تغيّر الحالات (تدقيق / Audit trail) ── */
    status_history: {
      pk: 'id',
      columns: {
        id:             { type: 'int', required: true },
        applicant_id:   { type: 'int', required: true, refs: 'applicants.id' },
        from_status_id: { type: 'int', default: null, refs: 'statuses.id' },
        to_status_id:   { type: 'int', required: true, refs: 'statuses.id' },
        changed_at:     { type: 'datetime', default: '' },
        changed_by:     { type: 'string', default: 'admin' },
        note:           { type: 'text', default: '' }
      },
      indexes: ['applicant_id', 'changed_at'],
      order: ['-id']
    },

    /* ── مستخدمو لوحة الإدارة (للسيرفر فقط) ── */
    users: {
      pk: 'id',
      columns: {
        id:            { type: 'int', required: true },
        username:      { type: 'string', required: true, unique: true },
        password_hash: { type: 'string', default: '' },   /* bcrypt/argon2 على السيرفر */
        full_name:     { type: 'string', default: '' },
        role:          { type: 'string', default: 'admin' },
        created_at:    { type: 'datetime', default: '' },
        last_login_at: { type: 'datetime', default: '' }
      }
    },

    /* ── إعدادات الموقع (مفتاح/قيمة) ── */
    settings: {
      pk: 'key',
      columns: {
        key:   { type: 'string', required: true },
        value: { type: 'json',   default: null }
      }
    }
  };

  /* ── العلاقات (للتوثيق + للربط التلقائي join) ── */
  var RELATIONS = [
    { from: 'jobs.rank_id',          to: 'ranks.id',        type: 'many-to-one' },
    { from: 'applicants.job_id',     to: 'jobs.id',         type: 'many-to-one' },
    { from: 'applicants.status_id',  to: 'statuses.id',     type: 'many-to-one' },
    { from: 'status_history.applicant_id', to: 'applicants.id', type: 'many-to-one' },
    { from: 'status_history.to_status_id', to: 'statuses.id',   type: 'many-to-one' }
  ];

  JobsSite.schema = {
    version: SCHEMA_VERSION,
    tables: TABLES,
    relations: RELATIONS,
    tableNames: Object.keys(TABLES),
    columns: function (table) { return (TABLES[table] || {}).columns || {}; }
  };
})(window);
