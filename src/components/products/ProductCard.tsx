import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Star } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  currency: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  currency, 
  onEdit, 
  onDelete, 
  onToggleAvailability 
}) => {
  const { t, i18n } = useTranslation();
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

  return (
    <div className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden transition-all hover:shadow-md ${!product.isAvailable ? 'opacity-60' : ''}`}>
      <div className="aspect-video relative overflow-hidden bg-neutral-100">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={getName()} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            No Image
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-amber-400 text-white p-1.5 rounded-lg shadow-sm">
            <Star size={14} fill="currentColor" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-neutral-900 line-clamp-1">{getName()}</h4>
          <span className="font-black text-orange-600 shrink-0">{product.price} {currency}</span>
        </div>
        <p className="text-xs text-neutral-500 line-clamp-2 min-h-[2rem]">{getDescription()}</p>
        
        <div className="pt-3 flex items-center justify-between border-t border-neutral-50">
          <button
            onClick={() => onToggleAvailability(product)}
            className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
              product.isAvailable 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
            }`}
          >
            {product.isAvailable ? t('products.available') : t('products.unavailable')}
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('common.edit')}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
