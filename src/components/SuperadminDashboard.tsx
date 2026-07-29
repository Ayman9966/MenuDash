import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../lib/auth';
import { Restaurant } from '../types';
import { 
  Users, 
  Store, 
  Trash2, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Send,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface ExtendedRestaurant extends Restaurant {
  categoryCount?: number;
  productCount?: number;
}

export default function SuperadminDashboard() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<ExtendedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free' | 'expiring' | 'inactive'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ExtendedRestaurant | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const [customExpiryDate, setCustomExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const [resRest, resTel, resHealth] = await Promise.all([
        fetch('/api/admin/restaurants', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/telegram-status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/health')
      ]);

      if (resRest.ok) {
        const data = await resRest.json();
        setRestaurants(data);
      } else {
        const errorData = await resRest.json().catch(() => ({}));
        setMessage({ type: 'error', text: `Failed to fetch restaurants: ${errorData.error || resRest.statusText}` });
      }

      if (resTel.ok) {
        const data = await resTel.json();
        setTelegramStatus(data);
      }

      if (resHealth.ok) {
        const data = await resHealth.json();
        setHealthStatus(data);
      }
    } catch (err: any) {
      console.error('Error fetching superadmin data:', err);
      setMessage({ type: 'error', text: `Connection error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const handleDeleteRestaurant = (id: string, name: string) => {
    setConfirmationModal({
      show: true,
      title: t('superadmin.confirm_deletion'),
      message: t('superadmin.confirm_deletion_desc', { name }),
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const res = await fetch(`/api/admin/restaurants/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ type: 'success', text: `${name} has been deleted successfully.` });
            setRestaurants(prev => prev.filter(r => r.id !== id));
            setSelectedRestaurant(null);
          } else {
            setMessage({ type: 'error', text: data.error || 'Failed to delete restaurant.' });
          }
        } catch (err) {
          setMessage({ type: 'error', text: 'An error occurred during deletion.' });
        } finally {
          setConfirmationModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleActivatePlan = (restaurantId: string, expireDate: string, planName: string) => {
    setConfirmationModal({
      show: true,
      title: t('superadmin.confirm_plan_update'),
      message: t('superadmin.confirm_plan_update_desc', { plan: planName }),
      type: 'info',
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const res = await fetch('/api/admin/activate-plan', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ restaurantId, expireDate })
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ type: 'success', text: 'Plan updated successfully.' });
            fetchData(); // Refresh list
            setSelectedRestaurant(null);
          } else {
            setMessage({ type: 'error', text: data.error || 'Failed to update plan.' });
          }
        } catch (err) {
          setMessage({ type: 'error', text: 'An error occurred while updating plan.' });
        } finally {
          setConfirmationModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const counts = {
    all: restaurants.length,
    premium: restaurants.filter(r => r.plan === 'premium').length,
    free: restaurants.filter(r => r.plan === 'free').length,
    inactive: restaurants.filter(r => r.plan === 'free' && (r.productCount === 0)).length,
    expiring: restaurants.filter(r => isExpiringSoon(r.planExpiresAt)).length
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'premium') return r.plan === 'premium';
    if (filter === 'free') return r.plan === 'free';
    if (filter === 'inactive') return r.plan === 'free' && (r.productCount === 0);
    if (filter === 'expiring') return isExpiringSoon(r.planExpiresAt);
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 flex items-center gap-2">
            <ShieldAlert className="text-orange-500" size={32} />
            {t('superadmin.title')}
          </h1>
          <p className="text-neutral-500 font-medium">{t('superadmin.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {healthStatus && (
            <div className={`border rounded-2xl p-4 flex items-center gap-4 ${healthStatus.database.includes('Connected') ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`${healthStatus.database.includes('Connected') ? 'bg-green-500' : 'bg-red-500'} text-white p-2.5 rounded-xl shadow-sm`}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase tracking-wider">System Health</p>
                <p className={`text-sm font-bold ${healthStatus.database.includes('Connected') ? 'text-green-600' : 'text-red-600'}`}>
                  {healthStatus.database.includes('Connected') ? 'Database Online' : 'Database Error'}
                </p>
                <p className="text-[10px] text-neutral-400 font-bold">
                  {healthStatus.vercel ? 'Vercel Deployment' : 'Local/AI Studio'}
                </p>
              </div>
            </div>
          )}
          {telegramStatus && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-blue-500 text-white p-2.5 rounded-xl shadow-sm">
                <Send size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Telegram Admin Bot</p>
                <p className="text-sm font-bold text-blue-600">@{telegramStatus.botUsername}</p>
                <p className="text-[10px] text-blue-400 font-bold">{telegramStatus.adminChatCount} Admins Connected</p>
                {process.env.NODE_ENV === 'production' && (
                  <button 
                    onClick={async () => {
                      const url = window.prompt('Enter your Vercel deployment URL (e.g. https://my-app.vercel.app):');
                      if (url) {
                        const webhookUrl = `${url.replace(/\/$/, '')}/api/telegram-webhook`;
                        try {
                          const res = await fetch('/api/admin/setup-telegram-webhook', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${getAuthToken()}`
                            },
                            body: JSON.stringify({ url: webhookUrl })
                          });
                          const data = await res.json();
                          if (data.ok) {
                            alert('Webhook set successfully!');
                            fetchData();
                          } else {
                            alert('Failed to set webhook: ' + (data.description || 'Unknown error'));
                          }
                        } catch (err) {
                          alert('Error: ' + err);
                        }
                      }
                    }}
                    className="mt-1 text-[10px] text-blue-700 underline hover:no-underline font-bold"
                  >
                    Setup Webhook for Vercel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70 transition-opacity">
              <AlertCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <p className="text-3xl font-black text-neutral-900">{restaurants.length}</p>
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{t('superadmin.total_restaurants')}</p>
        </div>
        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <p className="text-3xl font-black text-neutral-900">{restaurants.filter(r => r.plan === 'premium').length}</p>
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{t('superadmin.active_premium')}</p>
        </div>
        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="bg-neutral-50 text-neutral-600 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <p className="text-3xl font-black text-neutral-900">{restaurants.length}</p>
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{t('superadmin.registered_owners')}</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-black text-neutral-900">{t('superadmin.tenant_management')}</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder={t('superadmin.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'all', label: t('dashboard.all_categories'), count: counts.all, bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-100' },
              { id: 'premium', label: 'Pro', count: counts.premium, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
              { id: 'free', label: 'Free', count: counts.free, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
              { id: 'inactive', label: 'Inactive', count: counts.inactive, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
              { id: 'expiring', label: 'Expiring', count: counts.expiring, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
            ].map((stat) => (
              <div 
                key={stat.id}
                className={`${stat.bg} ${stat.border} border p-3 rounded-2xl transition-all cursor-default`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">{stat.label}</p>
                <p className={`text-xl font-black ${stat.text}`}>{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'all', label: t('dashboard.all_categories'), icon: Store, count: counts.all, color: 'text-neutral-500' },
              { id: 'premium', label: 'Pro', icon: CreditCard, count: counts.premium, color: 'text-emerald-500' },
              { id: 'free', label: 'Free', icon: Layers, count: counts.free, color: 'text-blue-500' },
              { id: 'inactive', label: 'Inactive Free', icon: ShieldAlert, count: counts.inactive, color: 'text-rose-500' },
              { id: 'expiring', label: 'Expiring Soon', icon: Calendar, count: counts.expiring, color: 'text-amber-500' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  filter === btn.id 
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' 
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <btn.icon size={14} />
                <span>{btn.label}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                  filter === btn.id ? 'bg-white/20 text-white' : `bg-neutral-100 ${btn.color}`
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Restaurant</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Stats</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('dashboard.plans')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRestaurants.map((r) => (
                <tr 
                  key={r.id} 
                  className={`hover:bg-neutral-50/50 transition-colors cursor-pointer ${isExpiringSoon(r.planExpiresAt) ? 'bg-amber-50/30' : ''}`}
                  onClick={() => setSelectedRestaurant(r)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                        {r.logoUrl ? (
                          <img src={r.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store size={20} className="text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-neutral-900">{r.name}</p>
                          {isExpiringSoon(r.planExpiresAt) && (
                            <span className="flex items-center gap-1 text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">
                              <AlertCircle size={8} /> {t('superadmin.plan_expiring')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-neutral-500">ID: {r.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <p className="text-xs font-black text-neutral-700">{r.categoryCount}</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">{t('dashboard.categories')}</p>
                      </div>
                      <div className="w-px h-4 bg-neutral-100" />
                      <div className="text-center">
                        <p className="text-xs font-black text-neutral-700">{r.productCount}</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">{t('dashboard.products')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${
                        r.plan === 'premium' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <CreditCard size={10} />
                        {r.plan?.toUpperCase()}
                      </div>
                      {r.planExpiresAt && (
                        <p className={`text-[10px] flex items-center gap-1 font-bold ${isExpiringSoon(r.planExpiresAt) ? 'text-amber-600' : 'text-neutral-500'}`}>
                          <Calendar size={10} />
                          {r.planExpiresAt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 text-orange-500 font-bold text-xs">
                      {t('superadmin.view_details')}
                      <ChevronRight size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRestaurants.length === 0 && (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <Store size={48} className="mx-auto text-neutral-200" />
              <p className="font-bold">{t('superadmin.no_match')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRestaurant && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRestaurant(null)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] overflow-y-auto"
            >
              <div className="h-32 sm:h-40 relative shrink-0">
                {selectedRestaurant.coverUrl ? (
                  <img src={selectedRestaurant.coverUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-neutral-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  onClick={() => setSelectedRestaurant(null)}
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all z-10"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
                <div className="absolute bottom-4 left-6 flex items-center gap-3 pr-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-lg overflow-hidden shrink-0">
                    {selectedRestaurant.logoUrl ? (
                      <img src={selectedRestaurant.logoUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Store size={24} className="text-neutral-400 w-full h-full flex items-center justify-center" />
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">{selectedRestaurant.name}</h3>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {isExpiringSoon(selectedRestaurant.planExpiresAt) && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                    <div className="bg-amber-500 text-white p-2 rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-wider">{t('superadmin.plan_expiring')}</p>
                      <p className="text-xs font-bold text-amber-600">{t('superadmin.plan_expiring_desc', { date: selectedRestaurant.planExpiresAt })}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Plan</p>
                    <div className={`text-xs font-bold uppercase inline-flex items-center gap-1 ${
                      selectedRestaurant.plan === 'premium' ? 'text-emerald-600' : 'text-neutral-600'
                    }`}>
                      {selectedRestaurant.plan}
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{t('settings.currency')}</p>
                    <p className="text-xs font-bold text-neutral-900">{selectedRestaurant.currency || '$'}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">{t('dashboard.categories')}</p>
                    <div className="text-xs font-black text-orange-600 flex items-center gap-1">
                      <Layers size={14} />
                      {selectedRestaurant.categoryCount}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.products')}</p>
                    <div className="text-xs font-black text-blue-600 flex items-center gap-1">
                      <Package size={14} />
                      {selectedRestaurant.productCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{t('superadmin.identification')}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 gap-4">
                        <span className="text-xs font-bold text-neutral-500 shrink-0">{t('superadmin.restaurant_id')}</span>
                        <code className="text-[10px] font-mono font-bold text-neutral-900 truncate">{selectedRestaurant.id}</code>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 gap-4">
                        <span className="text-xs font-bold text-neutral-500 shrink-0">{t('superadmin.owner_id')}</span>
                        <code className="text-[10px] font-mono font-bold text-neutral-900 truncate">{selectedRestaurant.ownerId}</code>
                      </div>
                      {selectedRestaurant.whatsappNumber && (
                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 gap-4">
                          <span className="text-xs font-bold text-neutral-500 shrink-0">{t('settings.whatsapp')}</span>
                          <span className="text-xs font-bold text-neutral-900 truncate">{selectedRestaurant.whatsappNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 gap-4">
                        <span className="text-xs font-bold text-neutral-500 shrink-0">{t('superadmin.public_link')}</span>
                        <a 
                          href={`/menu/${selectedRestaurant.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 truncate"
                        >
                          /menu/{selectedRestaurant.slug}
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {selectedRestaurant.description && (
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{t('settings.description')}</p>
                      <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                        {selectedRestaurant.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{t('superadmin.plan_management')}</p>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                      <input 
                        type="date"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm font-bold text-neutral-700"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleActivatePlan(selectedRestaurant.id, customExpiryDate, `PRO until ${customExpiryDate}`)}
                        className="bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard size={18} />
                        {t('superadmin.activate_pro')}
                      </button>
                      <button 
                        onClick={() => handleActivatePlan(selectedRestaurant.id, 'free', 'FREE')}
                        className="bg-neutral-100 text-neutral-600 py-3.5 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all"
                      >
                        {t('superadmin.set_to_free')}
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteRestaurant(selectedRestaurant.id, selectedRestaurant.name)}
                      className="w-full bg-rose-50 text-rose-500 py-3.5 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {t('superadmin.delete_restaurant')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmationModal.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmationModal(prev => ({ ...prev, show: false }))}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center my-auto"
            >
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                confirmationModal.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {confirmationModal.type === 'danger' ? <Trash2 size={32} /> : <ShieldAlert size={32} />}
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">{confirmationModal.title}</h3>
              <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
                {confirmationModal.message}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmationModal.onConfirm}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all ${
                    confirmationModal.type === 'danger' 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200'
                  }`}
                >
                  {t('common.save')}
                </button>
                <button 
                  onClick={() => setConfirmationModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-neutral-500 hover:bg-neutral-100 transition-all"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
