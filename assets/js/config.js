/* ============================================================
   config.js — إعدادات النظام + الثوابت
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
    storageKey: 'rajd_jobs_data',
    /* ⚠️ تنبيه أمني: هذا الرمز يعمل داخل المتصفح فقط (واجهة تجريبية).
       أي شخص يفتح "فحص العنصر" يقدر يشوفه. للحماية الحقيقية لازم
       التحقق يتم على سيرفر (Backend) مع جلسة وكلمة مرور مشفّرة. */
    accessPin: '1234',
    dateLocale: 'ar-IQ',
    /* أطوار حالة السجل → تُستخدم للأيقونات والتصدير */
    maxNotesLength: 500
  };

  /* ── الرتب الوظيفية ── */
  var RANKS = {
    1: { name: 'الرتبة الأولى — إدارة عليا',  short: 'ر1', cls: 'r1' },
    2: { name: 'الرتبة الثانية — إدارة وسطى', short: 'ر2', cls: 'r2' },
    3: { name: 'الرتبة الثالثة — إشراف',      short: 'ر3', cls: 'r3' },
    4: { name: 'الرتبة الرابعة — تنفيذي',     short: 'ر4', cls: 'r4' },
    5: { name: 'الرتبة الخامسة — مبتدئ',      short: 'ر5', cls: 'r5' }
  };

  /* ── حالات السجل ── */
  var STATUSES = ['جديد', 'قيد المراجعة', 'تمت المقابلة', 'مقبول', 'مرفوض'];
  var STATUS_CLASS = {
    'جديد': 's-new',
    'قيد المراجعة': 's-rev',
    'تمت المقابلة': 's-int',
    'مقبول': 's-ok',
    'مرفوض': 's-no'
  };

  JobsSite.CONFIG = CONFIG;
  JobsSite.RANKS = RANKS;
  JobsSite.STATUSES = STATUSES;
  JobsSite.STATUS_CLASS = STATUS_CLASS;
})(window);
