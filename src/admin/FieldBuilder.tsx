import React from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { AdminProductFieldDraft } from './adminTypes';

interface FieldBuilderProps {
  fields: AdminProductFieldDraft[];
  onChange: (fields: AdminProductFieldDraft[]) => void;
}

function emptyField(sortOrder: number): AdminProductFieldDraft {
  return {
    field_name: '',
    placeholder: '',
    field_type: 'text',
    options: '',
    required: false,
    sort_order: sortOrder,
  };
}

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange }) => {
  const addField = () => {
    onChange([...fields, emptyField(fields.length)]);
  };

  const updateField = (index: number, patch: Partial<AdminProductFieldDraft>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const removeField = (index: number) => {
    const next = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i }));
    onChange(next);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((f, i) => ({ ...f, sort_order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          حقول مخصصة لفورم الطلب (اختياري)
        </label>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1.5 text-sm font-bold text-[#8B5E3C] hover:text-[#6B4226] transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة حقل
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl py-4 text-center">
          ما فيه حقول مخصصة لهذا المنتج — فورم الطلب راح يظهر بالحقول الافتراضية فقط
          (الاسم، الهاتف، المحافظة، العنوان).
        </p>
      )}

      {fields.map((field, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400">
              <GripVertical className="w-4 h-4" />
              <span className="text-xs font-bold">حقل #{index + 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                className="text-xs text-gray-500 disabled:opacity-30 hover:text-gray-800"
                title="نقل للأعلى"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
                className="text-xs text-gray-500 disabled:opacity-30 hover:text-gray-800"
                title="نقل للأسفل"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-500 hover:text-red-700"
                title="حذف الحقل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">اسم الحقل</label>
              <input
                type="text"
                value={field.field_name}
                onChange={(e) => updateField(index, { field_name: e.target.value })}
                placeholder="مثال: اللون"
                className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B5E3C] outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">البليسهولدر</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="مثال: اختر لونك"
                className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B5E3C] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">نوع الحقل</label>
              <select
                value={field.field_type}
                onChange={(e) =>
                  updateField(index, { field_type: e.target.value as 'text' | 'select' })
                }
                className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B5E3C] outline-none bg-white"
              >
                <option value="text">كتابة حرة</option>
                <option value="select">اختيارات (قائمة)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                className="w-4 h-4 accent-[#8B5E3C]"
              />
              حقل إجباري
            </label>
          </div>

          {field.field_type === 'select' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                الخيارات (افصل بينها بفاصلة ،)
              </label>
              <input
                type="text"
                value={field.options || ''}
                onChange={(e) => updateField(index, { options: e.target.value })}
                placeholder="أحمر، أزرق، أسود"
                className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B5E3C] outline-none"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
