import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  product, 
  categories, 
  onClose, 
  onSave 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({
    categoryId: '',
    nameEn: '',
    nameFr: '',
    nameAr: '',
    descriptionEn: '',
    descriptionFr: '',
    descriptionAr: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    isFeatured: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        categoryId: product.categoryId || '',
        nameEn: product.name_en || product.name || '',
        nameFr: product.name_fr || '',
        nameAr: product.name_ar || '',
        descriptionEn: product.description_en || product.description || '',
        descriptionFr: product.description_fr || '',
        descriptionAr: product.description_ar || '',
        price: product.price.toString(),
        imageUrl: product.imageUrl || '',
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured
      });
    } else if (categories.length > 0) {
      setFormData((prev: any) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTranslate = async () => {
    // Logic for auto-translation would go here or be passed as a prop
    // For now, we'll keep it simple as the translation logic is usually handled in utils
    alert('Auto-translation feature coming soon in this refactored view!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-neutral-900">
              {product ? t('products.edit_item') : t('products.add_item')}
            </h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{t('products.item_details')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
            <X size={24} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-500 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-black text-neutral-700 uppercase tracking-tight">{t('products.category')}</label>
            <select
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold text-neutral-800 appearance-none bg-white"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-neutral-50">
            <div className="space-y-4">
              <label className="text-sm font-black text-neutral-700 uppercase tracking-tight">Price ({formData.currency || 'USD'})</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-5 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-black text-neutral-700 uppercase tracking-tight">Image URL</label>
              <input
                className="w-full px-5 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Multilingual Names */}
          <div className="space-y-6 pt-6 border-t border-neutral-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-neutral-700 uppercase tracking-tight">{t('products.item_name')}</label>
              <button 
                type="button" 
                onClick={handleAutoTranslate}
                className="text-xs font-black text-orange-600 flex items-center gap-1.5 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles size={14} /> {t('products.auto_translate')}
              </button>
            </div>
            <div className="grid gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇺🇸</span>
                <input
                  required
                  placeholder="English Name"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇫🇷</span>
                <input
                  placeholder="Nom Français"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇲🇦</span>
                <input
                  placeholder="الاسم بالعربية"
                  dir="rtl"
                  className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-neutral-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <label className="flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 border-neutral-100 cursor-pointer hover:border-orange-200 transition-all">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-lg accent-orange-500"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <span className="font-bold text-neutral-700">{t('products.available')}</span>
            </label>
            <label className="flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 border-neutral-100 cursor-pointer hover:border-orange-200 transition-all">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-lg accent-orange-500"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              />
              <span className="font-bold text-neutral-700">{t('products.featured')}</span>
            </label>
          </div>
        </form>

        <div className="p-6 bg-neutral-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-black text-neutral-500 hover:bg-neutral-200 transition-colors uppercase tracking-widest text-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-[2] bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
