'use client';

import React, { useState } from 'react';
import { Search, MapPin, X, Check, AlertCircle, Compass } from 'lucide-react';
import { District } from '@/types';
import { Language, translations } from '@/lib/translations';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
  selectedDistrict: District | null;
  onSelectDistrict: (district: District) => void;
  lang: Language;
}

// Bihar Agro-Climatic Zones
const ZONE_I_DISTRICTS = [
  'West Champaran', 'East Champaran', 'Sheohar', 'Sitamarhi', 'Madhubani',
  'Gopalganj', 'Siwan', 'Saran', 'Vaishali', 'Muzaffarpur', 'Darbhanga',
  'Samastipur', 'Begusarai'
];

const ZONE_II_DISTRICTS = [
  'Supaul', 'Saharsa', 'Madhepura', 'Purnia', 'Kishanganj', 'Araria',
  'Katihar', 'Khagaria'
];

const ZONE_III_DISTRICTS = [
  'Patna', 'Nalanda', 'Bhojpur', 'Buxar', 'Rohtas', 'Kaimur', 'Gaya',
  'Jehanabad', 'Arwal', 'Aurangabad', 'Nawada', 'Sheikhpura', 'Lakhisarai',
  'Jamui', 'Munger', 'Bhagalpur', 'Banka'
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  districts,
  selectedDistrict,
  onSelectDistrict,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState<string>('ALL');
  const t = translations[lang];
  const isHi = lang === 'hi';

  if (!isOpen) return null;

  const filteredDistricts = districts.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesZone = true;
    if (activeZone === 'ZONE_I') matchesZone = ZONE_I_DISTRICTS.includes(d.name);
    else if (activeZone === 'ZONE_II') matchesZone = ZONE_II_DISTRICTS.includes(d.name);
    else if (activeZone === 'ZONE_III') matchesZone = ZONE_III_DISTRICTS.includes(d.name);

    return matchesSearch && matchesZone;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-kisan-100 rounded-2xl text-kisan-800">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {isHi ? 'बिहार ज़िला चयन (38 ज़िले)' : 'Select Bihar District (38 Districts)'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {isHi ? 'बिहार विशेष' : 'Bihar Dedicated'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHi
                  ? 'अपने ज़िले का चयन करें ताकि सटीक मौसम, मृदा और फसल सलाह मिल सके'
                  : 'Select your district to load local weather, soil, and crop guidance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agro-Climatic Zone Filter Pills */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-kisan-600" />
            <span>{isHi ? 'कृषि-जलवायु क्षेत्र (Agro-Climatic Zones)' : 'Agro-Climatic Zones'}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'ALL', labelEn: 'All (38)', labelHi: 'सभी (38)' },
              { id: 'ZONE_I', labelEn: 'Zone I (North-West)', labelHi: 'ज़ोन 1 (उत्तर-पश्चिम)' },
              { id: 'ZONE_II', labelEn: 'Zone II (North-East)', labelHi: 'ज़ोन 2 (उत्तर-पूर्व)' },
              { id: 'ZONE_III', labelEn: 'Zone III (South Bihar)', labelHi: 'ज़ोन 3 (दक्षिण बिहार)' },
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-center border ${
                  activeZone === z.id
                    ? 'bg-kisan-700 text-white border-kisan-700 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-kisan-300'
                }`}
              >
                {isHi ? z.labelHi : z.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isHi ? 'ज़िला खोजें (उदा. पटना, गया, भागलपुर, मुज़फ़्फ़रपुर)...' : 'Search Bihar district (e.g. Patna, Gaya, Bhagalpur)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500/20 focus:border-kisan-600 transition"
            />
          </div>
        </div>

        {/* 38 Districts Grid */}
        <div className="mt-4 max-h-64 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {filteredDistricts.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-sm text-gray-500">
              {isHi ? 'कोई ज़िला नहीं मिला' : 'No districts found matching query'}
            </div>
          ) : (
            filteredDistricts.map((dist) => {
              const isSelected = selectedDistrict?.id === dist.id;
              return (
                <button
                  key={dist.id}
                  onClick={() => {
                    onSelectDistrict(dist);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition border ${
                    isSelected
                      ? 'bg-kisan-50 border-kisan-300 text-kisan-900 font-bold shadow-xs'
                      : 'border-transparent hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div>
                    <span className="block text-sm">{dist.name}</span>
                    <span className="text-[10px] text-gray-500 block">
                      {dist.latitude.toFixed(2)}°N, {dist.longitude.toFixed(2)}°E
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-kisan-700 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Disclaimer Alert */}
        <div className="mt-5 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{t.location.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
