-- ============================================================
-- إعداد قاعدة بيانات تريندي — نفّذ هذا الملف كاملاً مرة واحدة
-- بـ Supabase: SQL Editor → New query → الصق هذا الكود → Run
-- ============================================================

-- 1) جدول الحقول المخصصة لكل منتج (اللون، المقاس، ملاحظة...)
create table if not exists public.product_fields (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  field_name text not null,
  placeholder text,
  field_type text not null default 'text' check (field_type in ('text', 'select')),
  options text,
  required boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists product_fields_product_id_idx
  on public.product_fields (product_id);

-- ============================================================
-- 2) تفعيل Row Level Security على الجدولين
-- ============================================================
alter table public.products enable row level security;
alter table public.product_fields enable row level security;

-- ============================================================
-- 3) سياسات جدول products
-- ============================================================

-- القراءة العامة: أي زائر للموقع يقدر يشوف المنتجات المتاحة فقط
drop policy if exists "public_read_available_products" on public.products;
create policy "public_read_available_products"
  on public.products for select
  using (available = true);

-- المستخدم المسجّل دخول (إنت، عبر لوحة /admin) يقدر يشوف كل شي حتى غير المتاح
drop policy if exists "admin_read_all_products" on public.products;
create policy "admin_read_all_products"
  on public.products for select
  to authenticated
  using (true);

-- الإضافة، التعديل، الحذف: فقط للمستخدم المسجّل دخول
drop policy if exists "admin_insert_products" on public.products;
create policy "admin_insert_products"
  on public.products for insert
  to authenticated
  with check (true);

drop policy if exists "admin_update_products" on public.products;
create policy "admin_update_products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_delete_products" on public.products;
create policy "admin_delete_products"
  on public.products for delete
  to authenticated
  using (true);

-- ============================================================
-- 4) سياسات جدول product_fields
-- ============================================================

-- القراءة العامة: فورم الطلب بالموقع يحتاج يقرأ الحقول المخصصة لأي منتج متاح
drop policy if exists "public_read_product_fields" on public.product_fields;
create policy "public_read_product_fields"
  on public.product_fields for select
  using (true);

-- الإضافة، التعديل، الحذف: فقط للمستخدم المسجّل دخول
drop policy if exists "admin_insert_product_fields" on public.product_fields;
create policy "admin_insert_product_fields"
  on public.product_fields for insert
  to authenticated
  with check (true);

drop policy if exists "admin_update_product_fields" on public.product_fields;
create policy "admin_update_product_fields"
  on public.product_fields for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_delete_product_fields" on public.product_fields;
create policy "admin_delete_product_fields"
  on public.product_fields for delete
  to authenticated
  using (true);

-- ============================================================
-- تم! بعد تنفيذ هذا الملف، لازم تسوي أيضًا:
-- 1) Authentication → Users → Add user (إيميلك وكلمة سر) لتسجيل الدخول للوحة /admin
-- 2) Storage → تأكد Bucket اسمه product-images وخياره Public مفعّل
-- ============================================================
