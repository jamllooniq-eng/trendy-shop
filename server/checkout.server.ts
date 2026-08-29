/**
 * Server-Side Order Processing & Integrations Engine
 * Handles Duplicate Protection, Order ID Generation,
 * Google Sheets Webhook, Telegram Bot Notification, and Meta CAPI
 */

import crypto from 'crypto';
import { normalizeIraqiPhone } from '../src/lib/phone';
import { IRAQ_GOVERNORATES } from '../src/lib/governorates';
import { OrderPayload, OrderResult } from '../src/types';
import { sendMetaCapiPurchase } from './meta.server';

// ---------------------------------------------------------------------------
// ⚠️ ملاحظة معمارية هامة بخصوص حماية الطلبات المكررة (In-Memory Duplicate Protection)
// - هذا السجل محلي بالكامل ومخزّن داخل ذاكرة الرام (In-Memory Map) لنسخة Node.js الحالية.
// - يُصفَّر بالكامل عند أي إعادة تشغيل للسيرفر (Redeploy، Crash، أو Server Restart).
// - غير موثوق بالكامل في حال تشغيل أكثر من نسخة سيرفر بالتوازي (Horizontal Scaling / Multi-instance):
//   إذا قام العميل بالنقر مرتين وقام الـ Load Balancer بتوزيع الطلبين على نسختين مختلفتين من السيرفر،
//   قد يمر الطلبان معاً كطلبين منفصلين لأن كل نسخة تملك ذاكرتها المستقلة.
// - لحماية متقدمة ومطلقة عبر خوادم متعددة مستقبلاً، يجب استخدام قفل موزع (Distributed Lock) عبر Redis مع فترات TTL.
// ---------------------------------------------------------------------------
// In-memory duplicate protection: Map<"phone_itemId", timestamp>
export const recentOrders = new Map<string, number>();
export const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-8);
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${randomHex}`;
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send order data to Google Sheets with 4 retries (0ms, 150ms, 300ms, 600ms)
 */
export async function sendToGoogleSheetsWithRetry(orderData: Record<string, any>): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return true;

  const retryDelays = [0, 150, 300, 600];

  for (let attempt = 0; attempt < retryDelays.length; attempt++) {
    try {
      await wait(retryDelays[attempt]);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(webhookUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      clearTimeout(timeout);

      if (res.ok) return true;
    } catch {
      // Continue to next retry attempt
    }
  }

  console.error('Google Sheets notification failed after retries.');
  return false;
}

/**
 * Send Telegram notification with 4 retries (0ms, 150ms, 300ms, 600ms)
 */
export async function sendToTelegramWithRetry(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return true;

  const retryDelays = [0, 150, 300, 600];

  for (let attempt = 0; attempt < retryDelays.length; attempt++) {
    try {
      await wait(retryDelays[attempt]);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      clearTimeout(timeout);

      if (res.ok) return true;
    } catch {
      // Continue to next retry attempt
    }
  }

  console.error('Telegram notification failed after retries.');
  return false;
}

/**
 * Send Emergency Failure Alert to Telegram if primary order recording fails
 */
export async function sendFailureAlert(params: {
  orderId: string;
  name: string;
  phone: string;
  governorate: string;
  address: string;
  itemId: string | number;
  reason: string;
}): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const alertMessage = `🚨 تنبيه: فشل تسجيل طلب تلقائياً

رقم الطلب: ${params.orderId}
الاسم: ${params.name}
الهاتف: ${params.phone}
المحافظة: ${params.governorate}
العنوان: ${params.address}
المنتج: #${params.itemId}
السبب: ${params.reason}

⚠️ يرجى المتابعة اليدوية مع الزبون فوراً.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: alertMessage,
      }),
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error('Failed to send emergency failure alert to Telegram:', err);
  }
}

