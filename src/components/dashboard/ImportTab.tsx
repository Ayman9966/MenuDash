import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileUp, 
  Download, 
  Sparkles, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Restaurant } from '../../types';
import { getAuthToken } from '../../lib/auth';

interface ImportTabProps {
  restaurant: Restaurant | null;
}

const SAMPLE_CSV_MULTILINGUAL = `category_en,category_fr,category_ar,name_en,name_fr,name_ar,description_en,description_fr,description_ar,price,imageUrl
Starters,Entrées,المقبلات,Truffle Arancini,Arancini à la Truffe,أرانشيني الكمأة,Crispy golden risotto spheres infused with black truffle cream.,Boules de risotto croustillantes infusées à la truffe noire.,كرات الأرز المقرمشة بالكمأة السوداء.,14.50,https://images.unsplash.com/photo-1541529086526-db283c563270?w=600
Main Course,Plats Principaux,الأطباق الرئيسية,Wagyu Ribeye Steak,Entrecôte de Bœuf Wagyu,ستيك ريب أي واغيو,Grilled premium Wagyu ribeye with garlic herb butter.,Entrecôte Wagyu grillée de première qualité avec beurre aux herbes.,ستيك ريب أي واغيو مشوي مع زبدة الأعشاب.,38.00,https://images.unsplash.com/photo-1544025162-d76694265947?w=600
Desserts,Desserts,الحلويات,Artisan Tiramisu,Tiramisu Artisanal,تيراميسو فاخر,Classic Italian espresso-soaked savoiardi with rich mascarpone.,Tiramisu classique italien imbibé d'espresso avec mascarpone.,تيراميسو إيطالي كلاسيكي مع ماسكاربوني.,9.50,https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600`;

export const ImportTab: React.FC<ImportTabProps> = ({ restaurant }) => {
  const { t } = useTranslation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);

  const downloadTemplateExcel = () => {
    const ws_en = XLSX.utils.json_to_sheet([{ category: 'Starters', name: 'Product Name', description: 'Product description', price: 10.50, imageUrl: 'https://example.com/image.jpg' }]);
    const ws_fr = XLSX.utils.json_to_sheet([{ category: 'Entrées', name: 'Nom du produit', description: 'Description du produit', price: 10.50, imageUrl: 'https://example.com/image.jpg' }]);
    const ws_ar = XLSX.utils.json_to_sheet([{ category: 'المقبلات', name: 'اسم المنتج', description: 'وصف المنتج', price: 10.50, imageUrl: 'https://example.com/image.jpg' }]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_en, "English Menu");
    XLSX.utils.book_append_sheet(wb, ws_fr, "France Menu");
    XLSX.utils.book_append_sheet(wb, ws_ar, "Arabic Menu");
    XLSX.writeFile(wb, "MenuQuick_Multilingual_Template.xlsx");
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !restaurant) return;

    setImporting(true);
    setMessage(null);
    setImportSummary(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let allItems: any[] = [];
        const sheetMap: Record<string, string> = {
          "English Menu": "en",
          "France Menu": "fr",
          "Arabic Menu": "ar"
        };

        workbook.SheetNames.forEach(sheetName => {
          const langCode = sheetMap[sheetName];
          if (langCode) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            rows.forEach((row: any) => {
              allItems.push({
                ...row,
                [`category_${langCode}`]: row.category,
                [`name_${langCode}`]: row.name,
                [`description_${langCode}`]: row.description,
                price: row.price,
                imageUrl: row.imageUrl
              });
            });
          }
        });

        const token = getAuthToken();
        const res = await fetch('/api/restaurant/import-csv', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ items: allItems, restaurantId: restaurant.id })
        });
        
        const result = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: result.message });
          setImportSummary(result.summary);
        } else {
          setMessage({ type: 'error', text: result.error || 'Import failed' });
        }
        setImporting(false);
      };
      reader.readAsBinaryString(csvFile);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
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
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-orange-500/5 border border-orange-200/60 p-6 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="bg-orange-500 text-white p-3 rounded-2xl shadow-sm hidden sm:block">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-bold text-neutral-900 text-base">Multi-Sheet Excel Format Requirements</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Upload an Excel file (.xlsx) with 3 separate sheets: <span className="font-bold text-orange-600">English Menu</span>, <span className="font-bold text-orange-600">Arabic Menu</span>, and <span className="font-bold text-orange-600">France Menu</span>.
            </p>
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
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-600 shrink-0" /> : <AlertCircle size={20} className="text-rose-600 shrink-0" />}
              <span className="font-medium text-sm">{message.text}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!csvFile || importing || !restaurant}
            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? t('dashboard.importing') : t('dashboard.import_csv')}
          </button>
        </form>
      </div>
    </div>
  );
};
