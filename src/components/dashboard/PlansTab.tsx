import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { Restaurant } from '../../types';

interface PlansTabProps {
  restaurant: Restaurant | null;
}

export const PlansTab: React.FC<PlansTabProps> = ({ restaurant }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-neutral-100 text-neutral-600 text-xs font-bold px-3 py-1 rounded-full">
                ⚪️ {t('dashboard.free_plan')}
              </span>
              <span className="text-2xl font-black text-neutral-900">$0</span>
            </div>
            <p className="text-neutral-600 text-xs mb-4">
              Best for testing and small establishments.
            </p>
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-neutral-400">{t('dashboard.includes')}:</p>
              <ul className="space-y-1.5 text-xs text-neutral-900 font-medium">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> Basic Menu Listing</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> Limited Products</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> One Menu Template</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between transition-all relative ${
          restaurant?.plan === 'premium' ? 'border-orange-500 shadow-xl ring-4 ring-orange-50' : 'border-neutral-200 shadow-sm'
        }`}>
          <div className="absolute -top-3 right-6 bg-orange-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
            {restaurant?.plan === 'premium' ? t('dashboard.already_subscribed') : 'Recommended'}
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                🔵 {t('dashboard.pro_plan')}
              </span>
              <span className="text-2xl font-black text-neutral-900">$19 <span className="text-xs font-normal text-neutral-500">/ mo</span></span>
            </div>
            <p className="text-neutral-600 text-xs mb-4">
              Perfect for restaurants ready to publish their complete menu.
            </p>
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-neutral-400">{t('dashboard.includes')} Everything in Free, plus:</p>
              <ul className="space-y-1.5 text-xs text-neutral-900 font-medium">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Unlimited Products</strong></li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Unlimited Categories</strong></li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Priority Support</strong></li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
            {restaurant?.plan === 'premium' ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 rounded-xl">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldCheck size={16} className="text-blue-600" />
                  {t('dashboard.pro_plan')} {t('dashboard.already_subscribed')}
                </div>
                {restaurant.planExpiresAt && (
                  <p className="text-blue-700 font-medium">{t('dashboard.active_until')}: <span className="font-bold underline">{restaurant.planExpiresAt}</span></p>
                )}
              </div>
            ) : (
              <button
                onClick={() => alert('To upgrade to Pro, please contact support!')}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
              >
                {t('dashboard.upgrade_pro_btn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
