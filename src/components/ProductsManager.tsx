import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2,
  AlertCircle,
  FileUp,
  PackageOpen
} from 'lucide-react';
import { Restaurant, Category, Product } from '../types';
import { useMenu } from '../hooks/useMenu';
import { ProductCard } from './products/ProductCard';
import { ProductFormModal } from './products/ProductFormModal';

interface ProductsManagerProps {
  restaurant: Restaurant | null;
  onNavigateImport: () => void;
}

export default function ProductsManager({ restaurant, onNavigateImport }: ProductsManagerProps) {
  const { t } = useTranslation();
  const { 
    categories, 
    products, 
    loading, 
    error, 
    addCategory, 
    deleteCategory, 
    saveProduct, 
    deleteProduct, 
    toggleProductAvailability 
  } = useMenu();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName);
      setNewCategoryName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    await saveProduct(productData, editingProduct?.id);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse">{t('common.loading')}...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{t('dashboard.menu_items')}</h2>
          <p className="text-neutral-500 font-medium">{t('products.manage_desc')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateImport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-neutral-100 text-neutral-600 px-6 py-3.5 rounded-2xl font-black hover:bg-neutral-50 transition-all shadow-sm"
          >
            <FileUp size={20} /> {t('dashboard.import_csv')}
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
          >
            <Plus size={20} /> {t('products.add_item')}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Main Layout: Categories Left, Products Right */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-10 items-start">
        {/* Categories Sidebar */}
        <aside className="space-y-6 sticky top-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-neutral-900 uppercase tracking-widest text-xs mb-4">{t('products.categories')}</h3>
              <form onSubmit={handleAddCategory} className="relative">
                <input
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-2 border-neutral-50 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold text-sm bg-neutral-50/50"
                  placeholder={t('products.new_category')}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <Plus size={18} />
                </button>
              </form>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                  selectedCategory === 'all' 
                    ? 'bg-neutral-900 text-white shadow-lg' 
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <Filter size={16} />
                {t('products.all_items')}
                <span className="ml-auto opacity-50">{products.length}</span>
              </button>
              
              {categories.map(cat => (
                <div key={cat.id} className="group relative">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                      selectedCategory === cat.id 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                        : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="ml-auto opacity-50">{products.filter(p => p.categoryId === cat.id).length}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCategory(cat.id);
                    }}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title={t('common.delete')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Products Grid */}
        <section className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-neutral-50 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold text-sm bg-neutral-50/50"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 text-neutral-400 font-bold text-xs uppercase tracking-widest bg-neutral-50 rounded-2xl">
              {filteredProducts.length} {t('products.items_found')}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-[40px] py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                <PackageOpen size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">{t('products.no_items')}</h3>
                <p className="text-neutral-500 font-medium max-w-xs mx-auto mt-2">{t('products.no_items_desc')}</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
              >
                {t('products.add_item')}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  currency={restaurant?.currency || 'USD'}
                  onEdit={handleEditProduct}
                  onDelete={deleteProduct}
                  onToggleAvailability={toggleProductAvailability}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {isProductModalOpen && (
        <ProductFormModal 
          product={editingProduct}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
