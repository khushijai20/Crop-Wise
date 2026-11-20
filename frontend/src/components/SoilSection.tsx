'use client';

import React, { useState } from 'react';
import {
  Layers, FlaskConical, Award, HelpCircle,
  FileSpreadsheet, Check, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import { SoilData, SoilTestReportInput } from '@/types';
import { Language, translations } from '@/lib/translations';

interface SoilSectionProps {
  soil: SoilData | null;
  loading: boolean;
  lang: Language;
  onSubmitCustomSoil: (report: SoilTestReportInput) => Promise<void>;
  onResetSoil: () => void;
  isCustomSoilApplied: boolean;
}

export const SoilSection: React.FC<SoilSectionProps> = ({
  soil,
  loading,
  lang,
  onSubmitCustomSoil,
  onResetSoil,
  isCustomSoilApplied,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  // Manual Soil Card form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [phInput, setPhInput] = useState(soil ? soil.ph.toString() : '7.2');
  const [nitrogenInput, setNitrogenInput] = useState(soil ? soil.nitrogen.toString() : '240');
  const [ocInput, setOcInput] = useState(soil ? soil.organic_carbon.toString() : '0.55');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!soil) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Soil data currently unavailable.</p>
      </div>
    );
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitCustomSoil({
        district_id: soil.district_id,
        farmer_name: farmerName || 'Farmer Field Plot',
        soil_type: isHi ? 'खेत का परीक्षित नमूना (Lab Tested)' : 'Farm Tested Sample',
        ph: parseFloat(phInput) || 7.0,
        nitrogen: parseFloat(nitrogenInput) || 240.0,
        organic_carbon: parseFloat(ocInput) || 0.5,
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // pH Status Evaluation
  const phVal = soil.ph;
  let phCategory = isHi ? 'उदासीन (संतुलित)' : 'Neutral (Optimal)';
  let phColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (phVal < 6.5) {
    phCategory = isHi ? 'अम्लीय (कम पीएच)' : 'Acidic (Lime recommended)';
    phColor = 'text-amber-800 bg-amber-50 border-amber-200';
  } else if (phVal > 7.8) {
    phCategory = isHi ? 'क्षारीय (अधिक पीएच)' : 'Alkaline (Gypsum recommended)';
    phColor = 'text-blue-800 bg-blue-50 border-blue-200';
  }

  // Nitrogen Status Evaluation
  let nStatus = isHi ? 'मध्यम' : 'Medium';
  if (soil.nitrogen < 200) nStatus = isHi ? 'कम (उर्वरक आवश्यक)' : 'Low (Deficient)';
  else if (soil.nitrogen > 280) nStatus = isHi ? 'उत्तम (प्रचुर)' : 'High (Good)';

  // Organic Carbon Status
  let ocStatus = isHi ? 'मध्यम' : 'Medium';
  if (soil.organic_carbon < 0.4) ocStatus = isHi ? 'कम (गोबर/हरी खाद दें)' : 'Low (Add FYM/Compost)';
  else if (soil.organic_carbon > 0.65) ocStatus = isHi ? 'उत्तम' : 'High (Rich)';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-kisan-600" />
            <span>{t.soil.title}</span>
          </h2>
          <p className="text-sm text-gray-600">{t.soil.subtitle}</p>
        </div>

        {/* Provenance Badge & Reset Option */}
        <div className="flex items-center space-x-2">
          {isCustomSoilApplied && (
            <button
              onClick={onResetSoil}
              className="text-xs text-kisan-700 underline font-medium hover:text-kisan-900"
            >
              {t.soil.resetDefault}
            </button>
          )}
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isCustomSoilApplied
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{soil.data_status_label}</span>
          </span>
        </div>
      </div>

      {/* Main Soil Type & Provenance Info Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-kisan-700 uppercase tracking-wider">
            {t.soil.soilType}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
            {soil.soil_type}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {isHi ? 'स्रोत' : 'Source'}: <span className="font-semibold text-gray-700">{soil.source}</span> •{' '}
            {isHi ? 'पैमाना' : 'Resolution'}: {soil.data_resolution}
          </p>
        </div>

        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-kisan-50 hover:bg-kisan-100 text-kisan-800 border border-kisan-200 text-sm font-semibold transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-kisan-700" />
          <span>{showCustomForm ? (isHi ? 'फॉर्म बंद करें' : 'Close Form') : t.soil.enterCustomCard}</span>
        </button>
      </div>

      {/* Manual Soil Card Input Drawer */}
      {showCustomForm && (
        <form
          onSubmit={handleCustomSubmit}
          className="bg-emerald-50/50 rounded-2xl p-6 border border-kisan-200 shadow-inner space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-kisan-700" />
              <span>{t.soil.enterCustomCard}</span>
            </h4>
            <span className="text-xs text-kisan-700 bg-kisan-100 px-2.5 py-1 rounded-full font-medium">
              {isHi ? 'सत्यापित व्यक्तिगत परीक्षण' : 'Verified Field Plot Test'}
            </span>
          </div>
          <p className="text-xs text-gray-600">{t.soil.customCardDesc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.soil.farmerName}
              </label>
              <input
                type="text"
                placeholder={isHi ? 'उदा. राम कुमार' : 'e.g. Ramesh Kumar'}
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-kisan-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.soil.phLevel} (3.0 - 10.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="10.0"
                value={phInput}
                onChange={(e) => setPhInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-kisan-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.soil.nitrogen} (kg/ha)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="800"
                value={nitrogenInput}
                onChange={(e) => setNitrogenInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-kisan-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.soil.organicCarbon} (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.0"
                value={ocInput}
                onChange={(e) => setOcInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-kisan-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-kisan-700 hover:bg-kisan-800 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (isHi ? 'लागू हो रहा है...' : 'Applying...') : t.soil.submitCard}
            </button>
            {submitSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{t.soil.cardSubmittedSuccess}</span>
              </span>
            )}
          </div>
        </form>
      )}

      {/* Key Soil Nutrients & pH Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* pH Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-600 block">{t.soil.phLevel}</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-gray-900">{phVal}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${phColor}`}>
              {phCategory}
            </span>
          </div>

          {/* Visual pH Spectrum Scale */}
          <div className="mt-5">
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-400 via-emerald-400 to-blue-500 relative">
              {/* Position cursor based on pH scale (3 to 10) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-900 border-2 border-white shadow-md"
                style={{
                  left: `${Math.max(0, Math.min(100, ((phVal - 3) / 7) * 100))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>3.0 (Acidic)</span>
              <span className="font-bold text-emerald-700">7.0 (Neutral)</span>
              <span>10.0 (Alkaline)</span>
            </div>
          </div>
        </div>

        {/* Available Nitrogen Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-600 block">{t.soil.nitrogen}</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-gray-900">{soil.nitrogen}</span>
            <span className="text-xs font-medium text-gray-600">kg/ha</span>
          </div>
          <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-kisan-50 text-kisan-800 border border-kisan-200">
            {isHi ? 'स्थिति' : 'Rating'}: {nStatus}
          </span>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-kisan-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, (soil.nitrogen / 400) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-600 block mt-1">
            {isHi ? 'मानक उर्वरक स्तर: 240-280 kg/ha' : 'Standard fertile baseline: 240-280 kg/ha'}
          </span>
        </div>

        {/* Organic Carbon Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-600 block">{t.soil.organicCarbon}</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-gray-900">{soil.organic_carbon}%</span>
          </div>
          <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-earth-100 text-earth-800 border border-earth-200">
            {isHi ? 'स्थिति' : 'Rating'}: {ocStatus}
          </span>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-earth-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, (soil.organic_carbon / 1.0) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-600 block mt-1">
            {isHi ? 'उर्वर मृदा लक्ष्य: > 0.50%' : 'Healthy fertile target: > 0.50%'}
          </span>
        </div>
      </div>

      {/* Soil Texture Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-kisan-600" />
          <span>{t.soil.textureTitle}</span>
        </h3>

        {/* Stacked Texture Progress Bar */}
        <div className="w-full h-6 rounded-xl overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${soil.clay_percentage}%` }}
            className="bg-amber-700 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Clay: ${soil.clay_percentage}%`}
          >
            {soil.clay_percentage > 10 ? `${soil.clay_percentage}%` : ''}
          </div>
          <div
            style={{ width: `${soil.sand_percentage}%` }}
            className="bg-amber-300 flex items-center justify-center text-[10px] text-amber-900 font-bold"
            title={`Sand: ${soil.sand_percentage}%`}
          >
            {soil.sand_percentage > 10 ? `${soil.sand_percentage}%` : ''}
          </div>
          <div
            style={{ width: `${soil.silt_percentage}%` }}
            className="bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Silt: ${soil.silt_percentage}%`}
          >
            {soil.silt_percentage > 10 ? `${soil.silt_percentage}%` : ''}
          </div>
        </div>

        {/* Texture Legend */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-gray-100 text-center">
          <div>
            <span className="inline-block w-3 h-3 rounded-full bg-amber-700 mr-1.5 align-middle" />
            <span className="text-xs font-semibold text-gray-700">{t.soil.clay}</span>
            <span className="block text-sm font-bold text-gray-900 mt-0.5">{soil.clay_percentage}%</span>
          </div>
          <div>
            <span className="inline-block w-3 h-3 rounded-full bg-amber-300 mr-1.5 align-middle" />
            <span className="text-xs font-semibold text-gray-700">{t.soil.sand}</span>
            <span className="block text-sm font-bold text-gray-900 mt-0.5">{soil.sand_percentage}%</span>
          </div>
          <div>
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-600 mr-1.5 align-middle" />
            <span className="text-xs font-semibold text-gray-700">{t.soil.silt}</span>
            <span className="block text-sm font-bold text-gray-900 mt-0.5">{soil.silt_percentage}%</span>
          </div>
        </div>
      </div>

      {/* Educational Soil FAQs / Explainers */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-kisan-600" />
          <span>{t.soil.learnTitle}</span>
        </h3>

        <div className="space-y-3">
          {[
            { q: t.soil.whatIsPh, a: t.soil.whatIsPhAns },
            { q: t.soil.whyIsNitrogen, a: t.soil.whyIsNitrogenAns },
            { q: t.soil.whatIsOc, a: t.soil.whatIsOcAns },
            { q: t.soil.textureImpact, a: t.soil.textureImpactAns },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden transition">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-left bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-3.5 bg-white text-xs text-gray-700 leading-relaxed border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
