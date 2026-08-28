/**
 * Supabase Server-Side Client
 * مسؤول فقط عن إنشاء اتصال واحد (Singleton) بقاعدة بيانات Supabase.
 * يُستخدم من طرف السيرفر فقط (لا يُصدَّر أو يُستخدم بالمتصفح).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'متغيرات البيئة SUPABASE_URL و SUPABASE_ANON_KEY غير موجودة. تأكد من ضبطها في إعدادات الاستضافة.'
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      // السيرفر لا يحتاج جلسة مستخدم دائمة لقراءة/كتابة المنتجات
      persistSession: false,
      autoRefreshToken: false,
    },
    // بيئات Node.js التي لا تدعم WebSocket بشكل أصلي (Node < 22، مثل بعض
    // بيئات تشغيل Netlify Functions) تحتاج توفير تطبيق WebSocket صراحة،
    // وإلا يفشل إنشاء عميل Supabase فورًا بخطأ "native WebSocket not found"
    // حتى لو لم نستخدم ميزة Realtime إطلاقًا.
    realtime: {
      transport: WebSocket as any,
    },
  });

  return cachedClient;
}
