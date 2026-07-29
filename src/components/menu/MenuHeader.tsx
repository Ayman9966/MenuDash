import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Info, Globe, ChevronDown } from 'lucide-react';
import { Restaurant } from '../../types';

interface MenuHeaderProps {
  restaurant: Restaurant;
  languages: string[];
  currentLang: string;
  onLangChange: (lang: string) => void;
  onShowInfo: () => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ 
  restaurant, 
  languages, 
  currentLang, 
  onLangChange, 
  onShowInfo 
}) => {
  const { t } = useTranslation();

  const getLanguageLabel = (code: string) => {
    const labels: Record<string, string> = { en: 'EN', fr: 'FR', ar: 'AR' };
    return labels[code] || code.toUpperCase();
  };

  return (
    <header className="relative bg-white border-b border-neutral-100 overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 sm:h-64 w-full bg-neutral-900 relative">
        {restaurant.coverUrl ? (
          <img 
            src={restaurant.coverUrl} 
            alt={restaurant.name} 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 opacity-60" />
        )}
        
        {/* Language Selector Top Right */}
        {languages.length > 1 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg font-black text-xs text-neutral-900 border border-white/50">
                <Globe size={14} className="text-orange-500" />
                {getLanguageLabel(currentLang)}
                <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-28 bg-white rounded-2xl shadow-2xl border border-neutral-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform origin-top-right scale-95 group-hover:scale-100 p-1">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => onLangChange(lang)}
                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentLang === lang ? 'bg-orange-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {getLanguageLabel(lang)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restaurant Info Overlay */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16 pb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2rem] sm:rounded-[2.5rem] p-1.5 shadow-2xl relative z-10 border-4 border-white overflow-hidden">
            {restaurant.logoUrl ? (
              <img 
                src={restaurant.logoUrl} 
                alt={restaurant.name} 
                className="w-full h-full object-cover rounded-[1.5rem] sm:rounded-[2rem]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-orange-100 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-orange-500 text-3xl font-black">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">{restaurant.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm font-bold text-neutral-500">
              {restaurant.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-orange-500" />
                  <span className="truncate max-w-[200px]">{restaurant.address}</span>
                </div>
              )}
              <button 
                onClick={onShowInfo}
                className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <Info size={16} />
                {t('menu.more_info')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
