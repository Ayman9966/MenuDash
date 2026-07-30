import React, { useEffect, useState } from 'react';
import { Category, Product, Restaurant } from '../types';
import { getAuthToken } from '../lib/auth';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Tag, 
  DollarSign, 
  Image as ImageIcon, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Package, 
  Layers, 
  FileUp, 
  AlertCircle 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductsManagerProps {
  restaurant: Restaurant | null;
  onNavigateImport: () => void;
}

export default function ProductsManager({ restaurant, onNavigateImport }: ProductsManagerProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string | null>(null);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form fields for product
  const [prodName, setProdName] = useState('');
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameFr, setProdNameFr] = useState('');
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescFr, setProdDescFr] = useState('');
  const [prodDescAr, setProdDescAr] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);

  // Form field for category
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameFr, setNewCatNameFr] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const enabledLangs = restaurant?.languages ? restaurant.languages.split(',').map(l => l.trim()) : ['en'];

  const fetchProductsAndCategories = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.categories?.length > 0 && !prodCatId) {
          setProdCatId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdNameEn('');
    setProdNameFr('');
    setProdNameAr('');
    setProdPrice('');
    setProdDesc('');
    setProdDescEn('');
    setProdDescFr('');
    setProdDescAr('');
    setProdImage('');
    setProdAvailable(true);
    if (categories.length > 0) {
      setProdCatId(categories[0].id);
    }
    setActionError(null);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdNameEn(prod.name_en || '');
    setProdNameFr(prod.name_fr || '');
    setProdNameAr(prod.name_ar || '');
    setProdCatId(prod.categoryId);
    setProdPrice(String(prod.price));
    setProdDesc(prod.description || '');
    setProdDescEn(prod.description_en || '');
    setProdDescFr(prod.description_fr || '');
    setProdDescAr(prod.description_ar || '');
    setProdImage(prod.imageUrl || '');
    setProdAvailable(prod.isAvailable ?? true);
    setActionError(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setActionError(t('common.error_required'));
      return;
    }
    if (!prodCatId) {
      setActionError(t('dashboard.select_category_error'));
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      const token = getAuthToken();
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName.trim(),
          name_en: prodNameEn.trim() || prodName.trim(),
          name_fr: prodNameFr.trim(),
          name_ar: prodNameAr.trim(),
          categoryId: prodCatId,
          price: parseFloat(prodPrice) || 0,
          description: prodDesc.trim(),
          description_en: prodDescEn.trim() || prodDesc.trim(),
          description_fr: prodDescFr.trim(),
          description_ar: prodDescAr.trim(),
          imageUrl: prodImage.trim(),
          isAvailable: prodAvailable,
          isFeatured: false
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsProductModalOpen(false);
        fetchProductsAndCategories();
      } else {
        setActionError(data.error || t('dashboard.save_product_error'));
      }
    } catch (err: any) {
      setActionError(err.message || t('dashboard.save_product_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('common.delete') + '?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProductsAndCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      const token = getAuthToken();
      const newAvail = !prod.isAvailable;
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isAvailable: newAvail } : p));

      await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...prod,
          isAvailable: newAvail
        })
      });
    } catch (err) {
      fetchProductsAndCategories();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    setActionError(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newCatName.trim(),
          name_en: newCatNameEn.trim() || newCatName.trim(),
          name_fr: newCatNameFr.trim(),
          name_ar: newCatNameAr.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewCatName('');
        setNewCatNameEn('');
        setNewCatNameFr('');
        setNewCatNameAr('');
        setIsCategoryModalOpen(false);
        fetchProductsAndCategories();
      } else {
        setActionError(data.error || t('dashboard.create_category_error'));
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm(t('dashboard.delete_category_warning'))) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProductsAndCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCatFilter || p.categoryId === selectedCatFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400 font-medium">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-neutral-900">{t('dashboard.products_title')}</h2>
          <p className="text-neutral-500 text-sm">{t('dashboard.products_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Tag size={18} className="text-orange-500" />
            {t('dashboard.manage_categories')}
          </button>
          <button
            onClick={openAddProduct}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
          >
            <Plus size={18} />
            {t('dashboard.add_item')}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Package size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-neutral-900">{products.length}</p>
              <p className="text-xs font-medium text-neutral-500">{t('dashboard.total_products')}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-neutral-50 overflow-x-auto no-scrollbar">
            {enabledLangs.includes('en') && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                <span className="text-[10px] font-black">EN</span>
                <span className="text-xs font-bold">{products.filter(p => !!p.name_en || !!p.name).length}</span>
              </div>
            )}
            {enabledLangs.includes('ar') && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                <span className="text-[10px] font-black">AR</span>
                <span className="text-xs font-bold">{products.filter(p => !!p.name_ar).length}</span>
              </div>
            )}
            {enabledLangs.includes('fr') && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg shrink-0">
                <span className="text-[10px] font-black">FR</span>
                <span className="text-xs font-bold">{products.filter(p => !!p.name_fr).length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-neutral-900">{categories.length}</p>
            <p className="text-xs font-medium text-neutral-500">{t('dashboard.categories')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Eye size={22} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-neutral-900">{products.filter(p => p.isAvailable).length}</p>
            <p className="text-xs font-medium text-neutral-500">{t('dashboard.active_visible')}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t('dashboard.search_items')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCatFilter(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCatFilter === null 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {t('dashboard.all_categories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCatFilter === cat.id 
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900">{t('dashboard.no_products_found')}</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            {products.length === 0 
              ? t('dashboard.no_products_desc')
              : t('dashboard.no_match_desc')}
          </p>
          {products.length === 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                onClick={openAddProduct}
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                + {t('dashboard.add_first_dish')}
              </button>
              <button
                onClick={onNavigateImport}
                className="flex items-center gap-2 border border-neutral-300 text-neutral-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors"
              >
                <FileUp size={18} />
                {t('dashboard.import_csv')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => {
            const catName = categories.find(c => c.id === prod.categoryId)?.name || 'Uncategorized';
            const priceVal = typeof prod.price === 'number' ? prod.price : parseFloat(String(prod.price || '0'));

            return (
              <div 
                key={prod.id} 
                className={`bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  !prod.isAvailable ? 'opacity-60 bg-neutral-50' : ''
                }`}
              >
                <div>
            <div className="aspect-video bg-neutral-100 overflow-hidden relative">
              {prod.imageUrl ? (
                <img 
                  src={prod.imageUrl} 
                  alt={prod.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-400 font-extrabold text-2xl">
                  {prod.name.charAt(0)}
                </div>
              )}
              <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                {catName}
              </span>
              <button
                onClick={() => handleToggleAvailability(prod)}
                className={`absolute top-3 right-3 p-2 rounded-full font-bold text-xs flex items-center gap-1 shadow-md transition-colors ${
                  prod.isAvailable 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {prod.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                {prod.isAvailable ? t('dashboard.in_stock') : t('dashboard.out_of_stock')}
              </button>
            </div>

                  <div className="p-5 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg text-neutral-900 leading-snug">{prod.name}</h3>
                      <span className="font-extrabold text-orange-600 text-lg whitespace-nowrap">
                        {restaurant?.currency || '$'} {isNaN(priceVal) ? '0.00' : priceVal.toFixed(2)}
                      </span>
                    </div>
                    {prod.description && (
                      <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed">{prod.description}</p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-neutral-100 flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-neutral-400">
                    ID: {prod.id.substring(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditProduct(prod)}
                      className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                      title={t('dashboard.edit_item')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title={t('dashboard.delete_item')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h3 className="text-xl font-bold text-neutral-900">
                {editingProduct ? t('dashboard.edit_item') : t('dashboard.add_item')}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border border-rose-200">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">{t('dashboard.item_name')} (Base) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Mushroom Burger"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none"
                />
              </div>

              {/* Multilingual Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enabledLangs.includes('en') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Name (English)</label>
                    <input
                      type="text"
                      placeholder="English Name"
                      value={prodNameEn}
                      onChange={(e) => setProdNameEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none"
                    />
                  </div>
                )}
                {enabledLangs.includes('fr') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Nom (Français)</label>
                    <input
                      type="text"
                      placeholder="Nom en Français"
                      value={prodNameFr}
                      onChange={(e) => setProdNameFr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none"
                    />
                  </div>
                )}
                {enabledLangs.includes('ar') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1 text-right">الاسم (العربية)</label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="الاسم بالعربية"
                      value={prodNameAr}
                      onChange={(e) => setProdNameAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none text-right"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">{t('dashboard.categories')} *</label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">
                    {t('settings.currency')} ({restaurant?.currency || '$'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="12.99"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">{t('settings.description')}</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, dietary notes, details..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none"
                />
              </div>

              {/* Multilingual Description Fields */}
              <div className="space-y-3">
                {enabledLangs.includes('en') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Description (English)</label>
                    <textarea
                      rows={1}
                      placeholder="English description..."
                      value={prodDescEn}
                      onChange={(e) => setProdDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none"
                    />
                  </div>
                )}
                {enabledLangs.includes('fr') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Description (Français)</label>
                    <textarea
                      rows={1}
                      placeholder="Description en français..."
                      value={prodDescFr}
                      onChange={(e) => setProdDescFr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none"
                    />
                  </div>
                )}
                {enabledLangs.includes('ar') && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1 text-right">الوصف (العربية)</label>
                    <textarea
                      rows={1}
                      dir="rtl"
                      placeholder="الوصف بالعربية..."
                      value={prodDescAr}
                      onChange={(e) => setProdDescAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-100 text-xs focus:border-orange-300 outline-none text-right"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">{t('settings.logo')} URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none text-xs"
                />
                <p className="text-[11px] text-neutral-400 mt-1">{t('dashboard.image_url_help')}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="prodAvail"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                />
                <label htmlFor="prodAvail" className="text-sm font-semibold text-neutral-800 cursor-pointer">
                  {t('dashboard.in_stock')}
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {saving ? t('dashboard.saving') : editingProduct ? t('dashboard.save_item') : t('dashboard.add_item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h3 className="text-lg font-bold text-neutral-900">{t('dashboard.manage_categories')}</h3>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('dashboard.new_category_placeholder')}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:border-orange-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={saving || !newCatName.trim()}
                  className="bg-neutral-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>

              {/* Multilingual Category Names */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-neutral-50">
                {enabledLangs.includes('en') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 w-12 shrink-0">EN</span>
                    <input
                      type="text"
                      placeholder="Category in English"
                      value={newCatNameEn}
                      onChange={(e) => setNewCatNameEn(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-100 text-xs outline-none focus:border-orange-200"
                    />
                  </div>
                )}
                {enabledLangs.includes('fr') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 w-12 shrink-0">FR</span>
                    <input
                      type="text"
                      placeholder="Catégorie en Français"
                      value={newCatNameFr}
                      onChange={(e) => setNewCatNameFr(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-100 text-xs outline-none focus:border-orange-200"
                    />
                  </div>
                )}
                {enabledLangs.includes('ar') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 w-12 shrink-0">AR</span>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="الفئة بالعربية"
                      value={newCatNameAr}
                      onChange={(e) => setNewCatNameAr(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-100 text-xs outline-none focus:border-orange-200 text-right"
                    />
                  </div>
                )}
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                  <span className="font-bold text-sm text-neutral-800">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
