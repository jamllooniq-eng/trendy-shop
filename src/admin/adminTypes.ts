export interface AdminProduct {
  id: number;
  title: string;
  price: number;
  old_price: number | null;
  image: string;
  images: string | null; // مخزّنة كنص، روابط مفصولة بفاصلة
  category: string | null;
  description: string | null;
  features: string | null; // نص، سطر أو فاصلة لكل ميزة
  available: boolean;
  stock: number | null;
  created_at?: string;
}

export type ProductFieldType = 'text' | 'select';

export interface AdminProductField {
  id: number;
  product_id: number;
  field_name: string;
  placeholder: string | null;
  field_type: ProductFieldType;
  options: string | null; // خيارات مفصولة بفاصلة (لنوع select فقط)
  required: boolean;
  sort_order: number;
}

export type AdminProductFieldDraft = Omit<AdminProductField, 'id' | 'product_id'> & {
  id?: number;
};
