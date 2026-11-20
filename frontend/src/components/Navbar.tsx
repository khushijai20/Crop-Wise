'use client';

import React, { useState } from 'react';
import {
  Sprout, CloudSun, Layers, CheckCircle2,
  BookOpen, Calendar, Bot, Info, Globe, Menu, X, MapPin
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { District } from '@/types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  selectedDistrict: District | null;
  onOpenLocationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  selectedDistrict,
  onOpenLocationModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const navItems = [
    { id: 'home', label: t.nav.home, icon: Sprout },
    { id: 'weather', label: t.nav.weather, icon: CloudSun },
    { id: 'soil', label: t.nav.soil, icon: Layers },
    { id: 'recommendations', label: t.nav.recommendations, icon: CheckCircle2 },
    { id: 'guide', label: t.nav.guide, icon: BookOpen },
    { id: 'calendar', label: t.nav.calendar, icon: Calendar },
    { id: 'assistant', label: t.nav.assistant, icon: Bot },
    { id: 'about', label: t.nav.about, icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-kisan-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-kisan-500 to-kisan-700 flex items-center justify-center text-white shadow-md shadow-kisan-500/20">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-kisan-900 tracking-tight">
                  {t.appName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-kisan-100 text-kisan-800 font-semibold border border-kisan-200">
                  v2.0 🌱
                </span>
              </div>
              <p className="text-xs text-kisan-600 font-medium hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Quick Location Badge & Language Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Location Pill */}
            <button
              onClick={onOpenLocationModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-kisan-50 hover:bg-kisan-100 border border-kisan-200 text-kisan-800 text-xs sm:text-sm font-medium transition shadow-sm"
              title="Change District"
            >
              <MapPin className="w-3.5 h-3.5 text-kisan-600" />
              <span className="font-semibold text-kisan-900">
                {selectedDistrict ? selectedDistrict.name : 'Select District'}
              </span>
              <span className="text-gray-400 text-[10px]">▼</span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-kisan-500 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:text-kisan-700 transition shadow-sm"
              title="Toggle English / हिन्दी"
            >
              <Globe className="w-3.5 h-3.5 text-kisan-600" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            {/* Mobile menu hamburger */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-kisan-800 hover:bg-kisan-50"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex space-x-1 pb-2 overflow-x-auto no-scrollbar border-t border-gray-50 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-kisan-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-kisan-800 hover:bg-kisan-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-kisan-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-kisan-700 text-white'
                      : 'text-gray-700 hover:bg-kisan-50 hover:text-kisan-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-kisan-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
