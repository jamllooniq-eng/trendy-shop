import type { Handler } from '@netlify/functions';
import {
  sendToGoogleSheetsWithRetry,
  sendToTelegramWithRetry,
  sendFailureAlert,
} from '../../server/checkout.server';
import { sendMetaCapiPurchase } from '../../server/meta.server';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    let payload: any = {};
    if (event.body) {
      payload = JSON.parse(event.body);
    }

    const {
      orderId,
      name,
      phone,
      governorate,
      address,
      itemId,
      productName,
      quantity,
      totalPrice,
      notes,
      baghdadTime,
      fbc,
      fbp,
      clientIp,
      userAgent,
    } = payload;

    if (!orderId || !name || !phone) {
      console.error('Missing critical order fields in checkout-background:', payload);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required order fields' }),
      };
    }

    const formattedTime =
      baghdadTime ||
      new Intl.DateTimeFormat('ar-IQ', {
        timeZone: 'Asia/Baghdad',
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(new Date());

    // 1. Prepare Google Sheets Data
    const sheetData = {
      orderId,
      productName: productName || 'منتج تريندي',
      name,
      phone,
      governorate,
      address,
      productId: itemId,
      quantity: quantity || 1,
      totalPrice: totalPrice || 0,
      notes: notes || 'بدون ملاحظات',
      createdAt: formattedTime,
    };

    // 2. Prepare Telegram Message (simplified, order-facing layout)
    const telegramMsg = `📦 المنتج: ${productName || 'منتج تريندي'}

الاسم: ${name}

الهاتف: ${phone}

المحافظة: ${governorate}

العنوان: ${address}

العدد: ${quantity || 1}

المبلغ الإجمالي: ${Number(totalPrice || 0).toLocaleString('en-US')} د.ع`;

    const productPageUrl = `${(process.env.APP_URL || 'https://trendy-iq.com').replace(/\/+$/, '')}/product/${itemId}`;

    // 3. Execute all external delivery destinations in parallel
    const [sheetsSuccess, telegramSuccess, capiSuccess] = await Promise.all([
      sendToGoogleSheetsWithRetry(sheetData),
      sendToTelegramWithRetry(telegramMsg),
      sendMetaCapiPurchase({
        eventName: 'Purchase',
        eventId: orderId,
        orderId,
        productName: productName || 'منتج تريندي',
        productId: itemId,
        totalPriceIqd: totalPrice || 0,
        count: quantity || 1,
        customerName: name,
        phone,
        governorate,
        clientIp,
        userAgent,
        fbc,
        fbp,
        sourceUrl: productPageUrl,
      }).catch(() => false),
    ]);

    // 4. Check for destination failures
    const failedServices: string[] = [];
    if (!sheetsSuccess) failedServices.push('Google Sheets');
    if (!telegramSuccess) failedServices.push('Telegram Bot');
    if (!capiSuccess) failedServices.push('Meta CAPI');

    if (failedServices.length > 0) {
      console.error(`Order ${orderId} encountered failures for: ${failedServices.join(', ')}`);

      // If either Google Sheets or Telegram failed after all retries, send emergency alert
      if (!sheetsSuccess || !telegramSuccess) {
        await sendFailureAlert({
          orderId,
          name,
          phone,
          governorate,
          address,
          itemId,
          reason: `فشل الإرسال إلى (${failedServices.join(' + ')}) بعد 4 محاولات إعادة`,
        });
      }

      // If Google Sheets specifically failed (primary database/record), throw to trigger Netlify Background Function retry
      if (!sheetsSuccess) {
        throw new Error(
          `Google Sheets recording failed for order ${orderId}. Triggering Netlify background retry.`
        );
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId }),
    };
  } catch (error: any) {
    console.error('Error in checkout-background execution:', error);
    // Throw error so Netlify Background Function retries automatically (up to 2 times)
    throw error;
  }
};
