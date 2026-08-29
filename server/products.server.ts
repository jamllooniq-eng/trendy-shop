/**
 * Products Server-Side Adapter (مصدر بيانات المنتجات — برستيل)
 * =========================================================
 * بديل عن server/rolemall.server.ts (الأفليت).
 * يقرأ المنتجات من قاعدة بيانات Supabase التي يديرها صاحب المتجر يدويًا
 * عبر لوحة /admin، بدلاً من جلبها من RoleMall API.
 *
 * مهم جدًا: يحافظ هذا الملف على نفس تواقيع الدوال (function signatures)
 * الموجودة في rolemall.server.ts بالضبط، حتى يبقى بقية الكود
 * (SSR, الفورم, الكاش, صفحة المنتج) يعمل دون أي تعديل إضافي.
 */

import { RolemallProduct, RolemallCategory, ProductsResponse } from '../src/types';
import { getSupabaseClient } from './supabase.server';

export interface ProductDetailsResult {
  product: RolemallProduct | null;
  status: 'found' | 'not_found' | 'temporarily_unavailable';
}

// ---------------------------------------------------------------------------
// تحويل صف قاعدة البيانات (product_fields مستقبلاً + products) إلى شكل RolemallProduct
// ---------------------------------------------------------------------------

function splitList(value: unknown): string[] | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function rowToProduct(row: any): RolemallProduct {
  return {
    id: row.id,
    title: row.title || '',
    price: Number(row.price) || 0,
    old_price: row.old_price != null ? Number(row.old_price) : undefined,
    image: row.image || '',
    images: splitList(row.images),
    category: row.category || undefined,
    description: row.description || undefined,
    features: splitList(row.features),
    available: row.available !== false, // افتراضي متاح ما لم يُحدَّد صراحة false
    stock: row.stock != null ? Number(row.stock) : undefined,
  };
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\u0600-\u06FF]+/g, (match) =>
      // نبقي الأحرف العربية كما هي بدل حذفها، ونستبدل المسافات بشرطة فقط
      /\s/.test(match) ? '-' : match
    )
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-');
}

// ---------------------------------------------------------------------------
// getCategories — يشتق التصنيفات من القيم الموجودة فعليًا بعمود category
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<RolemallCategory[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('available', true)
      .not('category', 'is', null);

    if (error) {
      console.error('[products.server] getCategories error:', error.message);
      return [];
    }

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const cat = String(row.category || '').trim();
      if (!cat) continue;
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, count]) => ({
      id: name,
      name,
      slug: slugify(name),
      count,
    }));
  } catch (err: any) {
    console.error('[products.server] getCategories exception:', err?.message || err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// getProducts — قائمة منتجات مع صفحات، فلترة بالتصنيف، وبحث نصي
// ---------------------------------------------------------------------------

export async function getProducts(options: {
  page?: number;
  limit?: number;
  category?: string;
  query?: string;
} = {}): Promise<ProductsResponse> {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.max(1, Math.min(100, Number(options.limit || 24)));
  const category = (options.category || '').trim();
  const query = (options.query || '').trim();

  try {
    const supabase = getSupabaseClient();
    let builder = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('available', true)
      .order('created_at', { ascending: false });

    if (category) {
      builder = builder.eq('category', category);
    }
    if (query) {
      builder = builder.ilike('title', `%${query}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    builder = builder.range(from, to);

    const { data, error, count } = await builder;

    if (error) {
      console.error('[products.server] getProducts error:', error.message);
      return { products: [], total: 0, page, limit, hasMore: false };
    }

    const products = (data || []).map(rowToProduct);
    const total = count ?? products.length;
    const hasMore = from + products.length < total;

    return { products, total, page, limit, hasMore };
  } catch (err: any) {
    console.error('[products.server] getProducts exception:', err?.message || err);
    return { products: [], total: 0, page, limit, hasMore: false };
  }
}

// ---------------------------------------------------------------------------
// getProductDetails — تفاصيل منتج واحد لصفحة المنتج
// ---------------------------------------------------------------------------

export async function getProductDetails(productId: string | number): Promise<ProductDetailsResult> {
  const pId = String(productId).trim();
  if (!pId) return { product: null, status: 'not_found' };

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', pId)
      .maybeSingle();

    if (error) {
      console.error('[products.server] getProductDetails error:', error.message);
      return { product: null, status: 'temporarily_unavailable' };
    }

    if (!data) {
      return { product: null, status: 'not_found' };
    }

    return { product: rowToProduct(data), status: 'found' };
  } catch (err: any) {
    console.error('[products.server] getProductDetails exception:', err?.message || err);
    return { product: null, status: 'temporarily_unavailable' };
  }
}
