import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MESSAGES: Record<string, { welcome: string; select: string }> = {
  en: {
    welcome: 'Welcome',
    select: 'Please select your preferred language to continue.'
  },
  fr: {
    welcome: 'Bienvenue',
    select: 'Veuillez sélectionner votre langue.'
  },
  ar: {
    welcome: 'أهلاً بك',
    select: 'الرجاء اختيار لغتك المفضلة للمتابعة.'
  }
};

export default function LanguageModal() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = localStorage.getItem('menu_dash_lang_selected');
    if (!selected) {
      setIsOpen(true);
    }
  }, []);

  const currentLangCode = i18n.language && MESSAGES[i18n.language] ? i18n.language : 'en';
  const currentMsg = MESSAGES[currentLangCode] || MESSAGES.en;

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('menu_dash_lang_selected', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl shadow-2xl border border-neutral-100 max-w-sm w-full p-6 text-center overflow-hidden relative"
          >
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Globe size={28} />
            </div>

            <h2 className="text-2xl font-black text-neutral-900 mb-1.5">
              {currentMsg.welcome}
            </h2>
            <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
              {currentMsg.select}
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`w-full py-3 px-5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-xs ${
                  currentLangCode === 'en'
                    ? 'border-orange-500 bg-orange-50/40 text-orange-600 font-bold'
                    : 'border-neutral-200 hover:border-orange-400 hover:bg-orange-50/20 text-neutral-800 font-medium'
                }`}
              >
                <span>English</span>
                <span className="text-xs text-neutral-400 font-normal">EN</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('fr')}
                className={`w-full py-3 px-5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-xs ${
                  currentLangCode === 'fr'
                    ? 'border-orange-500 bg-orange-50/40 text-orange-600 font-bold'
                    : 'border-neutral-200 hover:border-orange-400 hover:bg-orange-50/20 text-neutral-800 font-medium'
                }`}
              >
                <span>Français</span>
                <span className="text-xs text-neutral-400 font-normal">FR</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('ar')}
                className={`w-full py-3 px-5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-xs rtl:flex-row-reverse ${
                  currentLangCode === 'ar'
                    ? 'border-orange-500 bg-orange-50/40 text-orange-600 font-bold'
                    : 'border-neutral-200 hover:border-orange-400 hover:bg-orange-50/20 text-neutral-800 font-medium'
                }`}
              >
                <span>العربية</span>
                <span className="text-xs text-neutral-400 font-normal">AR</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
