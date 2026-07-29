import { useEffect, useState } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '../types';
import { 
  Settings, 
  FileUp, 
  Layout, 
  Store,
  CreditCard,
  UtensilsCrossed,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import ProductsManager from '../components/ProductsManager';
import SuperadminDashboard from '../components/SuperadminDashboard';
import { useTranslation } from 'react-i18next';

// Tab Components
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { SettingsTab } from '../components/dashboard/SettingsTab';
import { ImportTab } from '../components/dashboard/ImportTab';
import { PlansTab } from '../components/dashboard/PlansTab';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logoutUser, setUser } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'import' | 'products' | 'plans'>('overview');

  const fetchUserAndRestaurant = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        logoutUser();
        navigate('/login');
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        logoutUser();
        navigate('/login');
        return;
      }

      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
      }
      
      if (data.restaurant) {
        setRestaurant(data.restaurant);
        if (data.restaurant.name) {
          document.title = `${data.restaurant.name} | Dashboard`;
        }
      }
    } catch (err) {
      console.error(err);
      logoutUser();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndRestaurant();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (user?.role === 'superadmin') {
    return <SuperadminDashboard />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-r border-neutral-200 p-6 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Store size={22} />
          </div>
          <div>
            <p className="font-black text-neutral-900 leading-tight">MenuQuick</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Dashboard</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <SidebarItem 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={<Layout size={20} />} 
            label={t('dashboard.overview')} 
          />
          <SidebarItem 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            icon={<UtensilsCrossed size={20} />} 
            label={t('dashboard.menu_items')} 
          />
          <SidebarItem 
            active={activeTab === 'import'} 
            onClick={() => setActiveTab('import')} 
            icon={<FileUp size={20} />} 
            label={t('dashboard.import_csv')} 
          />
          <SidebarItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20} />} 
            label={t('dashboard.settings')} 
          />
          <SidebarItem 
            active={activeTab === 'plans'} 
            onClick={() => setActiveTab('plans')} 
            icon={<CreditCard size={20} />} 
            label={t('dashboard.plans')} 
          />
        </nav>

        <div className="pt-6 border-t border-neutral-100">
          <button 
            onClick={logoutUser}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full"
          >
            <LogOut size={20} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab 
              user={user} 
              restaurant={restaurant} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'products' && (
            <ProductsManager 
              restaurant={restaurant} 
              onNavigateImport={() => setActiveTab('import')} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              restaurant={restaurant} 
              onSave={fetchUserAndRestaurant} 
            />
          )}

          {activeTab === 'import' && (
            <ImportTab restaurant={restaurant} />
          )}

          {activeTab === 'plans' && (
            <PlansTab restaurant={restaurant} />
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
        active 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
