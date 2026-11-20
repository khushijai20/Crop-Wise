'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, X, Check, AlertCircle } from 'lucide-react';
import { State, District } from '@/types';
import { Language, translations } from '@/lib/translations';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  states: State[];
  districts: District[];
  selectedStateId: number;
  onSelectState: (stateId: number) => void;
  selectedDistrict: District | null;
  onSelectDistrict: (district: District) => void;
  lang: Language;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  states,
  districts,
  selectedStateId,
  onSelectState,
  selectedDistrict,
  onSelectDistrict,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[lang];

  if (!isOpen) return null;

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-kisan-100 rounded-lg text-kisan-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'hi' ? 'स्थान चयन (राज्य एवं ज़िला)' : 'Select Location'}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'hi'
                  ? 'मौसम एवं मृदा विश्लेषण हेतु अपना ज़िला चुनें'
                  : 'Choose state and district for local advisories'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Selection Tabs / Dropdown */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            {t.location.selectState}
          </label>
          <div className="flex flex-wrap gap-2">
            {states.map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectState(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  selectedStateId === st.id
                    ? 'bg-kisan-700 text-white border-kisan-700 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-kisan-300'
                }`}
              >
                {st.name} {st.name === 'Bihar' ? '🌱 (Priority)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input for Districts */}
        <div className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.location.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500/20 focus:border-kisan-600 transition"
            />
          </div>
        </div>

        {/* District Grid / List */}
        <div className="mt-4 max-h-60 overflow-y-auto pr-1 space-y-1">
          {filteredDistricts.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              {lang === 'hi' ? 'कोई ज़िला नहीं मिला' : 'No districts found matching query'}
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition ${
                    isSelected
                      ? 'bg-kisan-50 border border-kisan-300 text-kisan-900 font-semibold'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div>
                    <span>{dist.name}</span>
                    <span className="text-[11px] text-gray-600 block">
                      Lat: {dist.latitude.toFixed(2)}°N, Lon: {dist.longitude.toFixed(2)}°E
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-kisan-700" />}
                </button>
              );
            })
          )}
        </div>

        {/* Disclaimer Alert */}
        <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{t.location.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
