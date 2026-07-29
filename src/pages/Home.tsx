import { motion } from 'motion/react';
import React from 'react';
import { ArrowRight, CheckCircle, Smartphone, Globe, CreditCard, Clock, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center flex flex-col gap-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]"
          >
            {t('landing.hero_title')} <span className="text-orange-500 underline decoration-orange-200">{t('landing.hero_title_accent')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing.hero_subtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mt-4"
          >
            <Link 
              to="/register" 
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
            >
              {t('landing.get_started')} <ArrowRight size={20} />
            </Link>
            <Link 
              to="/demo" 
              className="bg-white border-2 border-neutral-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-neutral-300 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={20} className="text-neutral-400" /> {t('landing.view_demo')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Clock className="text-orange-500" size={32} />}
            title={t('landing.setup_title')}
            description={t('landing.setup_desc')}
          />
          <FeatureCard 
            icon={<Smartphone className="text-orange-500" size={32} />}
            title={t('landing.whatsapp_title')}
            description={t('landing.whatsapp_desc')}
          />
          <FeatureCard 
            icon={<Globe className="text-orange-500" size={32} />}
            title={t('landing.domain_title')}
            description={t('landing.domain_desc')}
          />
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-neutral-900 text-white py-24 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">{t('landing.how_it_works')}</h2>
            <p className="text-neutral-400 text-lg">{t('landing.how_it_works_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <Step number="1" title={t('landing.step1')} description={t('landing.step1_desc')} />
            <Step number="2" title={t('landing.step2')} description={t('landing.step2_desc')} />
            <Step number="3" title={t('landing.step3')} description={t('landing.step3_desc')} />
            <Step number="4" title={t('landing.step4')} description={t('landing.step4_desc')} />
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="max-w-7xl mx-auto px-4 w-full" id="pricing">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="bg-orange-100 text-orange-700 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
            {t('landing.pricing_tag')}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
            {t('landing.pricing_title')}
          </h2>
          <p className="text-lg text-neutral-600">
            {t('landing.pricing_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Free Plan Card */}
          <div className="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
                  🟢 {t('landing.free_plan')}
                </span>
                <span className="text-2xl font-black text-neutral-900">{t('landing.free_price')}</span>
              </div>
              <p className="text-neutral-600 text-sm mb-6 font-medium">
                {t('landing.free_desc')}
              </p>

              <div className="border-t border-neutral-100 pt-6 space-y-3">
                <p className="text-xs font-extrabold uppercase text-neutral-400 tracking-wider">{t('landing.free_includes')}</p>
                <ul className="space-y-2 text-sm text-neutral-700">
                  <PricingFeature text={t('landing.item_1_restaurant')} />
                  <PricingFeature text={t('landing.item_2_products')} />
                  <PricingFeature text={t('landing.item_4_images')} />
                  <PricingFeature text={t('landing.item_2_pages')} />
                  <PricingFeature text={t('landing.item_templates')} />
                  <PricingFeature text={t('landing.item_csv')} />
                  <PricingFeature text={t('landing.item_whatsapp')} />
                  <PricingFeature text={t('landing.item_responsive')} />
                  <PricingFeature text={t('landing.item_dashboard')} />
                  <PricingFeature text={t('landing.item_mgmt')} />
                  <PricingFeature text={t('landing.item_search')} />
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl font-medium leading-relaxed">
                <strong className="font-bold">{t('landing.limitations')}</strong> {t('landing.limitations_desc')}
              </div>
              <Link 
                to="/register" 
                className="w-full bg-neutral-900 text-white py-3.5 px-4 rounded-xl font-bold text-center block hover:bg-neutral-800 transition-colors shadow-sm"
              >
                {t('landing.start_free')}
              </Link>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="bg-white rounded-3xl border-2 border-orange-500 p-8 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 right-8 bg-orange-500 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
              {t('landing.pro_popular')}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                  🔵 {t('landing.pro_plan')}
                </span>
                <span className="text-3xl font-black text-neutral-900">{t('landing.pro_price')}</span>
              </div>
              <p className="text-neutral-600 text-sm mb-6 font-medium">
                {t('landing.pro_desc')}
              </p>

              <div className="border-t border-neutral-100 pt-6 space-y-3">
                <p className="text-xs font-extrabold uppercase text-neutral-400 tracking-wider">{t('landing.pro_includes')}</p>
                <ul className="space-y-2 text-sm text-neutral-800 font-medium">
                  <PricingFeature text={t('landing.item_unlimited_products')} highlight />
                  <PricingFeature text={t('landing.item_unlimited_categories')} highlight />
                  <PricingFeature text={t('landing.item_unlimited_images')} highlight />
                  <PricingFeature text={t('landing.item_unlimited_pages')} highlight />
                  <PricingFeature text={t('landing.item_full_visibility')} highlight />
                  <PricingFeature text={t('landing.item_unlimited_updates')} highlight />
                  <PricingFeature text={t('landing.item_priority_support')} highlight />
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3.5 rounded-xl font-medium leading-relaxed">
                <strong className="font-bold">{t('landing.no_restrictions')}</strong> {t('landing.no_restrictions_desc')}
              </div>
              <Link 
                to="/register" 
                className="w-full bg-orange-500 text-white py-3.5 px-4 rounded-xl font-bold text-center block hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
              >
                {t('landing.upgrade_pro')}
              </Link>
            </div>
          </div>
        </div>

        {/* Upgrade Policy Callout */}
        <div className="mt-16 bg-neutral-900 text-white rounded-3xl p-8 md:p-10 max-w-4xl mx-auto shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="bg-orange-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
              {t('dashboard.upgrade_policy')}
            </span>
            <h3 className="text-2xl font-black text-white">
              {t('landing.fair_philosophy')}
            </h3>
            <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
              {t('dashboard.upgrade_policy_desc')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingFeature({ text, highlight = false }: { text: string, highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <CheckCircle size={16} className={highlight ? "text-orange-500 shrink-0" : "text-emerald-500 shrink-0"} />
      <span className={highlight ? "font-bold text-neutral-900" : ""}>{text}</span>
    </li>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xl">
        {number}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </div>
  );
}
