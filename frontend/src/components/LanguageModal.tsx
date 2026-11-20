'use client';

import React from 'react';
import { X, Check, Globe, Sparkles } from 'lucide-react';
import { Language, LANGUAGE_OPTIONS } from '@/lib/translations';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectLang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-kisan-800 to-kisan-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-kisan-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">भाषा प्राथमिकता चुनें</h3>
              <p className="text-xs text-kisan-100">Select Language Preference for Bihar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>स्मार्ट किसान बिहार</strong> आपकी चुनी हुई भाषा को सहेज लेता है। एआई सहायक (AI Assistant) भी इसी भाषा में परामर्श देगा।
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = currentLang === opt.code;
              return (
                <div
                  key={opt.code}
                  onClick={() => {
                    onSelectLang(opt.code);
                    onClose();
                  }}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-kisan-600 bg-kisan-50/70 shadow-sm'
                      : 'border-gray-200 hover:border-kisan-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900 tracking-tight">
                        {opt.nativeName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                        {opt.name}
                      </span>
                      {opt.code === 'hi' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          मानक
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-kisan-700">
                      📍 {opt.region}
                    </div>
                    <div className="text-xs text-gray-500">
                      {opt.subtext}
                    </div>
                  </div>

                  <div className="ml-4 shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-kisan-600 text-white'
                          : 'border-2 border-gray-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            सहेजी गई भाषा: <strong className="text-kisan-800 font-semibold">{LANGUAGE_OPTIONS.find(l => l.code === currentLang)?.nativeName}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-kisan-700 hover:bg-kisan-800 text-white font-medium shadow-sm transition"
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
