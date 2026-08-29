import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { AdminProduct, AdminProductFieldDraft } from './adminTypes';
import { FieldBuilder } from './FieldBuilder';
import { UploadCloud, X, LoaderCircle, ArrowRight } from 'lucide-react';

interface ProductFormProps {
  productId: number | null; // null = منتج جديد
  onDone: () => void;
  onCancel: () => void;
}

const BUCKET = 'product-images';

export const ProductForm: React.FC<ProductFormProps> = ({ productId, onDone, onCancel }) => {
  const isEditing = productId !== null;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [available, setAvailable] = useState(true);
  const [stock, setStock] = useState('');

  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [fields, setFields] = useState<AdminProductFieldDraft[]>([]);

  // تحميل بيانات المنتج عند التعديل
  useEffect(() => {
    if (!isEditing) return;

    (async () => {
      setLoading(true);
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (prodErr || !product) {
        setError('تعذر تحميل بيانات المنتج');
        setLoading(false);
        return;
      }

      const p = product as AdminProduct;
      setTitle(p.title || '');
      setPrice(String(p.price ?? ''));
      setOldPrice(p.old_price != null ? String(p.old_price) : '');
      setCategory(p.category || '');
      setDescription(p.description || '');
      setFeaturesText(p.features || '');
      setAvailable(p.available !== false);
      setStock(p.stock != null ? String(p.stock) : '');
      setMainImage(p.image || '');
      setGalleryImages(
        p.images ? p.images.split(',').map((s) => s.trim()).filter(Boolean) : []
      );

      const { data: fieldRows } = await supabase
        .from('product_fields')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (fieldRows) {
        setFields(
          fieldRows.map((f: any) => ({
            id: f.id,
            field_name: f.field_name,
            placeholder: f.placeholder,
            field_type: f.field_type,
            options: f.options,
            required: f.required,
            sort_order: f.sort_order,
          }))
        );
      }

      setLoading(false);
    })();
  }, [isEditing, productId]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadErr) {
      setError(`فشل رفع الصورة: ${uploadErr.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    setError(null);
    const url = await uploadFile(file);
    if (url) setMainImage(url);
    setUploadingMain(false);
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    setError(null);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) uploaded.push(url);
    }
    setGalleryImages((prev) => [...prev, ...uploaded]);
    setUploadingGallery(false);
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('يرجى إدخال اسم المنتج');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('يرجى إدخال سعر صحيح');
      return;
    }
    if (!mainImage) {
      setError('يرجى رفع صورة رئيسية للمنتج');
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : null,
      image: mainImage,
      images: galleryImages.length > 0 ? galleryImages.join(',') : null,
      category: category.trim() || null,
      description: description.trim() || null,
      features: featuresText.trim() || null,
      available,
      stock: stock ? Number(stock) : null,
    };

    let savedProductId = productId;

    if (isEditing) {
      const { error: updateErr } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId);
      if (updateErr) {
        setError(`فشل حفظ المنتج: ${updateErr.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();
      if (insertErr || !inserted) {
        setError(`فشل حفظ المنتج: ${insertErr?.message || 'خطأ غير معروف'}`);
        setSaving(false);
        return;
      }
      savedProductId = inserted.id;
    }

    // مزامنة الحقول المخصصة: نحذف القديمة ونضيف الحالية (أبسط وأضمن من مقارنة الفروقات)
    if (savedProductId != null) {
      await supabase.from('product_fields').delete().eq('product_id', savedProductId);

      const validFields = fields.filter((f) => f.field_name.trim());
      if (validFields.length > 0) {
        const rows = validFields.map((f, i) => ({
          product_id: savedProductId,
          field_name: f.field_name.trim(),
          placeholder: f.placeholder?.trim() || null,
          field_type: f.field_type,
          options: f.field_type === 'select' ? (f.options?.trim() || null) : null,
          required: f.required,
          sort_order: i,
        }));
        const { error: fieldsErr } = await supabase.from('product_fields').insert(rows);
        if (fieldsErr) {
          setError(`تم حفظ المنتج، لكن فشل حفظ الحقول المخصصة: ${fieldsErr.message}`);
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    onDone();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle className="w-6 h-6 animate-spin text-[#8B5E3C]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع للمنتجات
      </button>

      <h1 className="text-xl font-extrabold text-gray-900 mb-6">
        {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم المنتج *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">السعر (د.ع) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">السعر قبل الخصم</label>
            <input
              type="number"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm"
              placeholder="اختياري"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">التصنيف</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm"
              placeholder="مثال: إلكترونيات"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">المخزون</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm"
              placeholder="اختياري"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            الميزات (سطر لكل ميزة)
          </label>
          <textarea
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            rows={3}
            placeholder={'مثال:\nضمان سنة كاملة\nتوصيل خلال 24 ساعة'}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B5E3C] outline-none text-sm resize-none"
          />
        </div>

        {/* الصورة الرئيسية */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الصورة الرئيسية *</label>
          {mainImage ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
              <img src={mainImage} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setMainImage('')}
                className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#8B5E3C] transition-colors">
              {uploadingMain ? (
                <LoaderCircle className="w-5 h-5 animate-spin text-[#8B5E3C]" />
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[11px] text-gray-500">رفع صورة</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* صور إضافية */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">صور إضافية (اختياري)</label>
          <div className="flex flex-wrap gap-2.5">
            {galleryImages.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#8B5E3C] transition-colors">
              {uploadingGallery ? (
                <LoaderCircle className="w-4 h-4 animate-spin text-[#8B5E3C]" />
              ) : (
                <Plus className="w-4 h-4 text-gray-400" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="w-4 h-4 accent-[#8B5E3C]"
          />
          المنتج متاح للطلب
        </label>

        <hr className="border-gray-200" />

        <FieldBuilder fields={fields} onChange={setFields} />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploadingMain || uploadingGallery}
            className="flex-1 bg-[#8B5E3C] hover:bg-[#6B4226] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'جارِ الحفظ...' : 'حفظ المنتج'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

// أيقونة "+" صغيرة لصندوق رفع الصور الإضافية
function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
