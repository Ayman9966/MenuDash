import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Restaurant, Category, Product, CartItem } from '../types';
import { ShoppingCart, ShoppingBag, Plus, Minus, Send, Search, Info, X, LayoutGrid, List, UtensilsCrossed, MapPin, Store, Phone, Lock, Sparkles, ChevronRight, Eye, MessageSquareOff, Globe, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockRestaurant, mockCategories, mockProducts } from '../data/mockMenu';
import { useTranslation } from 'react-i18next';
import { translateCategoryName, translateProduct, translateRestaurantDescription } from '../utils/autoTranslate';
import React from 'react';

export default function PublicMenu({ isDemo = false }: { isDemo?: boolean }) {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewTemplate, setViewTemplate] = useState<'list' | 'grid'>('list');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      if (isDemo) {
        setRestaurant(mockRestaurant);
        setCategories(mockCategories);
        setProducts(mockProducts);
        setViewTemplate(mockRestaurant.template as 'list' | 'grid');
        document.title = t('menu.live_demo') + " - " + mockRestaurant.name;
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/menu/${slug}`);
        const data = await res.json();
        if (res.ok) {
          const rest = data.restaurant ? {
            ...data.restaurant,
            whatsappNumber: data.restaurant.whatsappNumber || data.restaurant.whatsapp_number
          } : null;
          setRestaurant(rest);
          
          if (rest) {
            // Set initial language if not already set or if different from default
            if (rest.defaultLanguage && !localStorage.getItem('i18nextLng')) {
              i18n.changeLanguage(rest.defaultLanguage);
            }
          }

          if (data.restaurant?.name) {
            document.title = data.restaurant.name;
          }
          setCategories(data.categories || []);
          setProducts(data.products || []);
          if (data.restaurant?.template) {
            setViewTemplate(data.restaurant.template as 'list' | 'grid');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const enabledLanguages = restaurant?.languages ? restaurant.languages.split(',').map(s => s.trim()) : ['en'];
  const availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' }
  ].filter(l => enabledLanguages.includes(l.code));

  const currentLang = availableLanguages.find(l => l.code === i18n.language) || availableLanguages[0];

  const changeLanguage = (code: string) => {
    if (!enabledLanguages.includes(code) || (enabledLanguages.length === 1 && code !== enabledLanguages[0])) {
      setAlertMessage(t('menu.lang_not_available'));
      setTimeout(() => setAlertMessage(null), 4000);
      setLangMenuOpen(false);
      return;
    }
    i18n.changeLanguage(code);
    localStorage.setItem('menu_dash_lang_selected', 'true');
    setLangMenuOpen(false);
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const isRTL = i18n.language === 'ar';

  const hasWhatsApp = Boolean(restaurant?.whatsappNumber && restaurant.whatsappNumber.trim() !== '');

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = () => {
    if (!restaurant?.whatsappNumber) return;
    
    let message = `*${t('menu.your_order')} from ${restaurant.name}*\n\n`;
    cart.forEach((item) => {
      const translated = translateProduct(item, i18n.language);
      const displayName = translated.name || item.name;
      message += `• ${item.quantity}x ${displayName} - ${restaurant.currency} ${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*${t('menu.total')}: ${restaurant.currency} ${total.toFixed(2)}*`;
    
    const whatsappUrl = `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getProductPrice = (p: Product) => {
    const val = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '0'));
    return isNaN(val) ? '0.00' : val.toFixed(2);
  };

  // Filter products by search term and current language
  const searchFilteredProducts = products.filter((p: any) => {
    const lang = i18n.language;
    const translated = translateProduct(p, lang);
    
    // Strict language check: if there's no name for this language, hide it
    if (!translated.name) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    
    return translated.name.toLowerCase().includes(q) || 
           (translated.description && translated.description.toLowerCase().includes(q));
  });

  // Filter categories to only show those that have content for the current language
  const activeLangCategories = categories.filter(cat => {
    const name = translateCategoryName(cat, i18n.language);
    return !!name;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse text-orange-500 font-bold text-2xl flex items-center gap-2">
        <UtensilsCrossed size={28} /> {t('menu.powered_by')}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 text-center">
      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
        <Store size={32} />
      </div>
      <h1 className="text-2xl font-bold text-neutral-800">{t('menu.menu_not_found')}</h1>
      <p className="text-neutral-500 text-sm mt-1">{t('menu.menu_not_found_desc')}</p>
    </div>
  );

  const isFreePlan = !restaurant?.plan || restaurant.plan === 'free';
  const FREE_CATEGORY_LIMIT = 2;
  const FREE_PRODUCT_PER_CATEGORY_LIMIT = 2;

  // Helper to render individual product card
  const renderProductCard = (product: Product, isLocked: boolean = false) => {
    const { name, description } = translateProduct(product, i18n.language);
    
    const handleCardClick = () => {
      if (isLocked) {
        setIsUpgradeModalOpen(true);
      } else {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
      }
    };

    return (
      <div
        key={product.id}
        onClick={handleCardClick}
        className={`bg-white rounded-3xl border shadow-xs transition-all overflow-hidden relative flex cursor-pointer ${
          viewTemplate === 'grid' ? 'flex-col' : 'flex-row items-center p-4 gap-4'
        } ${
          isLocked 
            ? 'border-amber-300/80 bg-neutral-50/90 hover:border-amber-500 hover:shadow-md' 
            : 'border-neutral-200/80 hover:shadow-md hover:border-orange-200'
        }`}
      >
        {/* Product Card Content - Blurred when locked */}
        <div className={`flex-1 flex ${viewTemplate === 'grid' ? 'flex-col' : 'flex-row items-center gap-4'} ${
          isLocked ? 'filter blur-[4px] grayscale-[35%] opacity-50 select-none pointer-events-none' : ''
        }`}>
          <div className={
            viewTemplate === 'grid' 
              ? 'w-full aspect-square bg-neutral-100 overflow-hidden relative' 
              : 'w-24 h-24 rounded-2xl flex-shrink-0 bg-neutral-100 overflow-hidden relative'
          }>
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500 font-extrabold text-2xl">
                {name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1 p-2 sm:p-3">
            <h3 className="font-bold text-neutral-900 text-base">{name}</h3>
            {description && <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{description}</p>}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-black text-orange-600 text-base">
                {restaurant.currency} {getProductPrice(product)}
              </span>
              {hasWhatsApp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({ ...product, name, description });
                  }}
                  className="bg-neutral-900 text-white p-2.5 rounded-xl hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
                  title={t('menu.add_to_order')}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Lock Overlay when Item is Locked */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-neutral-900/15 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center">
          <div className="bg-neutral-900/95 text-white border border-neutral-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 hover:scale-105 transition-transform">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
              <Lock size={14} />
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-amber-400 font-black uppercase tracking-wider">{t('menu.free_plan_limit')}</span>
              <span className="block text-xs font-extrabold text-white">{t('menu.tap_to_unlock')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  // Group products by category
  const categoriesWithProducts = activeLangCategories.map((cat, catIndex) => {
    const isCategoryLocked = isFreePlan && catIndex >= FREE_CATEGORY_LIMIT;
    const catProds = searchFilteredProducts.filter((p: any) => (p.categoryId || p.category_id) === cat.id);
    
    const items = catProds.map((product, pIndex) => {
      const isLocked = isCategoryLocked || (isFreePlan && pIndex >= FREE_PRODUCT_PER_CATEGORY_LIMIT);
      return { product, isLocked };
    });

    return { ...cat, isCategoryLocked, items };
  }).filter(c => c.items.length > 0);

  // Uncategorized products
  const categoryIdsSet = new Set(activeLangCategories.map(c => c.id));
  const uncategorizedProducts = searchFilteredProducts.filter((p: any) => {
    const catId = p.categoryId || p.category_id;
    return !catId || !categoryIdsSet.has(catId);
  }).map((product, pIndex) => {
    const isLocked = isFreePlan && pIndex >= FREE_PRODUCT_PER_CATEGORY_LIMIT;
    return { product, isLocked };
  });

  return (
    <div className={`min-h-screen bg-neutral-50 pb-32 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {isDemo && (
        <div className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center sticky top-0 z-[100] shadow-md flex items-center justify-center gap-2">
          <Sparkles size={12} />
          <span>{t('menu.live_demo')}</span>
          <Link to="/register" className="ml-2 bg-white text-orange-600 px-2 py-0.5 rounded font-bold hover:bg-neutral-100 transition-colors">
            {t('menu.create_own')}
          </Link>
        </div>
      )}
      
      {/* Language Floating Selector */}
      {availableLanguages.length > 1 && (
        <div className={`fixed top-4 ${isRTL ? 'left-4' : 'right-4'} z-[110]`}>
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="bg-white/90 backdrop-blur-md border border-neutral-200 rounded-2xl p-2.5 shadow-lg flex items-center justify-center hover:border-orange-300 transition-all active:scale-95"
              title="Select Language"
            >
              <Globe size={18} className="text-neutral-600" />
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setLangMenuOpen(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} w-40 bg-white rounded-2xl shadow-2xl border border-neutral-100 p-2 overflow-hidden`}
                  >
                    {availableLanguages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          i18n.language === lang.code 
                            ? 'bg-orange-50 text-orange-600' 
                            : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Restaurant Hero Banner & Brand Card */}
      <div className="bg-white border-b border-neutral-200/80 shadow-xs mb-2">
        {/* Banner Cover Image */}
        <div className="h-36 sm:h-52 w-full bg-neutral-900 relative overflow-hidden">
          {restaurant.coverUrl ? (
            <img 
              src={restaurant.coverUrl} 
              alt={restaurant.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 relative">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" 
                alt="Food Banner" 
                className="w-full h-full object-cover opacity-25 mix-blend-overlay"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>

        {/* Brand Information Header Card */}
        <div className="max-w-3xl mx-auto px-4 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
            {/* Logo Avatar */}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-xl ring-4 ring-white shrink-0 overflow-hidden ${isRTL ? 'mr-0' : 'mr-0'}`}>
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center overflow-hidden">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed size={36} className="text-white" />
                )}
              </div>
            </div>

            {/* Quick Action Badges / Status */}
            {hasWhatsApp && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:mb-1">
                <span className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs">
                  <Phone size={12} className="text-emerald-400" />
                  {t('menu.whatsapp_direct')}
                </span>
              </div>
            )}
          </div>

          {/* Restaurant Title & Info */}
          <div className="mt-4 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
              {restaurant.name}
            </h1>

            {restaurant.description && (
              <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {translateRestaurantDescription(restaurant, i18n.language)}
              </p>
            )}

            {restaurant.address && (
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-neutral-500 pt-1">
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <MapPin size={14} className="text-neutral-400" />
                  {restaurant.address}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Free Plan Banner Notice */}
        {alertMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4 text-sm font-bold flex items-center gap-2 shadow-md animate-bounce">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{alertMessage}</span>
          </div>
        )}
        {isFreePlan && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                <Lock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{t('menu.free_plan_limit')}</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-extrabold">{t('menu.limit_desc')}</span>
                </h4>
                <p className="text-xs text-neutral-600 font-medium mt-0.5">
                  {t('menu.limit_details')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{t('menu.upgrade_info')}</span>
            </button>
          </div>
        )}

        {/* Sticky Header Bar for Search & Categories */}
        <div className="sticky top-0 bg-neutral-50/95 backdrop-blur-md pt-4 pb-3 z-40 space-y-3 border-b border-neutral-200/60 mb-6 shadow-xs">
          {/* Search Bar & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-neutral-400`} size={18} />
              <input
                type="text"
                placeholder={t('menu.search_placeholder')}
                className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-2.5 rounded-2xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all bg-white text-sm`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setViewTemplate(prev => prev === 'list' ? 'grid' : 'list')}
              className="p-2.5 bg-white border border-neutral-200 hover:border-orange-300 rounded-2xl text-neutral-700 hover:text-orange-600 transition-all shadow-xs flex items-center justify-center shrink-0"
              title={`Switch to ${viewTemplate === 'list' ? 'Grid' : 'List'} View`}
            >
              {viewTemplate === 'list' ? (
                <LayoutGrid size={20} className="text-neutral-700" />
              ) : (
                <List size={20} className="text-neutral-700" />
              )}
            </button>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-xs transition-all ${
                selectedCategory === null 
                  ? 'bg-neutral-900 text-white shadow-md' 
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {t('menu.all_items')}
            </button>
            {activeLangCategories.map((cat, index) => {
              const isCategoryLocked = isFreePlan && index >= FREE_CATEGORY_LIMIT;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isCategoryLocked) {
                      setIsUpgradeModalOpen(true);
                    } else {
                      setSelectedCategory(cat.id);
                    }
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                    isCategoryLocked
                      ? 'bg-amber-50/90 text-neutral-600 border border-amber-300/80 cursor-pointer hover:bg-amber-100 hover:border-amber-400'
                      : selectedCategory === cat.id 
                        ? 'bg-neutral-900 text-white shadow-md' 
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {isCategoryLocked && <Lock size={12} className="text-amber-600 shrink-0" />}
                  <span className={isCategoryLocked ? 'filter blur-[1.5px] select-none' : ''}>{translateCategoryName(cat, i18n.language)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product List Breakdown */}
        {searchFilteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-xs">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} />
            </div>
            <p className="text-lg font-bold text-neutral-800">{t('menu.no_dishes')}</p>
            <p className="text-neutral-400 text-xs mt-1">{t('menu.try_another')}</p>
          </div>
        ) : selectedCategory === null ? (
          /* "ALL" VIEW: Categorized Breakdown */
          <div className="space-y-10">
            {categoriesWithProducts.map((cat) => (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                      <span className={cat.isCategoryLocked ? 'filter blur-[2.5px] select-none' : ''}>{translateCategoryName(cat, i18n.language)}</span>
                      {cat.isCategoryLocked && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300/80 shrink-0">
                          <Lock size={12} className="text-amber-700" /> {t('menu.locked_category')}
                        </span>
                      )}
                    </h2>
                  </div>
                  {cat.isCategoryLocked && (
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <span>{t('menu.upgrade_to_pro')}</span>
                      <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                  )}
                </div>

                <div className={viewTemplate === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'space-y-3'}>
                  {cat.items.map(({ product, isLocked }) => renderProductCard(product, isLocked))}
                </div>
              </div>
            ))}

            {/* Uncategorized items section if any */}
            {uncategorizedProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">{t('menu.other_items')}</h2>
                  </div>
                </div>

                <div className={viewTemplate === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'space-y-3'}>
                  {uncategorizedProducts.map(({ product, isLocked }) => renderProductCard(product, isLocked))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SINGLE CATEGORY VIEW */
          <div className="space-y-4">
            {(() => {
              const catIndex = activeLangCategories.findIndex(c => c.id === selectedCategory);
              const isCategoryLocked = isFreePlan && catIndex >= FREE_CATEGORY_LIMIT;
              const currentCat = activeLangCategories.find(c => c.id === selectedCategory);
              const catProds = searchFilteredProducts.filter((p: any) => (p.categoryId || p.category_id) === selectedCategory);

              return (
                <>
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                        <span className={isCategoryLocked ? 'filter blur-[2.5px] select-none' : ''}>{currentCat ? translateCategoryName(currentCat, i18n.language) : t('menu.category_items')}</span>
                        {isCategoryLocked && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300/80 shrink-0">
                            <Lock size={12} className="text-amber-700" /> {t('menu.locked_category')}
                          </span>
                        )}
                      </h2>
                    </div>
                    {isCategoryLocked && (
                      <button
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <span>{t('menu.upgrade_to_pro')}</span>
                        <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
                      </button>
                    )}
                  </div>

                  {catProds.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200">
                      <p className="text-sm font-semibold text-neutral-500">{t('menu.no_dishes_category')}</p>
                    </div>
                  ) : (
                    <div className={viewTemplate === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'space-y-3'}>
                      {catProds.map((product, pIndex) => {
                        const isLocked = isCategoryLocked || (isFreePlan && pIndex >= FREE_PRODUCT_PER_CATEGORY_LIMIT);
                        return renderProductCard(product, isLocked);
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer / Powered By */}
      <footer className="max-w-3xl mx-auto px-4 mt-16 text-center pb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-orange-600 transition-colors py-2 px-4 rounded-full bg-white/80 border border-neutral-200/80 shadow-xs hover:shadow-sm"
        >
          <span>{t('menu.made_with')}</span>
          <span className="font-extrabold text-neutral-800 flex items-center gap-1">
            <UtensilsCrossed size={12} className="text-orange-500" /> {t('menu.powered_by')}
          </span>
        </Link>
      </footer>

      {/* Cart Summary Bar */}
      {hasWhatsApp && cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50">
          <motion.button
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-neutral-900 text-white p-4 rounded-3xl flex items-center justify-between shadow-2xl hover:bg-neutral-800 transition-colors active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <span className="font-bold text-base">{t('menu.view_cart')}</span>
            </div>
            <span className="font-black text-lg">{restaurant.currency} {total.toFixed(2)}</span>
          </motion.button>
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {isProductModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Product Image in Modal */}
              <div className="h-64 sm:h-80 relative shrink-0">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={translateProduct(selectedProduct, i18n.language).name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-500 font-black text-6xl">
                    {translateProduct(selectedProduct, i18n.language).name.charAt(0)}
                  </div>
                )}
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 shadow-lg hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Product Info in Modal */}
              <div className="p-8 flex flex-col flex-1 overflow-y-auto">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h2 className="text-2xl font-black text-neutral-900 leading-tight">
                    {translateProduct(selectedProduct, i18n.language).name}
                  </h2>
                  <span className="text-2xl font-black text-orange-600 shrink-0">
                    {restaurant.currency} {getProductPrice(selectedProduct)}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {translateProduct(selectedProduct, i18n.language).description || t('menu.no_description')}
                  </p>
                </div>

                {hasWhatsApp && (
                  <div className="mt-8 pt-6 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        const { name, description } = translateProduct(selectedProduct, i18n.language);
                        addToCart({ ...selectedProduct, name, description });
                        setIsProductModalOpen(false);
                      }}
                      className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-black text-base shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <ShoppingBag size={20} />
                      {t('menu.add_to_order')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar/Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-0 bottom-0 w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl`}
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-orange-500" size={24} />
                  <h2 className="text-2xl font-extrabold text-neutral-900">{t('menu.your_order')}</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map((item) => {
                  const translated = translateProduct(item, i18n.language);
                  const displayName = translated.name || item.name;
                  
                  return (
                    <div key={item.id} className="flex items-center gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" alt={displayName} />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-orange-100 text-orange-500 font-bold flex items-center justify-center shrink-0">
                          {displayName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-neutral-900">{displayName}</h4>
                        <p className="text-xs font-semibold text-orange-600 mt-0.5">{restaurant.currency} {parseFloat(item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-neutral-200">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-700">
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-700">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-neutral-100 space-y-4 bg-white">
                <div className="flex justify-between items-center text-xl font-black text-neutral-900">
                  <span>{t('menu.total')}</span>
                  <span className="text-orange-600">{restaurant.currency} {total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-98"
                >
                  {t('menu.checkout')} <Send size={20} className={isRTL ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Upgrade Modal for Locked Content */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpgradeModalOpen(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl p-6 sm:p-8 z-[90] shadow-2xl border border-neutral-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-100 text-amber-800 p-2.5 rounded-2xl">
                    <Lock size={22} />
                  </div>
                  <div>
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">{t('menu.free_plan_limit')}</span>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight">{t('menu.upgrade_to_pro')}</h3>
                  </div>
                </div>
                <button onClick={() => setIsUpgradeModalOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100">
                  <X size={20} />
                </button>
              </div>

              <div className="py-5 space-y-4">
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  {t('menu.locked_item_desc', { name: restaurant.name })}
                </p>

                <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-black text-orange-900 uppercase tracking-wider">{t('menu.pro_benefits_title')}</h4>
                  <ul className="text-xs text-neutral-800 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>{t('menu.benefit_unlimited_products')}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>{t('menu.benefit_unlimited_categories')}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>{t('menu.benefit_full_visibility')}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/"
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3.5 rounded-2xl text-xs text-center transition-all shadow-md"
                >
                  {t('menu.learn_more')}
                </Link>
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="w-full text-neutral-500 hover:text-neutral-800 font-semibold py-2 text-xs"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

