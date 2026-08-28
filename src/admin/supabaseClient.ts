/**
 * Supabase Browser Client — للاستخدام داخل لوحة /admin فقط.
 * يستخدم متغيرات بيئة عامة (VITE_*) لأنها تُضمَّن داخل حزمة الجافاسكربت
 * التي يحمّلها المتصفح. مفتاح anon/publishable آمن للكشف بالمتصفح
 * (هذا هو الغرض منه)، بشرط أن تكون سياسات Row Level Security مفعّلة
 * وصحيحة على جداول قاعدة البيانات (راجع ملف supabase/schema.sql).
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    'لوحة التحكم غير مهيأة: يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env'
  );
}

export const supabase = createClient(url || '', key || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
