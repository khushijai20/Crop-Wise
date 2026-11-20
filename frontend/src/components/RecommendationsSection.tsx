'use client';

import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Droplets, Clock,
  Calendar, ArrowRight, ShieldCheck, Sparkles, Filter
} from 'lucide-react';
import { RecommendationResponse, RecommendationItem } from '@/types';
import { Language, translations } from '@/lib/translations';

interface RecommendationsSectionProps {
  recommendations: RecommendationResponse | null;
  loading: boolean;
  lang: Language;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  waterAvailability: string;
  setWaterAvailability: (w: string) => void;
  onRefresh: () => void;
  onSelectCropForCalendar: (cropId: number, variety?: string) => void;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations,
  loading,
  lang,
  selectedSeason,
  setSelectedSeason,
  waterAvailability,
  setWaterAvailability,
  onRefresh,
  onSelectCropForCalendar,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        bar: 'bg-emerald-500',
        label: isHi ? 'अत्यधिक उपयुक्त' : 'Highly Suitable',
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        bar: 'bg-amber-500',
        label: isHi ? 'मध्यम उपयुक्त' : 'Potentially Suitable',
      };
    } else {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        bar: 'bg-rose-500',
        label: isHi ? 'कम उपयुक्त' : 'Less Suitable',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-kisan-600" />
            <span>{t.recommendations.title}</span>
          </h2>
          <p className="text-sm text-gray-600">{t.recommendations.subtitle}</p>
        </div>

        {recommendations && (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-kisan-50 text-kisan-800 border border-kisan-200">
            <Sparkles className="w-3.5 h-3.5 text-kisan-600" />
            <span>
              {isHi
                ? `${recommendations.season_evaluated} मौसम हेतु विश्लेषित`
                : `Evaluated for ${recommendations.season_evaluated} Season`}
            </span>
          </span>
        )}
      </div>

      {/* Filter / Customization Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Season Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              {t.recommendations.targetSeason}
            </label>
            <div className="flex space-x-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
              {['Kharif', 'Rabi', 'Zaid'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedSeason === s
                      ? 'bg-kisan-700 text-white shadow-sm'
                      : 'text-gray-700 hover:text-kisan-800'
                  }`}
                >
                  {s === 'Kharif'
                    ? isHi ? 'खरीफ (Monsoon)' : 'Kharif'
                    : s === 'Rabi'
                    ? isHi ? 'रबी (Winter)' : 'Rabi'
                    : isHi ? 'जायद (Summer)' : 'Zaid'}
                </button>
              ))}
            </div>
          </div>

          {/* Water Availability Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              {t.recommendations.waterAvailability}
            </label>
            <select
              value={waterAvailability}
              onChange={(e) => setWaterAvailability(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
            >
              <option value="High">{t.recommendations.highIrrigation}</option>
              <option value="Moderate">{t.recommendations.moderateIrrigation}</option>
              <option value="Low">{t.recommendations.lowIrrigation}</option>
            </select>
          </div>
        </div>

        {/* Re-calculate button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-kisan-700 hover:bg-kisan-800 text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Filter className="w-4 h-4" />
          <span>{loading ? (isHi ? 'मूल्यांकन जारी...' : 'Evaluating...') : t.recommendations.evaluateBtn}</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Recommendations List */}
      {!loading && recommendations && (
        <div className="space-y-4">
          {recommendations.recommendations.map((item, index) => {
            const badge = getScoreBadge(item.suitability_score);
            const isExpanded = expandedCard === item.crop_id;

            return (
              <div
                key={item.crop_id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 sm:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Rank & Crop Titles */}
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-kisan-50 border border-kisan-200 text-kisan-800 font-extrabold flex items-center justify-center text-lg shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {isHi ? item.crop_name_hi : item.crop_name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        {item.scientific_name}
                        {item.recommended_variety && (
                          <span className="text-kisan-700 not-italic font-semibold ml-2">
                            • {isHi ? 'उन्नत किस्म' : 'Variety'}: {item.recommended_variety}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Score & Calendar Action Button */}
                  <div className="flex items-center space-x-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end space-x-1">
                        <span className="text-3xl font-black text-gray-900">
                          {item.suitability_score}
                        </span>
                        <span className="text-xs text-gray-600 font-semibold">/100</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {isHi ? item.suitability_category_hi : badge.label}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectCropForCalendar(item.crop_id, item.recommended_variety)}
                      className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-kisan-50 hover:bg-kisan-100 text-kisan-800 border border-kisan-200 text-xs font-bold transition shadow-sm"
                      title="Plan in Crop Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isHi ? 'कैलेंडर में जोड़ें' : 'Plan Timeline'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600 block text-[11px]">
                        {isHi ? 'मृदा अनुकूलता' : 'Soil'} (30%)
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.breakdown.soil_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-[11px]">{item.breakdown.soil_score}/100</span>
                    </div>

                    <div>
                      <span className="text-gray-600 block text-[11px]">
                        {isHi ? 'जलवायु' : 'Climate'} (25%)
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.breakdown.climate_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-[11px]">{item.breakdown.climate_score}/100</span>
                    </div>

                    <div>
                      <span className="text-gray-600 block text-[11px]">
                        {isHi ? 'मौसम' : 'Season'} (20%)
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.breakdown.season_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-[11px]">{item.breakdown.season_score}/100</span>
                    </div>

                    <div>
                      <span className="text-gray-600 block text-[11px]">
                        {isHi ? 'जल उपलब्धता' : 'Water'} (15%)
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.breakdown.water_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-[11px]">{item.breakdown.water_score}/100</span>
                    </div>

                    <div>
                      <span className="text-gray-600 block text-[11px]">
                        {isHi ? 'फसल अवधि' : 'Duration'} (10%)
                      </span>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.breakdown.duration_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-[11px]">{item.breakdown.duration_score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Sowing & Harvest Window Metadata Pill */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-700 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                  <span className="flex items-center gap-1 font-semibold text-kisan-800">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isHi ? 'बुवाई' : 'Sow'}: {isHi ? item.sowing_period_hi : item.sowing_period}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-900">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isHi ? 'कटाई' : 'Harvest'}: {isHi ? item.harvest_period_hi : item.harvest_period}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isHi ? 'जल मांग' : 'Water Req'}: {item.water_requirement}</span>
                  </span>
                  <span>•</span>
                  <span className="text-gray-600">
                    {item.expected_duration_days} {t.calendar.days}
                  </span>
                </div>

                {/* Explainable Reasons & Risk Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* Why recommended */}
                  <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-900 block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.recommendations.whyRecommended}</span>
                    </span>
                    <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                      {(isHi ? item.why_recommended_hi : item.why_recommended).slice(0, 3).map((r, ri) => (
                        <li key={ri} className="leading-tight">{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks & Precautions */}
                  <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100 text-xs">
                    <span className="font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.recommendations.risksAlert}</span>
                    </span>
                    <ul className="space-y-1 text-amber-800 list-disc list-inside">
                      {(isHi ? item.important_risks_hi : item.important_risks).slice(0, 2).map((r, ri) => (
                        <li key={ri} className="leading-tight">{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Technical Disclaimer */}
      {recommendations && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <p className="leading-relaxed">
            {isHi ? recommendations.disclaimer_hi : recommendations.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};
