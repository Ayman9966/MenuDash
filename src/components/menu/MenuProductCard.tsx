import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Star } from 'lucide-react';
import { Product } from '../../types';

interface MenuProductCardProps {
  product: Product;
  currency: string;
  onClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const MenuProductCard: React.FC<MenuProductCardProps> = ({ 
  product, 
  currency, 
  onClick, 
  onAddToCart 
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const getName = () => {
    if (currentLang === 'ar') return product.name_ar || product.name;
    if (currentLang === 'fr') return product.name_fr || product.name;
    return product.name_en || product.name;
  };

  const getDescription = () => {
    if (currentLang === 'ar') return product.description_ar || product.description;
    if (currentLang === 'fr') return product.description_fr || product.description;
    return product.description_en || product.description;
  };

  if (!product.isAvailable) return null;

  return (
    <div 
      onClick={() => onClick(product)}
      className="group bg-white rounded-[2rem] border border-neutral-100 p-3 sm:p-4 transition-all hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer flex flex-row items-center gap-4 sm:gap-6"
    >
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 shrink-0 relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={getName()} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-200">
            <Plus size={24} />
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-1 left-1 bg-amber-400 text-white p-1 rounded-lg shadow-sm">
            <Star size={10} fill="currentColor" />
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-black text-neutral-900 text-sm sm:text-base tracking-tight line-clamp-1">{getName()}</h3>
          <span className="font-black text-orange-600 shrink-0 text-sm sm:text-base">{product.price} {currency}</span>
        </div>
        <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed h-8">
          {getDescription()}
        </p>
        
        {onAddToCart && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="bg-neutral-50 hover:bg-orange-500 hover:text-white text-neutral-400 p-1.5 rounded-xl transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
