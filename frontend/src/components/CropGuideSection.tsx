'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Sprout, Droplets, Thermometer, Clock } from 'lucide-react';
import { Crop } from '@/types';
import { Language, translations } from '@/lib/translations';

interface CropGuideSectionProps {
  crops: Crop[];
  loading: boolean;
  lang: Language;
}

export const CropGuideSection: React.FC<CropGuideSectionProps> = ({
  crops,
  loading,
  lang,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Cereals', 'Pulses', 'Oilseeds', 'Vegetables', 'Cash and Other Crops'];

  const filteredCrops = crops.filter((crop) => {
    const matchesCategory = selectedCategory === 'All' || crop.category === selectedCategory;
    const matchesQuery =
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.scientific_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-kisan-600" />
          <span>{isHi ? 'विस्तृत फसल ज्ञानकोश' : 'Comprehensive Crop Guide'}</span>
        </h2>
        <p className="text-sm text-gray-600">
          {isHi
            ? 'ICAR एवं बिहार कृषि विश्वविद्यालय (BAU) द्वारा सत्यापित कृषि आवश्यकताएं एवं किस्में'
            : 'Verified agronomic requirements, soil compatibility, and climate thresholds'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-kisan-700 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-kisan-50 border border-gray-200'
              }`}
            >
              {cat === 'All'
                ? isHi ? 'सभी फसलें' : 'All'
                : cat === 'Cereals'
                ? isHi ? 'अनाज' : 'Cereals'
                : cat === 'Pulses'
                ? isHi ? 'दलहन' : 'Pulses'
                : cat === 'Oilseeds'
                ? isHi ? 'तिलहन' : 'Oilseeds'
                : cat === 'Vegetables'
                ? isHi ? 'सब्जियां' : 'Vegetables'
                : isHi ? 'नकदी फसलें' : 'Cash Crops'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isHi ? 'फसल या वैज्ञानिक नाम खोजें...' : 'Search crop or scientific name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
          />
        </div>
      </div>

      {/* Crop Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => {
            const req = crop.requirements && crop.requirements.length > 0 ? crop.requirements[0] : null;

            return (
              <div
                key={crop.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{crop.name}</h3>
                      <p className="text-xs text-gray-600 italic mt-0.5">{crop.scientific_name}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-kisan-50 text-kisan-800 font-semibold border border-kisan-200">
                      {crop.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                    {crop.description}
                  </p>
                </div>

                {req && (
                  <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <span className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span>{req.temperature_min}° - {req.temperature_max}°C</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-kisan-600" />
                        <span>{req.duration_days} {isHi ? 'दिन' : 'days'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span>{req.water_requirement} {isHi ? 'पानी' : 'Water'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                        <span>pH: {req.ph_min} - {req.ph_max}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 mt-2">
                      <span className="font-semibold text-gray-700">{isHi ? 'अनुकूल मिट्टी' : 'Soils'}:</span>{' '}
                      {req.suitable_soil_types}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
