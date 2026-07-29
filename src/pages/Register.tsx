import { useState } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, User as UserIcon, Lock, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        <div className="hidden lg:flex flex-col gap-8">
          <h1 className="text-5xl font-extrabold text-neutral-900 leading-tight">
            {t('auth.register_title')}
          </h1>
          <div className="space-y-4">
            <Benefit text={t('landing.benefit1')} />
            <Benefit text={t('landing.benefit2')} />
            <Benefit text={t('landing.benefit3')} />
            <Benefit text={t('landing.benefit4')} />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">{t('nav.register')}</h2>
            <p className="text-neutral-500">{t('auth.register_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
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
              <label className="text-sm font-semibold text-neutral-700 ml-1">{t('auth.mobile_label')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                   type="tel"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder={t('auth.password_hint')}
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
                  {t('nav.register')} <UserPlus size={20} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-neutral-600">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-orange-500 font-bold hover:underline">
              {t('nav.login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-lg font-medium text-neutral-700">
      <CheckCircle2 className="text-orange-500" size={24} />
      <span>{text}</span>
    </div>
  );
}
