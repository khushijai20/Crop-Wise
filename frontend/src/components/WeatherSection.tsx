'use client';

import React from 'react';
import {
  CloudSun, Droplets, Wind, Thermometer,
  CalendarDays, CloudRain, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { WeatherForecastResponse, WeatherHistoryResponse } from '@/types';
import { Language, translations } from '@/lib/translations';

interface WeatherSectionProps {
  weather: WeatherForecastResponse | null;
  history: WeatherHistoryResponse | null;
  loading: boolean;
  lang: Language;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({
  weather,
  history,
  loading,
  lang,
}) => {
  const t = translations[lang];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-28 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
        <CloudSun className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Weather data currently unavailable.</p>
      </div>
    );
  }

  const curr = weather.current;
  const isHi = lang === 'hi';

  // Format 7-day chart data
  const forecastChartData = weather.daily_forecast.map((d) => ({
    date: d.date.slice(5), // MM-DD
    max: d.temp_max,
    min: d.temp_min,
    rain: d.precipitation_sum,
    prob: d.precipitation_probability || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CloudSun className="w-7 h-7 text-kisan-600" />
            <span>{t.weather.title}</span>
          </h2>
          <p className="text-sm text-gray-600">{t.weather.subtitle}</p>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              curr.is_live
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{weather.data_status_label}</span>
          </span>
        </div>
      </div>

      {/* Weather Warning / Offline Banner if present */}
      {weather.warning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{isHi ? 'मौसम सूचना' : 'Weather Notice'}</p>
            <p className="text-xs text-amber-800 mt-0.5">{weather.warning}</p>
          </div>
        </div>
      )}

      {/* Main Hero Weather Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kisan-800 via-kisan-700 to-kisan-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-kisan-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              {weather.district_name}, {isHi ? 'बिहार' : 'Bihar'}
            </span>
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-5xl sm:text-7xl font-extrabold tracking-tight">
                {curr.temperature}°
              </span>
              <span className="text-xl sm:text-2xl text-kisan-100 font-medium">C</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-kisan-100 mt-1">
              {isHi ? curr.weather_description_hi : curr.weather_description}
            </p>
            <p className="text-xs text-kisan-300 mt-2">
              {isHi ? 'रिकॉर्डेड समय' : 'Updated'}: {curr.recorded_at}
            </p>
          </div>

          {/* Quick Metrics Grid inside Hero */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:w-80">
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 text-center">
              <Droplets className="w-5 h-5 text-kisan-200 mx-auto mb-1" />
              <span className="text-[11px] text-kisan-200 block">{t.weather.humidity}</span>
              <span className="text-base sm:text-lg font-bold">{curr.relative_humidity}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 text-center">
              <CloudRain className="w-5 h-5 text-kisan-200 mx-auto mb-1" />
              <span className="text-[11px] text-kisan-200 block">{t.weather.rain}</span>
              <span className="text-base sm:text-lg font-bold">{curr.rain} mm</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 text-center">
              <Wind className="w-5 h-5 text-kisan-200 mx-auto mb-1" />
              <span className="text-[11px] text-kisan-200 block">{t.weather.windSpeed}</span>
              <span className="text-base sm:text-lg font-bold">{curr.wind_speed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-kisan-600" />
          <span>{t.weather.sevenDayForecast}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weather.daily_forecast.map((d, idx) => (
            <div
              key={d.date}
              className={`p-3 rounded-xl border text-center transition ${
                idx === 0
                  ? 'bg-kisan-50 border-kisan-200 shadow-sm'
                  : 'bg-gray-50/50 border-gray-100 hover:border-kisan-200'
              }`}
            >
              <p className="text-xs font-bold text-gray-800">
                {idx === 0 ? (isHi ? 'आज' : 'Today') : d.date.slice(5)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">
                {isHi ? d.weather_description_hi : d.weather_description}
              </p>
              <div className="my-2 text-sm font-extrabold text-gray-900">
                <span>{d.temp_max}°</span>
                <span className="text-xs font-normal text-gray-600 ml-1">{d.temp_min}°</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-[11px] text-blue-600">
                <Droplets className="w-3 h-3" />
                <span>{d.precipitation_probability}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temperature & Rainfall Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature Area Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>{isHi ? '7-दिवसीय तापमान रुझान (°C)' : '7-Day Temperature Trend (°C)'}</span>
            </span>
            <span className="text-xs font-normal text-gray-600">{isHi ? 'अधिकतम / न्यूनतम' : 'Max / Min'}</span>
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38a95c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38a95c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Area type="monotone" dataKey="max" stroke="#288847" fillOpacity={1} fill="url(#tempGradient)" name="Max Temp (°C)" />
                <Area type="monotone" dataKey="min" stroke="#88d8b0" fillOpacity={0.2} fill="#88d8b0" name="Min Temp (°C)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span>{isHi ? 'वर्षा की संभावना (%) एवं मात्रा' : 'Precipitation Probability (%)'}</span>
            </span>
            <span className="text-xs font-normal text-gray-600">{isHi ? 'पूर्वानुमान' : 'Forecast'}</span>
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastChartData}>
                <XAxis dataKey="date" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="prob" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Rain Probability (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
