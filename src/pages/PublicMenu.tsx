import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Store,
  ChefHat,
  MessageCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Plus,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Restaurant, Category, Product } from '../types';
import { MenuHeader } from '../components/menu/MenuHeader';
import { MenuProductCard } from '../components/menu/MenuProductCard';

export default function PublicMenu() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurant/menu/${slug}`);
        const data = await res.json();
        
        if (res.ok) {
          setRestaurant(data.restaurant);
          setCategories(data.categories || []);
          setProducts(data.products || []);
          
          if (data.restaurant.defaultLanguage) {
            i18n.changeLanguage(data.restaurant.defaultLanguage);
          }
          if (data.restaurant.name) {
            document.title = `${data.restaurant.name} | Digital Menu`;
          }
        } else {
          setError(data.error || 'Menu not found');
        }
      } catch (err) {
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug, i18n]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const getLanguageOptions = () => {
    if (!restaurant?.languages) return ['en'];
    return restaurant.languages.split(',');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
      </div>
      <p className="text-orange-500 font-black tracking-widest uppercase text-xs animate-pulse">Loading Menu...</p>
    </div>
  );

  if (error || !restaurant) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6 text-center">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6">
        <ChefHat size={40} />
      </div>
      <h1 className="text-2xl font-black text-neutral-900 mb-2">{error || 'Menu Not Found'}</h1>
      <p className="text-neutral-500 mb-8 max-w-xs">{t('menu.not_found_desc')}</p>
      <a href="/" className="bg-neutral-900 text-white px-8 py-3 rounded-2xl font-black transition-transform active:scale-95">
        Go Back
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <MenuHeader 
        restaurant={restaurant} 
        languages={getLanguageOptions()} 
        currentLang={i18n.language} 
        onLangChange={(lang) => i18n.changeLanguage(lang)}
        onShowInfo={() => setShowInfo(true)}
      />

      {/* Search & Categories Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100/50">
        <div className="max-w-screen-xl mx-auto">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-neutral-50 border-2 border-neutral-50 focus:border-orange-500 focus:bg-white focus:ring-8 focus:ring-orange-50 outline-none transition-all font-bold text-sm"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Nav */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <button
                onClick={() => setActiveCategory('all')}
                className={`whitespace-nowrap px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                  activeCategory === 'all' 
                    ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-900/20' 
                    : 'bg-white text-neutral-500 border border-neutral-100 hover:border-neutral-200'
                }`}
              >
                {t('products.all_items')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' 
                      : 'bg-white text-neutral-500 border border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  {i18n.language === 'ar' ? cat.name_ar || cat.name : i18n.language === 'fr' ? cat.name_fr || cat.name : cat.name_en || cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-12">
          {categories.filter(cat => activeCategory === 'all' || activeCategory === cat.id).map(cat => {
            const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;
            
            return (
              <section key={cat.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-neutral-100"></div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight px-4">
                    {i18n.language === 'ar' ? cat.name_ar || cat.name : i18n.language === 'fr' ? cat.name_fr || cat.name : cat.name_en || cat.name}
                  </h2>
                  <div className="h-px flex-1 bg-neutral-100"></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  {catProducts.map(product => (
                    <MenuProductCard 
                      key={product.id}
                      product={product}
                      currency={restaurant.currency}
                      onClick={setSelectedProduct}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-200">
              <Search size={48} />
            </div>
            <div>
              <h3 className="text-xl font-black text-neutral-900">{t('menu.no_results')}</h3>
              <p className="text-neutral-500 font-medium">{t('menu.try_different_search')}</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-neutral-100 text-center space-y-4">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-300">Powered by</p>
        <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
          <Store size={18} className="text-orange-500" />
          <span className="font-black text-neutral-900">MenuQuick</span>
        </div>
      </footer>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-6">
        <div className="bg-neutral-900/90 backdrop-blur-xl text-white p-2 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10">
          <button 
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-white/10 rounded-2xl transition-colors"
          >
            <Info size={16} className="text-orange-400" />
            {t('menu.info')}
          </button>
          {restaurant.whatsappNumber && (
            <a 
              href={`https://wa.me/${restaurant.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <MessageCircle size={16} />
              {t('menu.order')}
            </a>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden relative shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>

              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <ChefHat size={64} />
                  </div>
                )}
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                      {i18n.language === 'ar' ? selectedProduct.name_ar || selectedProduct.name : i18n.language === 'fr' ? selectedProduct.name_fr || selectedProduct.name : selectedProduct.name_en || selectedProduct.name}
                    </h2>
                    <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mt-1">
                      {categories.find(c => c.id === selectedProduct.categoryId)?.name}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-neutral-900">{selectedProduct.price} {restaurant.currency}</span>
                </div>
                
                <p className="text-neutral-500 font-medium leading-relaxed text-lg">
                  {i18n.language === 'ar' ? selectedProduct.description_ar || selectedProduct.description : i18n.language === 'fr' ? selectedProduct.description_fr || selectedProduct.description : selectedProduct.description_en || selectedProduct.description}
                </p>

                {restaurant.whatsappNumber && (
                  <button 
                    onClick={() => window.open(`https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(`${t('menu.order_msg')} ${selectedProduct.name}`)}`, '_blank')}
                    className="w-full bg-neutral-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <MessageCircle size={24} />
                    {t('menu.order_now')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden relative shadow-2xl p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-neutral-900">{t('menu.info')}</h2>
                <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 p-6 rounded-3xl bg-neutral-50">
                  <MapPin size={24} className="text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-1">{t('menu.location')}</h4>
                    <p className="font-bold text-neutral-800 leading-relaxed">{restaurant.address || 'Not available'}</p>
                  </div>
                </div>

                <div className="flex gap-4 p-6 rounded-3xl bg-neutral-50">
                  <Info size={24} className="text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-1">{t('menu.about')}</h4>
                    <p className="font-bold text-neutral-800 leading-relaxed">{restaurant.description || 'Welcome to our digital menu!'}</p>
                  </div>
                </div>

                {restaurant.whatsappNumber && (
                  <div className="flex gap-4 p-6 rounded-3xl bg-neutral-50">
                    <MessageCircle size={24} className="text-orange-500 shrink-0" />
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-1">{t('menu.whatsapp')}</h4>
                      <p className="font-bold text-neutral-800">{restaurant.whatsappNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
