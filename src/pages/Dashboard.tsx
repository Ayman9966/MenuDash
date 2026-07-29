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
  AlertCircle, 
  CheckCircle,
  Check,
  ExternalLink,
  Download,
  FileSpreadsheet,
  Sparkles,
  UtensilsCrossed,
  CreditCard,
  Copy,
  ShieldCheck,
  Store
} from 'lucide-react';
import { motion } from 'motion/react';
import ProductsManager from '../components/ProductsManager';
import * as XLSX from 'xlsx';

const SAMPLE_CSV_MULTILINGUAL = `category_en,category_fr,category_ar,name_en,name_fr,name_ar,description_en,description_fr,description_ar,price,imageUrl
Starters,Entrées,المقبلات,Truffle Arancini,Arancini à la Truffe,أرانشيني الكمأة,Crispy golden risotto spheres infused with black truffle cream.,Boules de risotto croustillantes infusées à la truffe noire.,كرات الأرز المقرمشة بالكمأة السوداء.,14.50,https://images.unsplash.com/photo-1541529086526-db283c563270?w=600
Starters,Entrées,المقبلات,Burrata Caprese,Burrata Capres,براتا كابريس,Fresh creamy Puglia burrata with heirloom tomatoes.,Burrata crémeuse fraîche avec tomates anciennes.,جبنة براتا طازجة مع طماطم heirloom.,16.00,https://images.unsplash.com/photo-1592417817098-8f3d691a4bf5?w=600
Main Course,Plats Principaux,الأطباق الرئيسية,Wagyu Ribeye Steak,Entrecôte de Bœuf Wagyu,ستيك ريب أي واغيو,Grilled premium Wagyu ribeye with garlic herb butter.,Entrecôte Wagyu grillée de première qualité avec beurre aux herbes.,ستيك ريب أي واغيو مشوي مع زبدة الأعشاب.,38.00,https://images.unsplash.com/photo-1544025162-d76694265947?w=600
Main Course,Plats Principaux,الأطباق الرئيسية,Lobster Linguine,Linguines au Homard,لينغويني الكركند,Fresh handmade pasta with succulent Maine lobster.,Pâtes fraîches artisanales au homard du Maine.,مكرونة طازجة محلية الصنع مع كركند.,32.50,https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600
Pizzas,Pizzas,البيتزا,Truffle Prosciutto Pizza,Pizza Prosciutto et Truffe,بيتزا بروسشوتو بالكمأة,Wood-fired pizza with San Marzano tomatoes and prosciutto.,Pizza au feu de bois avec tomates San Marzano et prosciutto.,بيتزا مطبوخة على الحطب مع طماطم سان مارزانو وبروسشوتو.,22.00,https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600
Desserts,Desserts,الحلويات,Artisan Tiramisu,Tiramisu Artisanal,تيراميسو فاخر,Classic Italian espresso-soaked savoiardi with rich mascarpone.,Tiramisu classique italien imbibé d'espresso avec mascarpone.,تيراميسو إيطالي كلاسيكي مع ماسكاربوني.,9.50,https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600
Drinks,Boissons,المشروبات,Signature Aperol Spritz,Spritz Aperol Signature,سبريتز أبيرول المميز,Refreshing Italian cocktail with Aperol and Prosecco.,Cocktail rafraîchissant italien à l'Aperol et Prosecco.,كوكتيل إيطالي منعش مع أبيرول وبروسيكو.,12.00,https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600`;
import { QRCodeSVG } from 'qrcode.react';
import SuperadminDashboard from '../components/SuperadminDashboard';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'import' | 'products' | 'plans'>('overview');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importSummary, setImportSummary] = useState<{ 
    totalRows: number; 
    duplicatesRemoved: number; 
    importedCount: number;
    languagesDetected?: { en: boolean; fr: boolean; ar: boolean; list: string[] };
  } | null>(null);

  const fetchUserAndRestaurant = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        logoutUser();
        navigate('/login');
        return;
      }
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        logoutUser();
        navigate('/login');
        return;
      }
      
      if (data.restaurant) {
        setRestaurant({
          ...data.restaurant,
          whatsappNumber: data.restaurant.whatsappNumber || data.restaurant.whatsapp_number,
          logoUrl: data.restaurant.logoUrl || data.restaurant.logo_url,
          coverUrl: data.restaurant.coverUrl || data.restaurant.cover_url,
          ownerId: data.restaurant.ownerId || data.restaurant.owner_id
        });
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

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const downloadTemplateExcel = () => {
    const wb = XLSX.utils.book_new();

    const englishData = [
      { category: 'Starters', name: 'Crispy Calamari', description: 'Tender calamari rings lightly battered and served with house marinara sauce.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'Main Course', name: 'Classic Cheeseburger', description: 'Angus beef patty with sharp cheddar, crisp lettuce, and vine tomatoes.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'Desserts', name: 'New York Cheesecake', description: 'Rich and creamy vanilla cheesecake with graham cracker crust.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];

    const franceData = [
      { category: 'Entrées', name: 'Calamars Frits', description: 'Calamars frits croustillants servis avec sauce marinara.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'Plats Principaux', name: 'Cheeseburger Classique', description: 'Steak haché Angus avec cheddar affiché, laitue croquante.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'Desserts', name: 'Cheesecake New York', description: 'Gâteau au fromage riche et crémeux avec biscuits graham.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];

    const arabicData = [
      { category: 'المقبلات', name: 'كالاماري مقلي', description: 'حبار مقرمش مقلي يقدم مع صلصة مارينارا حارة.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'الأطباق الرئيسية', name: 'برجر تشيز كلاسيك', description: 'قطعة لحم أنغوس مع جبنة الشيدر، الخس المقرمش.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'الحلويات', name: 'تشيز كيك نيويورك', description: 'تشيز كيك فانيليا غني وكريمي مع قاعدة بسكويت.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(englishData), 'English Menu');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arabicData), 'Arabic Menu');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(franceData), 'France Menu');

    XLSX.writeFile(wb, 'Template.xlsx');
  };

  const loadSampleExcel = () => {
    const wb = XLSX.utils.book_new();
    const englishData = [
      { category: 'Starters', name: 'Crispy Calamari', description: 'Tender calamari rings lightly battered.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'Main Course', name: 'Classic Cheeseburger', description: 'Angus beef patty with cheddar.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'Desserts', name: 'New York Cheesecake', description: 'Rich and creamy vanilla cheesecake.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];
    const arabicData = [
      { category: 'المقبلات', name: 'كالاماري مقلي', description: 'حبار مقرمش مقلي.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'الأطباق الرئيسية', name: 'برجر تشيز كلاسيك', description: 'قطعة لحم أنغوس مع جبنة الشيدر.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'الحلويات', name: 'تشيز كيك نيويورك', description: 'تشيز كيك فانيليا غني وكريمي.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];
    const franceData = [
      { category: 'Entrées', name: 'Calamars Frits', description: 'Calamars frits croustillants.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
      { category: 'Plats Principaux', name: 'Cheeseburger Classique', description: 'Steak haché Angus avec cheddar.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
      { category: 'Desserts', name: 'Cheesecake New York', description: 'Gâteau au fromage riche et crémeux.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' }
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(englishData), 'English Menu');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arabicData), 'Arabic Menu');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(franceData), 'France Menu');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const file = new File([blob], 'Template.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    setCsvFile(file);
    setMessage({ type: 'success', text: 'Loaded Template.xlsx (English Menu, Arabic Menu, France Menu) successfully!' });
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !restaurant) return;
    setImporting(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const fileName = csvFile.name.toLowerCase();

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
          const excelBytes = new Uint8Array(buffer);
          const workbook = XLSX.read(excelBytes, { type: 'array' });
          const sheetNames = workbook.SheetNames;
          const combinedMap = new Map<string, any>();
          let totalRows = 0;

          sheetNames.forEach(sheetName => {
            const ws = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(ws) as any[];
            totalRows += json.length;
            const lowerSheet = sheetName.toLowerCase();
            const isFr = lowerSheet.includes('france') || lowerSheet.includes('french') || lowerSheet.includes('fr');
            const isAr = lowerSheet.includes('arabic') || lowerSheet.includes('ar') || lowerSheet.includes('العربية');
            const isEn = lowerSheet.includes('english') || lowerSheet.includes('en') || (!isFr && !isAr);

            json.forEach((row) => {
              const cat = (row.category || row.Category || row.category_en || row.category_fr || row.category_ar || '').toString().trim();
              const name = (row.name || row.Name || row.name_en || row.name_fr || row.name_ar || '').toString().trim();
              const desc = (row.description || row.Description || row.description_en || row.description_fr || row.description_ar || '').toString().trim();
              const price = parseFloat((row.price || row.Price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
              const imageUrl = (row.imageUrl || row.image_url || row.Image || row.image || '').toString().trim();

              if (!name) return;

              const key = name.toLowerCase();
              if (!combinedMap.has(key)) {
                combinedMap.set(key, {
                  category_en: isEn ? cat : '',
                  category_fr: isFr ? cat : '',
                  category_ar: isAr ? cat : '',
                  name_en: isEn ? name : '',
                  name_fr: isFr ? name : '',
                  name_ar: isAr ? name : '',
                  description_en: isEn ? desc : '',
                  description_fr: isFr ? desc : '',
                  description_ar: isAr ? desc : '',
                  price: price,
                  imageUrl: imageUrl
                });
              } else {
                const existing = combinedMap.get(key);
                if (isEn) {
                  if (cat) existing.category_en = cat;
                  if (name) existing.name_en = name;
                  if (desc) existing.description_en = desc;
                }
                if (isFr) {
                  if (cat) existing.category_fr = cat;
                  if (name) existing.name_fr = name;
                  if (desc) existing.description_fr = desc;
                }
                if (isAr) {
                  if (cat) existing.category_ar = cat;
                  if (name) existing.name_ar = name;
                  if (desc) existing.description_ar = desc;
                }
                if (price > 0) existing.price = price;
                if (imageUrl) existing.imageUrl = imageUrl;
              }
            });
          });

          const items = Array.from(combinedMap.values());
          const duplicatesRemoved = Math.max(0, totalRows - items.length);
          const token = getAuthToken();
          const res = await fetch('/api/import-csv', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ items, restaurantId: restaurant.id })
          });
          const resJson = await res.json();
          if (res.ok) {
            setImportSummary(resJson.summary || { totalRows, duplicatesRemoved, importedCount: items.length });
            setMessage({ type: 'success', text: t('dashboard.import_success') });
            setCsvFile(null);
          } else {
            setMessage({ type: 'error', text: resJson.error || t('dashboard.import_failed') });
          }
        } else {
          const csvData = new TextDecoder().decode(buffer);
          const token = getAuthToken();
          const res = await fetch('/api/import-csv', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ csvData, restaurantId: restaurant.id })
          });
          const resJson = await res.json();
          if (res.ok) {
            setImportSummary(resJson.summary || { totalRows: 0, duplicatesRemoved: 0, importedCount: 0 });
            setMessage({ type: 'success', text: t('dashboard.import_success') });
            setCsvFile(null);
          } else {
            setMessage({ type: 'error', text: resJson.error || t('dashboard.import_failed') });
          }
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || t('dashboard.import_error') });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(csvFile);
  };

  if (loading) return null;

  if (user?.role === 'superadmin') {
    return <SuperadminDashboard />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex flex-col gap-2">
          {restaurant && (
            <div className="mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg overflow-hidden border border-neutral-100 shrink-0">
                  {restaurant.logoUrl ? (
                    <img src={restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={24} className="text-neutral-400 w-full h-full flex items-center justify-center p-2" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-neutral-900 truncate leading-tight">{restaurant.name}</h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${
                        restaurant.plan === 'premium' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <CreditCard size={10} />
                        {restaurant.plan === 'premium' ? t('dashboard.pro_plan') : t('dashboard.free_plan')}
                      </p>
                    {restaurant.plan === 'premium' && isExpiringSoon(restaurant.planExpiresAt) && (
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm shadow-amber-200"
                      >
                        <AlertCircle size={10} />
                        {t('dashboard.expiring')}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
            label={t('dashboard.products')} 
          />
          <SidebarItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20} />} 
            label={t('dashboard.settings')} 
          />
          <SidebarItem 
            active={activeTab === 'import'} 
            onClick={() => setActiveTab('import')} 
            icon={<FileUp size={20} />} 
            label={t('dashboard.import')} 
          />
          <SidebarItem 
            active={activeTab === 'plans'} 
            onClick={() => setActiveTab('plans')} 
            icon={<CreditCard size={20} />} 
            label={t('dashboard.plans')} 
          />
        </aside>

        {/* Main Content */}
        <main className={`flex-1 space-y-6 transition-all duration-500 rounded-[2.5rem] ${
          restaurant?.plan === 'premium' && isExpiringSoon(restaurant.planExpiresAt) 
            ? 'p-1 bg-amber-400/10 ring-1 ring-amber-400/30 shadow-[0_0_40px_-15px_rgba(251,191,36,0.3)]' 
            : ''
        }`}>
          <div className={restaurant?.plan === 'premium' && isExpiringSoon(restaurant.planExpiresAt) ? 'bg-white rounded-[2.2rem] p-4 sm:p-2' : ''}>
            {restaurant?.plan === 'premium' && isExpiringSoon(restaurant.planExpiresAt) && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-0.5 rounded-2xl mb-6 shadow-lg shadow-amber-100">
                <div className="bg-white rounded-[0.9rem] p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-amber-500 text-white p-3 rounded-xl shadow-inner shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-0.5">{t('dashboard.urgent_notice')}</p>
                    <p className="text-sm font-bold text-neutral-800">
                      {t('dashboard.pro_expires')} <span className="text-amber-600 font-black">{restaurant.planExpiresAt}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{t('dashboard.renew_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('plans')}
                    className="w-full sm:w-auto bg-neutral-900 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-black transition-all shadow-xl shadow-neutral-200 shrink-0 active:scale-95"
                  >
                    {t('dashboard.renew_premium')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
            <div className="space-y-8">
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
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col items-center gap-4">
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
          )}

          {activeTab === 'products' && (
            <ProductsManager 
              restaurant={restaurant} 
              onNavigateImport={() => setActiveTab('import')} 
            />
          )}

          {activeTab === 'settings' && (
            <RestaurantSettings restaurant={restaurant} onSave={fetchUserAndRestaurant} />
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">{t('dashboard.import_title')}</h2>
                  <p className="text-neutral-500 text-sm">{t('dashboard.import_subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={downloadTemplateExcel}
                    className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-100 transition-colors shadow-sm"
                  >
                    <Download size={18} />
                    Download Template
                  </button>
                  <button
                    type="button"
                    onClick={loadSampleExcel}
                    className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <Sparkles size={18} className="text-amber-400" />
                    Load Mockdata
                  </button>
                </div>
              </div>

              {/* Template instructions card */}
              <div className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-orange-500/5 border border-orange-200/60 p-6 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 text-white p-3 rounded-2xl shadow-sm hidden sm:block">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-bold text-neutral-900 text-base">Multi-Sheet Excel Format Requirements</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      Upload an Excel file (.xlsx) with 3 separate sheets: <span className="font-bold text-orange-600">English Menu</span>, <span className="font-bold text-orange-600">Arabic Menu</span>, and <span className="font-bold text-orange-600">France Menu</span>. Each sheet must contain columns: <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-bold">category</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-bold">name</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-bold">description</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-bold">price</code>, and <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-bold">imageUrl</code>.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="bg-white border border-neutral-200 text-orange-600 px-2.5 py-1 rounded-lg font-bold">📄 English Menu</span>
                      <span className="bg-white border border-neutral-200 text-orange-600 px-2.5 py-1 rounded-lg font-bold">📄 Arabic Menu</span>
                      <span className="bg-white border border-neutral-200 text-orange-600 px-2.5 py-1 rounded-lg font-bold">📄 France Menu</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                <form onSubmit={handleImport} className="space-y-6">
                  <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-10 text-center hover:border-orange-400 transition-all cursor-pointer relative bg-neutral-50/50 hover:bg-orange-50/20">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .ods, .csv" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onChange={(e) => {
                        setMessage(null);
                        setCsvFile(e.target.files?.[0] || null);
                      }}
                    />
                    <FileUp size={48} className="mx-auto text-orange-500/60 mb-3" />
                    <p className="text-lg font-semibold text-neutral-800">
                      {csvFile ? csvFile.name : t('dashboard.drop_csv')}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{t('dashboard.accepts_csv')}</p>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-600 shrink-0" /> : <AlertCircle size={20} className="text-rose-600 shrink-0" />}
                      <span className="font-medium text-sm">{message.text}</span>
                    </div>
                  )}

                  {importSummary && (
                    <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
                          📊
                        </div>
                        <div>
                          <h4 className="font-black text-neutral-900 text-base">Import & Duplicate Analysis Summary</h4>
                          <p className="text-xs text-neutral-600">Quick analysis completed successfully</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs text-center">
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Rows Analyzed</p>
                          <p className="text-2xl font-black text-neutral-900 mt-1">{importSummary.totalRows}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs text-center">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Duplicates Caught & Removed</p>
                          <p className="text-2xl font-black text-emerald-600 mt-1">{importSummary.duplicatesRemoved}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs text-center">
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Unique Items Imported</p>
                          <p className="text-2xl font-black text-orange-600 mt-1">{importSummary.importedCount}</p>
                        </div>
                      </div>

                      {importSummary.languagesDetected && (
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs">
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Languages Summary Detected</p>
                          <div className="flex flex-wrap gap-2">
                            {importSummary.languagesDetected.list.length > 0 ? (
                              importSummary.languagesDetected.list.map((lang) => (
                                <span key={lang} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">
                                  {lang}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-500">English (Default)</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      type="submit" 
                      disabled={!csvFile || importing || !restaurant}
                      className="flex-1 bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? t('dashboard.importing') : t('dashboard.import_csv')}
                    </button>
                    {csvFile && (
                      <button 
                        type="button" 
                        onClick={() => { setCsvFile(null); setMessage(null); }}
                        className="px-6 py-3.5 rounded-xl font-semibold border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors text-base"
                      >
                        {t('common.clear')}
                      </button>
                    )}
                  </div>
                  
                  {!restaurant && (
                    <p className="text-sm text-red-500 text-center font-medium">{t('dashboard.setup_settings_error')}</p>
                  )}
                </form>

                {/* Template Data Sample Preview */}
                <div className="pt-6 border-t border-neutral-100">
                  <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-orange-500" />
                    {t('dashboard.template_preview')}
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                          <th className="p-2.5">category</th>
                          <th className="p-2.5">name</th>
                          <th className="p-2.5">description</th>
                          <th className="p-2.5">price</th>
                          <th className="p-2.5">imageUrl</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 text-neutral-600">
                        <tr>
                          <td className="p-2.5 font-medium text-neutral-800">Starters</td>
                          <td className="p-2.5 font-medium text-neutral-800">Crispy Calamari</td>
                          <td className="p-2.5 max-w-xs truncate">Tender calamari rings served with house marinara sauce.</td>
                          <td className="p-2.5">12.99</td>
                          <td className="p-2.5 truncate max-w-xs text-blue-600">https://images.unsplash.com/...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">{t('dashboard.plans_title')}</h1>
                <p className="text-neutral-500 mt-1">{t('dashboard.plans_subtitle')}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                {/* Free Plan */}
                <div className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between transition-all ${
                  restaurant?.plan === 'free' ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50' : 'border-neutral-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                        🟢 {t('dashboard.free_plan')}
                      </span>
                      <span className="text-xl font-black text-neutral-900">$0 / forever</span>
                    </div>
                    <p className="text-neutral-600 text-xs mb-4">
                      Perfect for trying the platform before upgrading.
                    </p>

                    <div className="border-t border-neutral-100 pt-4 space-y-2">
                      <p className="text-[11px] font-extrabold uppercase text-neutral-400">{t('dashboard.includes')}</p>
                      <ul className="space-y-1.5 text-xs text-neutral-700">
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> 1 Restaurant</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> 2 Products per Category</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> 4 Product Images</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> Maximum 2 Menu Pages</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> Classic List & Cards Grid Templates</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> CSV Import & QR Code Generation</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> WhatsApp Ordering & Dashboard</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" /> Search Functionality</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    {restaurant?.plan === 'free' ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        {t('dashboard.already_subscribed')}
                      </div>
                    ) : (
                      <div className="bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs p-3 rounded-xl">
                        {t('dashboard.downgrade_info')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pro Plan */}
                <div className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between transition-all relative ${
                  restaurant?.plan === 'premium' ? 'border-orange-500 shadow-xl ring-4 ring-orange-50' : 'border-neutral-200'
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
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Unlimited Images</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Unlimited Menu Pages</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Full Menu Visibility</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Unlimited Menu Updates</strong></li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500 shrink-0" /> <strong>Priority Support</strong></li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
                    {restaurant?.plan === 'premium' ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 rounded-xl">
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <ShieldCheck size={16} className="text-blue-600" />
                            {t('dashboard.pro_plan')} {t('dashboard.already_subscribed')}
                          </div>
                          {restaurant.planExpiresAt && (
                            <p className="text-blue-700 font-medium">{t('dashboard.active_until')}: <span className="font-bold underline">{restaurant.planExpiresAt}</span></p>
                          )}
                        </div>
                        <button
                          disabled
                          className="w-full bg-neutral-100 text-neutral-400 py-3 rounded-xl font-bold text-sm cursor-not-allowed"
                        >
                          {t('dashboard.already_subscribed')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl">
                          {restaurant?.planExpiresAt ? (
                            <p className="text-amber-700 font-bold">{t('dashboard.expired_on')} {restaurant.planExpiresAt}</p>
                          ) : (
                            <p><strong>No Restrictions:</strong> Unlimited menu size & content. Same features as Free with no limits.</p>
                          )}
                        </div>
                        <button
                          onClick={() => alert('To upgrade to Pro, please contact support or complete payment checkout!')}
                          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
                        >
                          {t('dashboard.upgrade_pro_btn')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Upgrade Policy Note */}
              <div className="bg-neutral-900 text-white rounded-2xl p-6 space-y-2 shadow-md">
                <span className="bg-orange-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                  {t('dashboard.upgrade_policy')}
                </span>
                <h3 className="text-lg font-extrabold">{t('dashboard.upgrade_policy_title')}</h3>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  {t('dashboard.upgrade_policy_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
          ? 'bg-orange-50 text-orange-600 shadow-sm' 
          : 'text-neutral-500 hover:bg-neutral-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, description }: { title: string, value: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-2xl font-bold text-neutral-900 mb-1">{value}</p>
      <p className="text-sm text-neutral-400">{description}</p>
    </div>
  );
}

function RestaurantSettings({ restaurant, onSave }: { restaurant: Restaurant | null, onSave: () => void }) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState(false);
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
      if (enabled.length === 1) return; // Must have at least one
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

  const copyRestaurantId = () => {
    if (restaurant?.id) {
      navigator.clipboard.writeText(restaurant.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
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
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{t('settings.title')}</h2>
          <p className="text-xs text-neutral-500 mt-1">{t('settings.title_desc')}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
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
}