export async function processOrder(
  payload: OrderPayload,
  clientMeta: { clientIp?: string; userAgent?: string } = {}
): Promise<OrderResult> {
  // 1. Server-side validation
  const name = String(payload.cus_name || '').trim();
  if (name.length < 2) {
    return { success: false, error: 'يرجى إدخال الاسم الكامل (حرفين على الأقل)' };
  }

  const phoneCheck = normalizeIraqiPhone(payload.cus_num1 || '');
  if (!phoneCheck.isValid) {
    return { success: false, error: phoneCheck.error || 'رقم الهاتف غير صحيح' };
  }

  const normalizedPhone = phoneCheck.normalized;
  const governorate = String(payload.capetel || '').trim();
  if (!IRAQ_GOVERNORATES.includes(governorate as any)) {
    return { success: false, error: 'يرجى اختيار المحافظة من القائمة المعتمدة' };
  }

  const address = String(payload.address || '').trim();
  if (address.length < 3) {
    return { success: false, error: 'يرجى كتابة العنوان التفصيلي (المنطقة / أقرب نقطة دالة)' };
  }

  const count = Math.max(1, Math.min(50, Math.floor(Number(payload.count || 1))));
  const unitPrice = Math.max(0, Number(payload.unit_price || 0));
  const expectedTotal = unitPrice * count;
  const itemId = String(payload.item_id || '').trim();
  const productName = String(payload.product_name || 'منتج برستيل').trim();
  const notes = String(payload.note || '').trim();

  // 2. Duplicate Check within 5 minutes
  const duplicateKey = `${normalizedPhone}_${itemId}`;
  const now = Date.now();
  const lastOrderedTime = recentOrders.get(duplicateKey);

  if (lastOrderedTime && (now - lastOrderedTime < DUPLICATE_WINDOW_MS)) {
    return {
      success: false,
      duplicate: true,
      error: 'تم استلام طلبك لهذا المنتج مسبقاً بنجاح! فريقنا يجهّز طلبك حالياً وسنتصل بك للتأكيد.',
    };
  }

  // Record order key for duplicate protection
  recentOrders.set(duplicateKey, now);

  // Clean old entries
  for (const [key, timestamp] of recentOrders.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW_MS) {
      recentOrders.delete(key);
    }
  }

  // 3. Use client-provided orderId or generate official Order ID
  const orderId = (payload.orderId && typeof payload.orderId === 'string' && payload.orderId.trim())
    ? payload.orderId.trim()
    : generateOrderId();

  // 4. Baghdad Time Formatted
  const baghdadTime = new Intl.DateTimeFormat('ar-IQ', {
    timeZone: 'Asia/Baghdad',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date());

  // 5. Non-blocking Background Integrations for Render/Express
  (async () => {
    // Google Sheets payload
    const sheetData = {
      orderId,
      productName,
      name,
      phone: normalizedPhone,
      governorate,
      address,
      productId: itemId,
      quantity: count,
      totalPrice: expectedTotal,
      notes: notes || 'بدون ملاحظات',
      createdAt: baghdadTime,
    };

    // Telegram formatted message (simplified, order-facing layout)
    const telegramMsg = `📦 المنتج: ${productName}

الاسم: ${name}

الهاتف: ${normalizedPhone}

المحافظة: ${governorate}

العنوان: ${address}

العدد: ${count}

المبلغ الإجمالي: ${expectedTotal.toLocaleString('en-US')} د.ع`;

    const productPageUrl = `${(process.env.APP_URL || 'https://presteel-iq.com').replace(/\/+$/, '')}/product/${itemId}`;

    const [sheetsSuccess, telegramSuccess] = await Promise.all([
      sendToGoogleSheetsWithRetry(sheetData),
      sendToTelegramWithRetry(telegramMsg),
      sendMetaCapiPurchase({
        eventName: 'Purchase',
        eventId: orderId,
        orderId,
        productName,
        productId: itemId,
        totalPriceIqd: expectedTotal,
        count,
        customerName: name,
        phone: normalizedPhone,
        governorate,
        clientIp: clientMeta.clientIp,
        userAgent: clientMeta.userAgent,
        fbc: payload.fbc,
        fbp: payload.fbp,
        sourceUrl: productPageUrl,
      }).catch(() => false),
    ]);

    if (!sheetsSuccess || !telegramSuccess) {
      await sendFailureAlert({
        orderId,
        name,
        phone: normalizedPhone,
        governorate,
        address,
        itemId,
        reason: `فشل الإرسال إلى (${!sheetsSuccess ? 'Google Sheets ' : ''}${!telegramSuccess ? 'Telegram' : ''}) بعد 4 محاولات`,
      });
    }
  })();

  return {
    success: true,
    orderId,
    message: 'تم استلام طلبك بنجاح وسنتواصل معك لتأكيد التوصيل',
  };
}
