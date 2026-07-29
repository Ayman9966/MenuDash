import { ShoppingCart, User, Menu as MenuIcon, LogOut, LayoutDashboard, PlusCircle, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('menu_dash_lang_selected', 'true');
    setLangMenuOpen(false);
  };

  // Hide Navbar completely on public customer menu pages
  if (location.pathname.startsWith('/menu/')) {
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
              <MenuIcon size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">MenuDash</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2.5 rounded-xl hover:bg-neutral-100 transition-all text-neutral-600 border border-neutral-200/80 bg-white shadow-xs flex items-center justify-center"
                title="Select Language"
              >
                <Globe size={18} className="text-neutral-600" />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setLangMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-[70] overflow-hidden"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all hover:bg-neutral-50 ${
                            i18n.language === lang.code ? 'text-orange-500 bg-orange-50/30' : 'text-neutral-600'
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

            {user ? (
              <>
                <Link to="/dashboard" className="text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
                  <LayoutDashboard size={20} />
                  <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="text-neutral-600 hover:text-neutral-900 font-medium">
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
