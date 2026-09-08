/* ============================================================
   db/seed.sql — تعبئة البيانات الابتدائية (بعد تنفيذ schema.sql)
   مولّد من assets/js/db/seed.js — نفس البيانات في الواجهة والسيرفر
   ============================================================ */

/* ── ranks ── */
INSERT OR IGNORE INTO ranks (id, name, short, level, css_class) VALUES (1, 'الرتبة الأولى — إدارة عليا', 'ر1', 1, 'r1');
INSERT OR IGNORE INTO ranks (id, name, short, level, css_class) VALUES (2, 'الرتبة الثانية — إدارة وسطى', 'ر2', 2, 'r2');
INSERT OR IGNORE INTO ranks (id, name, short, level, css_class) VALUES (3, 'الرتبة الثالثة — إشراف', 'ر3', 3, 'r3');
INSERT OR IGNORE INTO ranks (id, name, short, level, css_class) VALUES (4, 'الرتبة الرابعة — تنفيذي', 'ر4', 4, 'r4');
INSERT OR IGNORE INTO ranks (id, name, short, level, css_class) VALUES (5, 'الرتبة الخامسة — مبتدئ', 'ر5', 5, 'r5');

/* ── statuses ── */
INSERT OR IGNORE INTO statuses (id, name, slug, css_class, sort_order) VALUES (1, 'جديد', 'new', 's-new', 1);
INSERT OR IGNORE INTO statuses (id, name, slug, css_class, sort_order) VALUES (2, 'قيد المراجعة', 'review', 's-rev', 2);
INSERT OR IGNORE INTO statuses (id, name, slug, css_class, sort_order) VALUES (3, 'تمت المقابلة', 'interview', 's-int', 3);
INSERT OR IGNORE INTO statuses (id, name, slug, css_class, sort_order) VALUES (4, 'مقبول', 'accepted', 's-ok', 4);
INSERT OR IGNORE INTO statuses (id, name, slug, css_class, sort_order) VALUES (5, 'مرفوض', 'rejected', 's-no', 5);

/* ── jobs ── */
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (1, 1, 'مدير فرع بغداد', 'الإدارة العامة', 'بغداد', 'دوام كامل', '2,500,000 – 3,000,000 د.ع', 2500000, 3000000, '2026-10-05', 'إدارة فرع الشركة في بغداد بكل جوانبه: العمليات، المالية، والموارد البشرية، وتقديم التقارير للإدارة العليا.', 'خبرة 8 سنوات على الأقل بإدارة الفروع، شهادة إدارة أعمال، مهارات قيادة ممتازة.', 1, '2026-08-20 09:00', '2026-08-20 09:00');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (2, 2, 'مدير حسابات', 'المالية', 'بغداد', 'دوام كامل', '1,800,000 – 2,200,000 د.ع', 1800000, 2200000, '2026-09-30', 'قيادة قسم الحسابات، إعداد التقارير المالية الشهرية والسنوية، ومتابعة التدقيق الداخلي.', 'خريج محاسبة/إدارة مالية + 5 سنوات خبرة، شهادة CPA ميزة.', 1, '2026-08-20 09:00', '2026-08-20 09:00');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (3, 2, 'مدير مشتريات', 'المشتريات', 'بغداد', 'دوام كامل', '1,600,000 – 2,000,000 د.ع', 1600000, 2000000, '2026-10-10', 'إدارة توريدات الشركة والتفاوض مع الموردين وضبط جودة السلع المستلمة.', 'خبرة 5 سنوات بالمشتريات، معرفة بأسواق العراق، مهارات تفاوض.', 1, '2026-08-21 10:15', '2026-08-21 10:15');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (4, 3, 'مشرف مخازن', 'اللوجستيك', 'بغداد — التاجي', 'نوبات', '1,200,000 – 1,500,000 د.ع', 1200000, 1500000, '2026-09-28', 'إشراف على دوام المخازن وضبط الجرد الدوري وتنظيم حركة البضائع.', 'خبرة 3 سنوات، اجادة أنظمة المخازن، شهادة لوجستية ميزة.', 1, '2026-08-22 11:30', '2026-08-22 11:30');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (5, 3, 'مبرمج ويب أول', 'تقنية المعلومات', 'عن بُعد', 'دوام كامل', '1,500,000 – 2,000,000 د.ع', 1500000, 2000000, '2026-10-01', 'تطوير وصيانة أنظمة الشركة (بايثون/فلاسك) وقيادة تطوير الأنظمة الداخلية.', 'خبرة 4 سنوات + بايثون + Flask/Django + قاعدة بيانات + Git.', 1, '2026-08-23 08:45', '2026-08-23 08:45');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (6, 4, 'محاسب', 'المالية', 'بغداد — الكرادة', 'دوام كامل', '900,000 – 1,300,000 د.ع', 900000, 1300000, '2026-09-25', 'تسجيل القيود اليومية وإعداد الفواتير والمطالبات ومتابعة الذمم.', 'خريج محاسبة، خبرة سنتين، إجادة Excel.', 1, '2026-08-24 09:20', '2026-08-24 09:20');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (7, 4, 'مندوب مبيعات', 'المبيعات', 'بغداد', 'دوام كامل', '700,000 – 1,000,000 د.ع + عمولة', 700000, 1000000, '2026-09-27', 'تغطية عملاء الشركة وتحقيق أهداف المبيعات الشهرية وفتح أسواق جديدة.', 'رخصة قيادة، مهارات تواصل قوية، يفضل خبرة مبيعات.', 1, '2026-08-25 10:05', '2026-08-25 10:05');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (8, 4, 'سكرتير تنفيذي', 'الإدارة', 'بغداد — المنصور', 'دوام كامل', '800,000 – 1,000,000 د.ع', 800000, 1000000, '2026-10-08', 'إدارة مواعيد الإدارة والمراسلات وتنظيم الاجتماعات ومتابعة المهام.', 'إجادة Office، عربي/إنجليزي، تنظيم عالٍ ولباقة.', 1, '2026-08-26 12:00', '2026-08-26 12:00');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (9, 5, 'موظف استقبال', 'الاستقبال', 'بغداد', 'نوبات', '500,000 – 650,000 د.ع', 500000, 650000, '2026-09-24', 'استقبال المراجعين وتسجيل مواعيدهم وتوجيههم للأقسام المختصة.', 'مظهر لائق، مهارات تواصل، حاسوب أساسي.', 1, '2026-08-27 13:40', '2026-08-27 13:40');
INSERT OR IGNORE INTO jobs (id, rank_id, title, dept, location, employment_type, salary_text, salary_min, salary_max, deadline, description, requirements, is_active, created_at, updated_at) VALUES (10, 5, 'سائق', 'النقل', 'بغداد', 'دوام كامل', '450,000 – 600,000 د.ع', 450000, 600000, '2026-09-26', 'نقل موظفي الإدارة والمعاملات داخل بغداد والعناية بالمركبات.', 'رخصة سارية + معرفة بشوارع بغداد + التزام بالمواعيد.', 0, '2026-08-28 14:10', '2026-09-01 09:00');

