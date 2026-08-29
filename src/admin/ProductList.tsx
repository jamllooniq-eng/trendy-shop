import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { AdminProduct } from './adminTypes';
import { Plus, Search, Pencil, Trash2, LoaderCircle, PackageX } from 'lucide-react';

interface ProductListProps {
  onAddNew: () => void;
  onEdit: (id: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onAddNew, onEdit }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      setError('تعذر تحميل المنتجات: ' + fetchErr.message);
    } else {
      setProducts((data as AdminProduct[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('متأكد تريد حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    setDeletingId(id);
    await supabase.from('product_fields').delete().eq('product_id', id);
    const { error: deleteErr } = await supabase.from('products').delete().eq('id', id);
    setDeletingId(null);
    if (deleteErr) {
      setError('فشل حذف المنتج: ' + deleteErr.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-gray-900">المنتجات ({products.length})</h1>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 bg-[#22A39E] hover:bg-[#1c8a86] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم المنتج..."
          className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#22A39E] outline-none text-sm bg-white"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircle className="w-6 h-6 animate-spin text-[#22A39E]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <PackageX className="w-10 h-10 mb-2" />
          <p className="text-sm">{products.length === 0 ? 'ما فيه منتجات بعد' : 'ما فيه نتائج مطابقة'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-50 relative">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <PackageX className="w-8 h-8" />
                  </div>
                )}
                {!p.available && (
                  <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    غير متاح
                  </span>
                )}
              </div>
              <div className="p-3.5 space-y-2">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem]">{p.title}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#22A39E] font-black">{p.price.toLocaleString('en-US')}</span>
                  <span className="text-[11px] text-gray-500">د.ع</span>
                  {p.old_price ? (
                    <span className="text-[11px] text-gray-400 line-through mr-1">
                      {p.old_price.toLocaleString('en-US')}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onEdit(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg py-2 px-3 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === p.id ? (
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
