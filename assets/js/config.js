/* ============================================================
   config.js — إعدادات النظام
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};

  /* ── إعدادات عامة ── */
  var CONFIG = {
    company: 'شركة الرافدين',
    companySub: 'للاستثمار والخدمات',
    email: 'hr@alrafidain-iq.com',
    phone: '0780 123 4567',
    address: 'بغداد — المنصور، شارع 14 رمضان',

    /* ═══ مصدر البيانات ══════════════════════════════════════
       'local' → قاعدة بيانات محلية داخل المتصفح (localStorage)
       'api'   → سيرفر بايثون (شوف docs/API.md للعقد المطلوب)
       ══════════════════════════════════════════════════════ */
    dataSource: 'local',
    apiBaseUrl: '/api',
    apiTimeout: 15000,

    storageKey: 'rajd_db',              /* مفتاح قاعدة البيانات المحلية */
    legacyStorageKey: 'rajd_jobs_data', /* مفتاح النسخة القديمة (يُستورد تلقائياً) */

    /* ⚠️ تنبيه أمني: هذا الرمز يعمل داخل المتصفح فقط (واجهة تجريبية).
       أي شخص يفتح "فحص العنصر" يقدر يشوفه. في وضع 'api' لازم السيرفر
       هو اللي يتحقق من الصلاحية عبر جلسة (Session/JWT). */
    accessPin: '1234',

    dateLocale: 'ar-IQ',
    maxNotesLength: 500,
    pageSize: 50
  };

  /* ── بيانات احتياطية للرتب والحالات (تُستخدم قبل تشغيل قاعدة البيانات،
        وبعدها تصير جداول ranks / statuses هي المصدر الرسمي) ── */
  var RANKS = {
    1: { name: 'الرتبة الأولى — إدارة عليا',   short: 'ر1', cls: 'r1', level: 1 },
    2: { name: 'الرتبة الثانية — إدارة وسطى',  short: 'ر2', cls: 'r2', level: 2 },
    3: { name: 'الرتبة الثالثة — إشراف',       short: 'ر3', cls: 'r3', level: 3 },
    4: { name: 'الرتبة الرابعة — تنفيذي',      short: 'ر4', cls: 'r4', level: 4 },
    5: { name: 'الرتبة الخامسة — مبتدئ',       short: 'ر5', cls: 'r5', level: 5 }
  };

  var STATUSES = [
    { id: 1, name: 'جديد',          slug: 'new',       cls: 's-new' },
    { id: 2, name: 'قيد المراجعة',  slug: 'review',    cls: 's-rev' },
    { id: 3, name: 'تمت المقابلة',  slug: 'interview', cls: 's-int' },
    { id: 4, name: 'مقبول',         slug: 'accepted',  cls: 's-ok'  },
    { id: 5, name: 'مرفوض',         slug: 'rejected',  cls: 's-no'  }
  ];

  /* يسمح بتجاوز أي إعداد قبل تحميل السكربتات:
     <script>window.JOBSITE_CONFIG = { dataSource:'api', apiBaseUrl:'/api' }</script> */
  if (global.JOBSITE_CONFIG) Object.assign(CONFIG, global.JOBSITE_CONFIG);

  JobsSite.CONFIG = CONFIG;
  JobsSite.FALLBACK_RANKS = RANKS;
  JobsSite.FALLBACK_STATUSES = STATUSES;
})(window);
