import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, CheckCircle } from 'lucide-react';
import { Restaurant } from '../../types';
import { getAuthToken } from '../../lib/auth';

interface SettingsTabProps {
  restaurant: Restaurant | null;
  onSave: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ restaurant, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    slug: restaurant?.slug || '',
    description: restaurant?.description || '',
    whatsappNumber: restaurant?.whatsappNumber || '',
    address: restaurant?.address || '',
    currency: restaurant?.currency || 'USD',
    template: restaurant?.template || 'list',
    languages: restaurant?.languages || 'en',
    defaultLanguage: restaurant?.defaultLanguage || 'en'
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableLanguages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' }
  ];

  const handleLanguageToggle = (code: string) => {
    const enabled = formData.languages.split(',').filter(Boolean);
    let newEnabled;
    if (enabled.includes(code)) {
      if (enabled.length === 1) return;
      newEnabled = enabled.filter(c => c !== code);
    } else {
      newEnabled = [...enabled, code];
    }
    
    const newLangs = newEnabled.join(',');
    let newDefault = formData.defaultLanguage;
    if (!newEnabled.includes(newDefault)) {
      newDefault = newEnabled[0];
    }
    
    setFormData({ ...formData, languages: newLangs, defaultLanguage: newDefault });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/restaurant', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Settings saved successfully!');
        onSave();
      } else {
        setErrorMessage(data.error || 'Failed to save restaurant settings');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-neutral-200 animate-in slide-in-from-bottom-4 duration-500 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{t('settings.title')}</h2>
          <p className="text-xs text-neutral-500 mt-1">{t('settings.title_desc')}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={18} className="shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">{t('settings.restaurant_name')}</label>
          <input
            required
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">{t('settings.slug')}</label>
          <input
            required
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700 flex items-center justify-between">
            <span>{t('settings.whatsapp')}</span>
            {!formData.whatsappNumber.trim() ? (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {t('settings.whatsapp_view_only')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {t('settings.whatsapp_enabled')}
              </span>
            )}
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            value={formData.whatsappNumber}
            placeholder={t('settings.whatsapp_placeholder')}
            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
          />
          {!formData.whatsappNumber.trim() ? (
            <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 mt-1">
              <AlertCircle size={14} /> {t('settings.whatsapp_empty_warning')}
            </p>
          ) : (
            <p className="text-xs text-neutral-500 mt-1">
              {t('settings.whatsapp_help')}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">{t('settings.currency')}</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            value={formData.currency}
            placeholder={t('settings.currency_placeholder')}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
        <div className="space-y-4">
          <label className="text-sm font-semibold text-neutral-700 block">{t('settings.languages')}</label>
          <div className="flex flex-wrap gap-3">
            {availableLanguages.map(lang => {
              const isEnabled = formData.languages.split(',').includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageToggle(lang.code)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                    isEnabled 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200' 
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.label}
                  {isEnabled && <CheckCircle size={14} className="ml-1" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-neutral-500">{t('settings.languages_help')}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">{t('settings.default_lang')}</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-neutral-700 bg-white"
            value={formData.defaultLanguage}
            onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
          >
            {availableLanguages.filter(l => formData.languages.split(',').includes(l.code)).map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500">{t('settings.default_lang_help')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700">{t('settings.description')}</label>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all h-24 resize-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg shadow-orange-200"
      >
        {saving ? t('common.loading') : t('common.save')}
      </button>
    </form>
  );
};