/* ── applicants ── */
INSERT OR IGNORE INTO applicants (id, job_id, full_name, phone, email, notes, status_id, applied_at, updated_at) VALUES (1, 1, 'استبرق كريم', '07701234567', 'a@x.com', 'خبرة 9 سنوات إدارة فروع', 2, '2026-09-08 10:20', '2026-09-08 11:00');
INSERT OR IGNORE INTO applicants (id, job_id, full_name, phone, email, notes, status_id, applied_at, updated_at) VALUES (2, 6, 'علي إبراهيم', '07711223344', 'b@x.com', '', 1, '2026-09-08 11:05', '2026-09-08 11:05');
INSERT OR IGNORE INTO applicants (id, job_id, full_name, phone, email, notes, status_id, applied_at, updated_at) VALUES (3, 7, 'حيدر محمد', '07805556677', 'c@x.com', 'خبرة مبيعات 4 سنوات', 3, '2026-09-07 14:40', '2026-09-08 09:30');
INSERT OR IGNORE INTO applicants (id, job_id, full_name, phone, email, notes, status_id, applied_at, updated_at) VALUES (4, 9, 'زينب علي', '07714445566', 'd@x.com', '', 4, '2026-09-07 09:15', '2026-09-08 10:00');
INSERT OR IGNORE INTO applicants (id, job_id, full_name, phone, email, notes, status_id, applied_at, updated_at) VALUES (5, 10, 'سجاد حسين', '07719998877', '', 'رخصة 10 سنوات', 5, '2026-09-06 16:30', '2026-09-07 10:00');

/* ── status_history ── */
INSERT OR IGNORE INTO status_history (id, applicant_id, from_status_id, to_status_id, changed_at, changed_by, note) VALUES (1, 1, 1, 2, '2026-09-08 11:00', 'admin', 'المطابقة الأولية للشروط');
INSERT OR IGNORE INTO status_history (id, applicant_id, from_status_id, to_status_id, changed_at, changed_by, note) VALUES (2, 3, 1, 2, '2026-09-08 09:00', 'admin', '');
INSERT OR IGNORE INTO status_history (id, applicant_id, from_status_id, to_status_id, changed_at, changed_by, note) VALUES (3, 3, 2, 3, '2026-09-08 09:30', 'admin', 'تحديد موعد المقابلة');
INSERT OR IGNORE INTO status_history (id, applicant_id, from_status_id, to_status_id, changed_at, changed_by, note) VALUES (4, 4, 1, 4, '2026-09-08 10:00', 'admin', 'مطابق تماماً للشروط');
INSERT OR IGNORE INTO status_history (id, applicant_id, from_status_id, to_status_id, changed_at, changed_by, note) VALUES (5, 5, 1, 5, '2026-09-07 10:00', 'admin', 'الوظيفة مغلقة');

/* ── users ── */
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role, created_at, last_login_at) VALUES (1, 'admin', 'CHANGE_ME_ON_SERVER', 'مدير النظام', 'admin', '2026-08-20 09:00', '');

/* ── settings ── */
INSERT OR IGNORE INTO settings (key, value) VALUES ('site_name', 'شركة الرافدين');
INSERT OR IGNORE INTO settings (key, value) VALUES ('contact', '{"phone": "0780 123 4567", "email": "hr@alrafidain-iq.com", "address": "بغداد — المنصور، شارع 14 رمضان"}');
INSERT OR IGNORE INTO settings (key, value) VALUES ('applications_open', 1);

/* ⚠️ غيّر password_hash على السيرفر فوراً:
   UPDATE users SET password_hash = '<bcrypt hash>' WHERE username = 'admin'; */