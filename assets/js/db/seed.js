/* ============================================================
   db/seed.js — البيانات الابتدائية بصيغة "صفوف جداول"
   نفس هذه البيانات موجودة في db/seed.sql لتعبئتها على السيرفر.
   ============================================================ */
(function (global) {
  'use strict';
  var JobsSite = global.JobsSite = global.JobsSite || {};

  JobsSite.SEED = {

    /* ── الرتب ── */
    ranks: [
      { id: 1, name: 'الرتبة الأولى — إدارة عليا',  short: 'ر1', level: 1, css_class: 'r1' },
      { id: 2, name: 'الرتبة الثانية — إدارة وسطى', short: 'ر2', level: 2, css_class: 'r2' },
      { id: 3, name: 'الرتبة الثالثة — إشراف',      short: 'ر3', level: 3, css_class: 'r3' },
      { id: 4, name: 'الرتبة الرابعة — تنفيذي',     short: 'ر4', level: 4, css_class: 'r4' },
      { id: 5, name: 'الرتبة الخامسة — مبتدئ',      short: 'ر5', level: 5, css_class: 'r5' }
    ],

    /* ── الحالات ── */
    statuses: [
      { id: 1, name: 'جديد',         slug: 'new',       css_class: 's-new', sort_order: 1 },
      { id: 2, name: 'قيد المراجعة', slug: 'review',    css_class: 's-rev', sort_order: 2 },
      { id: 3, name: 'تمت المقابلة', slug: 'interview', css_class: 's-int', sort_order: 3 },
      { id: 4, name: 'مقبول',        slug: 'accepted',  css_class: 's-ok',  sort_order: 4 },
      { id: 5, name: 'مرفوض',        slug: 'rejected',  css_class: 's-no',  sort_order: 5 }
    ],

    /* ── الوظائف ── */
    jobs: [
      { id: 1, rank_id: 1, title: 'مدير فرع بغداد', dept: 'الإدارة العامة', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '2,500,000 – 3,000,000 د.ع', salary_min: 2500000, salary_max: 3000000, deadline: '2026-10-05', description: 'إدارة فرع الشركة في بغداد بكل جوانبه: العمليات، المالية، والموارد البشرية، وتقديم التقارير للإدارة العليا.', requirements: 'خبرة 8 سنوات على الأقل بإدارة الفروع، شهادة إدارة أعمال، مهارات قيادة ممتازة.', is_active: 1, created_at: '2026-08-20 09:00', updated_at: '2026-08-20 09:00' },
      { id: 2, rank_id: 2, title: 'مدير حسابات', dept: 'المالية', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '1,800,000 – 2,200,000 د.ع', salary_min: 1800000, salary_max: 2200000, deadline: '2026-09-30', description: 'قيادة قسم الحسابات، إعداد التقارير المالية الشهرية والسنوية، ومتابعة التدقيق الداخلي.', requirements: 'خريج محاسبة/إدارة مالية + 5 سنوات خبرة، شهادة CPA ميزة.', is_active: 1, created_at: '2026-08-20 09:00', updated_at: '2026-08-20 09:00' },
      { id: 3, rank_id: 2, title: 'مدير مشتريات', dept: 'المشتريات', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '1,600,000 – 2,000,000 د.ع', salary_min: 1600000, salary_max: 2000000, deadline: '2026-10-10', description: 'إدارة توريدات الشركة والتفاوض مع الموردين وضبط جودة السلع المستلمة.', requirements: 'خبرة 5 سنوات بالمشتريات، معرفة بأسواق العراق، مهارات تفاوض.', is_active: 1, created_at: '2026-08-21 10:15', updated_at: '2026-08-21 10:15' },
      { id: 4, rank_id: 3, title: 'مشرف مخازن', dept: 'اللوجستيك', location: 'بغداد — التاجي', employment_type: 'نوبات', salary_text: '1,200,000 – 1,500,000 د.ع', salary_min: 1200000, salary_max: 1500000, deadline: '2026-09-28', description: 'إشراف على دوام المخازن وضبط الجرد الدوري وتنظيم حركة البضائع.', requirements: 'خبرة 3 سنوات، اجادة أنظمة المخازن، شهادة لوجستية ميزة.', is_active: 1, created_at: '2026-08-22 11:30', updated_at: '2026-08-22 11:30' },
      { id: 5, rank_id: 3, title: 'مبرمج ويب أول', dept: 'تقنية المعلومات', location: 'عن بُعد', employment_type: 'دوام كامل', salary_text: '1,500,000 – 2,000,000 د.ع', salary_min: 1500000, salary_max: 2000000, deadline: '2026-10-01', description: 'تطوير وصيانة أنظمة الشركة (بايثون/فلاسك) وقيادة تطوير الأنظمة الداخلية.', requirements: 'خبرة 4 سنوات + بايثون + Flask/Django + قاعدة بيانات + Git.', is_active: 1, created_at: '2026-08-23 08:45', updated_at: '2026-08-23 08:45' },
      { id: 6, rank_id: 4, title: 'محاسب', dept: 'المالية', location: 'بغداد — الكرادة', employment_type: 'دوام كامل', salary_text: '900,000 – 1,300,000 د.ع', salary_min: 900000, salary_max: 1300000, deadline: '2026-09-25', description: 'تسجيل القيود اليومية وإعداد الفواتير والمطالبات ومتابعة الذمم.', requirements: 'خريج محاسبة، خبرة سنتين، إجادة Excel.', is_active: 1, created_at: '2026-08-24 09:20', updated_at: '2026-08-24 09:20' },
      { id: 7, rank_id: 4, title: 'مندوب مبيعات', dept: 'المبيعات', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '700,000 – 1,000,000 د.ع + عمولة', salary_min: 700000, salary_max: 1000000, deadline: '2026-09-27', description: 'تغطية عملاء الشركة وتحقيق أهداف المبيعات الشهرية وفتح أسواق جديدة.', requirements: 'رخصة قيادة، مهارات تواصل قوية، يفضل خبرة مبيعات.', is_active: 1, created_at: '2026-08-25 10:05', updated_at: '2026-08-25 10:05' },
      { id: 8, rank_id: 4, title: 'سكرتير تنفيذي', dept: 'الإدارة', location: 'بغداد — المنصور', employment_type: 'دوام كامل', salary_text: '800,000 – 1,000,000 د.ع', salary_min: 800000, salary_max: 1000000, deadline: '2026-10-08', description: 'إدارة مواعيد الإدارة والمراسلات وتنظيم الاجتماعات ومتابعة المهام.', requirements: 'إجادة Office، عربي/إنجليزي، تنظيم عالٍ ولباقة.', is_active: 1, created_at: '2026-08-26 12:00', updated_at: '2026-08-26 12:00' },
      { id: 9, rank_id: 5, title: 'موظف استقبال', dept: 'الاستقبال', location: 'بغداد', employment_type: 'نوبات', salary_text: '500,000 – 650,000 د.ع', salary_min: 500000, salary_max: 650000, deadline: '2026-09-24', description: 'استقبال المراجعين وتسجيل مواعيدهم وتوجيههم للأقسام المختصة.', requirements: 'مظهر لائق، مهارات تواصل، حاسوب أساسي.', is_active: 1, created_at: '2026-08-27 13:40', updated_at: '2026-08-27 13:40' },
      { id: 10, rank_id: 5, title: 'سائق', dept: 'النقل', location: 'بغداد', employment_type: 'دوام كامل', salary_text: '450,000 – 600,000 د.ع', salary_min: 450000, salary_max: 600000, deadline: '2026-09-26', description: 'نقل موظفي الإدارة والمعاملات داخل بغداد والعناية بالمركبات.', requirements: 'رخصة سارية + معرفة بشوارع بغداد + التزام بالمواعيد.', is_active: 0, created_at: '2026-08-28 14:10', updated_at: '2026-09-01 09:00' }
    ],

    /* ── المتقدمون ── */
    applicants: [
      { id: 1, job_id: 1,  full_name: 'استبرق كريم', phone: '07701234567', email: 'a@x.com', notes: 'خبرة 9 سنوات إدارة فروع', status_id: 2, applied_at: '2026-09-08 10:20', updated_at: '2026-09-08 11:00' },
      { id: 2, job_id: 6,  full_name: 'علي إبراهيم', phone: '07711223344', email: 'b@x.com', notes: '',                      status_id: 1, applied_at: '2026-09-08 11:05', updated_at: '2026-09-08 11:05' },
      { id: 3, job_id: 7,  full_name: 'حيدر محمد',   phone: '07805556677', email: 'c@x.com', notes: 'خبرة مبيعات 4 سنوات',   status_id: 3, applied_at: '2026-09-07 14:40', updated_at: '2026-09-08 09:30' },
      { id: 4, job_id: 9,  full_name: 'زينب علي',    phone: '07714445566', email: 'd@x.com', notes: '',                      status_id: 4, applied_at: '2026-09-07 09:15', updated_at: '2026-09-08 10:00' },
      { id: 5, job_id: 10, full_name: 'سجاد حسين',   phone: '07719998877', email: '',        notes: 'رخصة 10 سنوات',         status_id: 5, applied_at: '2026-09-06 16:30', updated_at: '2026-09-07 10:00' }
    ],

    /* ── سجل تغيّر الحالات ── */
    status_history: [
      { id: 1, applicant_id: 1, from_status_id: 1, to_status_id: 2, changed_at: '2026-09-08 11:00', changed_by: 'admin', note: 'المطابقة الأولية للشروط' },
      { id: 2, applicant_id: 3, from_status_id: 1, to_status_id: 2, changed_at: '2026-09-08 09:00', changed_by: 'admin', note: '' },
      { id: 3, applicant_id: 3, from_status_id: 2, to_status_id: 3, changed_at: '2026-09-08 09:30', changed_by: 'admin', note: 'تحديد موعد المقابلة' },
      { id: 4, applicant_id: 4, from_status_id: 1, to_status_id: 4, changed_at: '2026-09-08 10:00', changed_by: 'admin', note: 'مطابق تماماً للشروط' },
      { id: 5, applicant_id: 5, from_status_id: 1, to_status_id: 5, changed_at: '2026-09-07 10:00', changed_by: 'admin', note: 'الوظيفة مغلقة' }
    ],

    /* ── المستخدمون (للسيرفر فقط — البناء مكاني، والسيرفر هو من يتحقق) ── */
    users: [
      { id: 1, username: 'admin', password_hash: 'CHANGE_ME_ON_SERVER', full_name: 'مدير النظام', role: 'admin', created_at: '2026-08-20 09:00', last_login_at: '' }
    ],

    /* ── إعدادات ── */
    settings: [
      { key: 'site_name',    value: 'شركة الرافدين' },
      { key: 'contact',      value: { phone: '0780 123 4567', email: 'hr@alrafidain-iq.com', address: 'بغداد — المنصور، شارع 14 رمضان' } },
      { key: 'applications_open', value: true }
    ]
  };
})(window);
