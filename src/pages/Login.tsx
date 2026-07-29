import { useState } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('auth.login_title')}</h1>
          <p className="text-neutral-500">{t('auth.login_subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 ml-1">{t('auth.username_label')}</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                placeholder={t('auth.username_placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 ml-1">{t('auth.password_label')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : (
              <>
                {t('nav.login')} <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-neutral-600">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-orange-500 font-bold hover:underline">
            {t('nav.register')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
