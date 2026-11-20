'use client';

import React, { useState, useEffect } from 'react';
import {
  Sprout, CloudSun, Layers, CheckCircle2,
  Calendar, Bot, ArrowRight, MapPin, Sparkles, AlertCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { LocationPicker } from '@/components/LocationPicker';
import { DistrictMap } from '@/components/DistrictMap';
import { WeatherSection } from '@/components/WeatherSection';
import { SoilSection } from '@/components/SoilSection';
import { RecommendationsSection } from '@/components/RecommendationsSection';
import { CropGuideSection } from '@/components/CropGuideSection';
import { CalendarSection } from '@/components/CalendarSection';
import { AssistantSection } from '@/components/AssistantSection';
import { AboutSection } from '@/components/AboutSection';
import { api } from '@/lib/api';
import { Language, translations } from '@/lib/translations';
import {
  State, District, WeatherForecastResponse,
  WeatherHistoryResponse, SoilData, SoilTestReportInput,
  Crop, RecommendationResponse, CalendarResponse,
  ChatMessage, ChatResponse
} from '@/types';

export default function Home() {
  const [lang, setLang] = useState<Language>('hi');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const t = translations[lang];
  const isHi = lang === 'hi';

  // Location State
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number>(1); // 1 = Bihar
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Weather State
  const [weather, setWeather] = useState<WeatherForecastResponse | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<WeatherHistoryResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Soil State
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [soilLoading, setSoilLoading] = useState(false);
  const [isCustomSoilApplied, setIsCustomSoilApplied] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>('Rabi');
  const [waterAvailability, setWaterAvailability] = useState<string>('Moderate');

  // Crops & Calendar State
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarCropId, setCalendarCropId] = useState<number>(2); // Default Wheat
  const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [varietyInput, setVarietyInput] = useState<string>('');

  // AI Assistant Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // 1. Initial Load: States, Districts (Bihar), Crops
  useEffect(() => {
    // Fetch states
    api.getStates().then((res) => {
      setStates(res);
      const bihar = res.find((s) => s.name === 'Bihar') || res[0];
      if (bihar) setSelectedStateId(bihar.id);
    }).catch(console.error);

    // Fetch crops catalog
    setCropsLoading(true);
    api.getCrops().then((c) => {
      setCrops(c);
      if (c.length > 0) setCalendarCropId(c[0].id);
    }).catch(console.error).finally(() => setCropsLoading(false));
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (!selectedStateId) return;
    api.getDistricts(selectedStateId).then((dists) => {
      setDistricts(dists);
      // Default to Patna (District ID 26 or first Bihar district)
      const patna = dists.find((d) => d.name === 'Patna') || dists[0];
      if (patna) {
        setSelectedDistrict(patna);
      }
    }).catch(console.error);
  }, [selectedStateId]);

  // 3. Fetch Data when District changes
  useEffect(() => {
    if (!selectedDistrict) return;
    loadDistrictData(selectedDistrict.id);
  }, [selectedDistrict]);

  const loadDistrictData = (districtId: number) => {
    // Weather
    setWeatherLoading(true);
    api.getWeather(districtId)
      .then(setWeather)
      .catch(console.error)
      .finally(() => setWeatherLoading(false));

    api.getWeatherHistory(districtId)
      .then(setWeatherHistory)
      .catch(console.error);

    // Soil
    setSoilLoading(true);
    api.getSoil(districtId)
      .then((s) => {
        setSoil(s);
        setIsCustomSoilApplied(false);
      })
      .catch(console.error)
      .finally(() => setSoilLoading(false));

    // Recommendations
    fetchRecommendations(districtId, selectedSeason, waterAvailability);

    // Crop Calendar calculation
    fetchCalendar(districtId, calendarCropId, sowingDate, varietyInput);
  };

  const fetchRecommendations = (districtId: number, season: string, water: string) => {
    setRecsLoading(true);
    api.getRecommendations({
      district_id: districtId,
      season: season,
      water_availability: water,
    })
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setRecsLoading(false));
  };

  const fetchCalendar = (districtId: number, cropId: number, date: string, variety?: string) => {
    setCalendarLoading(true);
    api.calculateCalendar({
      district_id: districtId,
      crop_id: cropId,
      sowing_date: date,
      variety: variety || undefined,
    })
      .then(setCalendarData)
      .catch(console.error)
      .finally(() => setCalendarLoading(false));
  };

  // Custom Soil Health Card submission
  const handleCustomSoilSubmit = async (report: SoilTestReportInput) => {
    try {
      const updatedSoil = await api.submitSoilReport(report);
      setSoil(updatedSoil);
      setIsCustomSoilApplied(true);
      // Re-evaluate recommendations with custom soil values
      if (selectedDistrict) {
        setRecsLoading(true);
        api.getRecommendations({
          district_id: selectedDistrict.id,
          season: selectedSeason,
          water_availability: waterAvailability,
          soil_test_values: report,
        })
          .then(setRecommendations)
          .catch(console.error)
          .finally(() => setRecsLoading(false));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleResetSoil = () => {
    if (selectedDistrict) {
      loadDistrictData(selectedDistrict.id);
    }
  };

  // Switch to Calendar with chosen crop
  const handleSelectCropForCalendar = (cropId: number, variety?: string) => {
    setCalendarCropId(cropId);
    if (variety) setVarietyInput(variety);
    if (selectedDistrict) {
      fetchCalendar(selectedDistrict.id, cropId, sowingDate, variety);
    }
    setCurrentTab('calendar');
  };

  // Chat message submission
  const handleSendChatMessage = async (msg: string): Promise<ChatResponse> => {
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(updatedHistory);

    const resp = await api.sendChatMessage({
      message: msg,
      district_id: selectedDistrict?.id || 26,
      language: lang,
      conversation_history: updatedHistory,
    });

    setChatHistory([...updatedHistory, { role: 'assistant', content: resp.answer }]);
    return resp;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-kisan-50/70 via-white to-kisan-50/30">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        selectedDistrict={selectedDistrict}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ===================== TAB 1: HOME DASHBOARD ===================== */}
        {currentTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Hero Welcome Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-kisan-900 via-kisan-800 to-kisan-950 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-kisan-200 border border-white/15">
                    {t.dashboard.today}: {new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-kisan-600/50 text-white border border-kisan-500/40">
                    {t.dashboard.season}: {isHi ? 'रबी मौसम (Rabi)' : 'Rabi Season'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
                  {t.dashboard.welcome}
                </h1>
                <p className="text-sm sm:text-base text-kisan-100/90 mt-2 leading-relaxed">
                  {t.dashboard.subheading}
                </p>

                {/* Location Quick Switcher Pill in Hero */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-kisan-900 font-bold text-xs sm:text-sm hover:bg-kisan-50 transition shadow-sm"
                  >
                    <MapPin className="w-4 h-4 text-kisan-600" />
                    <span>
                      {selectedDistrict ? `${selectedDistrict.name}, Bihar` : 'Select District'}
                    </span>
                    <span className="text-xs text-gray-400">▼</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('recommendations')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-kisan-700/60 hover:bg-kisan-700 text-white font-semibold text-xs sm:text-sm border border-white/20 transition"
                  >
                    <Sparkles className="w-4 h-4 text-kisan-300" />
                    <span>{isHi ? 'अनुशंसित फसलें देखें' : 'View Top Crops'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Temperature Card */}
              <div
                onClick={() => setCurrentTab('weather')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{t.dashboard.currentTemp}</span>
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition">
                    <CloudSun className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {weather ? `${weather.current.temperature}°C` : '--'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  {weather ? (isHi ? weather.current.weather_description_hi : weather.current.weather_description) : 'Loading...'}
                </p>
              </div>

              {/* Dominant Soil Type */}
              <div
                onClick={() => setCurrentTab('soil')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{t.dashboard.soilType}</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-bold text-gray-900 line-clamp-1">
                    {soil ? soil.soil_type : '--'}
                  </span>
                </div>
                <p className="text-xs text-kisan-700 font-semibold mt-1">
                  pH: {soil ? soil.ph : '--'} • N: {soil ? `${soil.nitrogen} kg/ha` : '--'}
                </p>
              </div>

              {/* Top Crop Recommendation */}
              <div
                onClick={() => setCurrentTab('recommendations')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{t.dashboard.topCrop}</span>
                  <div className="p-2 rounded-xl bg-kisan-50 text-kisan-700 group-hover:scale-110 transition">
                    <Sprout className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-bold text-gray-900 line-clamp-1">
                    {recommendations?.recommendations[0]
                      ? isHi
                        ? recommendations.recommendations[0].crop_name_hi
                        : recommendations.recommendations[0].crop_name
                      : '--'}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  {recommendations?.recommendations[0]
                    ? `${t.dashboard.suitability}: ${recommendations.recommendations[0].suitability_score}%`
                    : 'Evaluating...'}
                </p>
              </div>

              {/* AI Assistant Quick Pill */}
              <div
                onClick={() => setCurrentTab('assistant')}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {isHi ? 'स्मार्ट सहायक' : 'Smart Kisan AI'}
                  </span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-sm font-bold text-gray-900 block line-clamp-1">
                    {isHi ? 'कोई भी कृषि प्रश्न पूछें' : 'Ask Agronomic Questions'}
                  </span>
                </div>
                <p className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
                  <span>{isHi ? 'हिंदी एवं English' : 'Bilingual RAG'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </div>

            {/* Interactive District Map */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-kisan-600" />
                    <span>
                      {isHi
                        ? `कृषि मानचित्र (${selectedDistrict?.name || 'बिहार'})`
                        : `Agricultural District Map (${selectedDistrict?.name || 'Bihar'})`}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    {isHi
                      ? 'बिहार के 38 ज़िलों में से किसी पर भी क्लिक करके वहां का मौसम एवं मिट्टी जांचें'
                      : 'Click any district centroid to switch location and load micro-data'}
                  </p>
                </div>

                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-xs font-bold text-kisan-700 hover:text-kisan-900 underline"
                >
                  {isHi ? 'ज़िला सूची देखें' : 'View District List'}
                </button>
              </div>

              <DistrictMap
                district={selectedDistrict}
                districtsList={districts}
                onSelectDistrict={(d) => setSelectedDistrict(d)}
                lang={lang}
              />
            </div>

            {/* Bottom Split: Weather 7-Day Preview & Top Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weather Preview */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <CloudSun className="w-5 h-5 text-kisan-600" />
                      <span>{t.weather.sevenDayForecast}</span>
                    </h3>
                    <button
                      onClick={() => setCurrentTab('weather')}
                      className="text-xs font-bold text-kisan-700 hover:text-kisan-900 flex items-center gap-1"
                    >
                      <span>{t.dashboard.viewAll}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {weather?.daily_forecast.slice(0, 4).map((d, i) => (
                      <div
                        key={d.date}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                      >
                        <span className="font-bold text-gray-800">
                          {i === 0 ? (isHi ? 'आज' : 'Today') : d.date}
                        </span>
                        <span className="text-gray-600 line-clamp-1">
                          {isHi ? d.weather_description_hi : d.weather_description}
                        </span>
                        <span className="font-extrabold text-gray-900">
                          {d.temp_max}° / {d.temp_min}°C
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations Preview */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-kisan-600" />
                      <span>{t.recommendations.title}</span>
                    </h3>
                    <button
                      onClick={() => setCurrentTab('recommendations')}
                      className="text-xs font-bold text-kisan-700 hover:text-kisan-900 flex items-center gap-1"
                    >
                      <span>{t.dashboard.viewAll}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {recommendations?.recommendations.slice(0, 3).map((item, i) => (
                      <div
                        key={item.crop_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-kisan-700">#{i + 1}</span>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {isHi ? item.crop_name_hi : item.crop_name}
                            </span>
                            <span className="text-[10px] text-gray-600">{item.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-emerald-800 text-sm">
                            {item.suitability_score}%
                          </span>
                          <span className="block text-[10px] font-bold text-emerald-700">
                            {isHi ? item.suitability_category_hi : item.suitability_category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: WEATHER ===================== */}
        {currentTab === 'weather' && (
          <WeatherSection
            weather={weather}
            history={weatherHistory}
            loading={weatherLoading}
            lang={lang}
          />
        )}

        {/* ===================== TAB 3: SOIL HEALTH ===================== */}
        {currentTab === 'soil' && (
          <SoilSection
            soil={soil}
            loading={soilLoading}
            lang={lang}
            onSubmitCustomSoil={handleCustomSoilSubmit}
            onResetSoil={handleResetSoil}
            isCustomSoilApplied={isCustomSoilApplied}
          />
        )}

        {/* ===================== TAB 4: CROP RECOMMENDATIONS ===================== */}
        {currentTab === 'recommendations' && (
          <RecommendationsSection
            recommendations={recommendations}
            loading={recsLoading}
            lang={lang}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            waterAvailability={waterAvailability}
            setWaterAvailability={setWaterAvailability}
            onRefresh={() => {
              if (selectedDistrict) {
                fetchRecommendations(selectedDistrict.id, selectedSeason, waterAvailability);
              }
            }}
            onSelectCropForCalendar={handleSelectCropForCalendar}
          />
        )}

        {/* ===================== TAB 5: CROP GUIDE CATALOG ===================== */}
        {currentTab === 'guide' && (
          <CropGuideSection
            crops={crops}
            loading={cropsLoading}
            lang={lang}
          />
        )}

        {/* ===================== TAB 6: CROP CALENDAR ===================== */}
        {currentTab === 'calendar' && (
          <CalendarSection
            crops={crops}
            calendarData={calendarData}
            loading={calendarLoading}
            lang={lang}
            selectedCropId={calendarCropId}
            setSelectedCropId={setCalendarCropId}
            sowingDate={sowingDate}
            setSowingDate={setSowingDate}
            varietyInput={varietyInput}
            setVarietyInput={setVarietyInput}
            onCalculateCalendar={() => {
              if (selectedDistrict) {
                fetchCalendar(selectedDistrict.id, calendarCropId, sowingDate, varietyInput);
              }
            }}
          />
        )}

        {/* ===================== TAB 7: AI FARMING ASSISTANT ===================== */}
        {currentTab === 'assistant' && (
          <AssistantSection
            chatHistory={chatHistory}
            onSendMessage={handleSendChatMessage}
            lang={lang}
            districtName={selectedDistrict ? selectedDistrict.name : 'Bihar'}
          />
        )}

        {/* ===================== TAB 8: ABOUT & DATA SOURCES ===================== */}
        {currentTab === 'about' && (
          <AboutSection lang={lang} />
        )}
      </main>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        states={states}
        districts={districts}
        selectedStateId={selectedStateId}
        onSelectState={setSelectedStateId}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(d) => {
          setSelectedDistrict(d);
          setIsLocationModalOpen(false);
        }}
        lang={lang}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-kisan-100 bg-white/80 py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-kisan-900">
            Smart Kisan 🌱 – {t.tagline}
          </p>
          <p className="text-[11px] text-gray-400">
            Powered by Open-Meteo API • ISRIC SoilGrids • ICAR & BAU Sabour Agronomy • Google Gemini AI
          </p>
          <p className="text-[10px] text-gray-400">
            Designed for Indian Farmers with primary focus on Bihar (38 Districts)
          </p>
        </div>
      </footer>
    </div>
  );
}
