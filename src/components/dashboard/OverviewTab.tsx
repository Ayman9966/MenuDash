import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UtensilsCrossed, 
  ExternalLink 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Restaurant, User } from '../../types';

interface OverviewTabProps {
  user: User | null;
  restaurant: Restaurant | null;
  setActiveTab: (tab: any) => void;
}

const StatCard = ({ title, value, description }: { title: string; value: string; description: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-2xl font-bold text-neutral-900 break-all">{value}</p>
    </div>
    <p className="text-sm text-neutral-400 mt-4">{description}</p>
  </div>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, restaurant, setActiveTab }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {restaurant?.name || user?.username}</h1>
          <p className="text-neutral-500">{t('dashboard.manage_menu')}</p>
        </div>
        {restaurant && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('products')}
              className="flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-100 transition-colors"
            >
              <UtensilsCrossed size={16} /> {t('dashboard.manage_items')}
            </button>
            <a 
              href={`/menu/${restaurant.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              {t('dashboard.view_live')} <ExternalLink size={16} />
            </a>
          </div>
        )}
      </header>

      {!restaurant ? (
        <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl text-center">
          <h2 className="text-2xl font-bold mb-2">{t('dashboard.create_restaurant')}</h2>
          <p className="text-orange-800 mb-6">{t('dashboard.no_restaurant')}</p>
          <button 
            onClick={() => setActiveTab('settings')}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            {t('dashboard.setup_now')}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title={t('dashboard.menu_link')} 
            value={`/${restaurant.slug}`} 
            description={t('dashboard.url_desc')} 
          />
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col items-center gap-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{t('dashboard.qr_code')}</h3>
            <div className="bg-neutral-50 p-4 rounded-2xl">
              <QRCodeSVG value={`${window.location.origin}/menu/${restaurant.slug}`} size={120} />
            </div>
            <p className="text-xs text-neutral-400 text-center">{t('dashboard.qr_desc')}</p>
          </div>
          <StatCard 
            title={t('dashboard.current_plan')} 
            value={restaurant.plan === 'premium' ? t('dashboard.pro_plan') : t('dashboard.free_plan')} 
            description={
              restaurant.plan === 'premium' && restaurant.planExpiresAt
                ? `${t('dashboard.active_until')} ${restaurant.planExpiresAt}`
                : restaurant.planExpiresAt
                ? `${t('dashboard.expired_on')} ${restaurant.planExpiresAt}`
                : t('dashboard.standard_features')
            } 
          />
        </div>
      )}
    </div>
  );
};
