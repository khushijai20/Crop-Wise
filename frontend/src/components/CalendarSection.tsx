'use client';

import React, { useState } from 'react';
import {
  Calendar, Clock, Droplets, CheckCircle,
  Sprout, Award, AlertCircle, ArrowRight
} from 'lucide-react';
import { Crop, CalendarResponse } from '@/types';
import { Language, translations } from '@/lib/translations';

interface CalendarSectionProps {
  crops: Crop[];
  calendarData: CalendarResponse | null;
  loading: boolean;
  lang: Language;
  selectedCropId: number;
  setSelectedCropId: (id: number) => void;
  sowingDate: string;
  setSowingDate: (date: string) => void;
  varietyInput: string;
  setVarietyInput: (v: string) => void;
  onCalculateCalendar: () => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  crops,
  calendarData,
  loading,
  lang,
  selectedCropId,
  setSelectedCropId,
  sowingDate,
  setSowingDate,
  varietyInput,
  setVarietyInput,
  onCalculateCalendar,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-kisan-600" />
          <span>{t.calendar.title}</span>
        </h2>
        <p className="text-sm text-gray-600">{t.calendar.subtitle}</p>
      </div>

      {/* Input Controls Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t.calendar.selectCrop}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Sowing Date Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t.calendar.sowingDate}
            </label>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
            />
          </div>

          {/* Variety (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t.calendar.variety}
            </label>
            <input
              type="text"
              placeholder={isHi ? 'उदा. DBW 187, स्वर्णा सब-1' : 'e.g. DBW 187, Swarna Sub-1'}
              value={varietyInput}
              onChange={(e) => setVarietyInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCalculateCalendar}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-kisan-700 hover:bg-kisan-800 text-white text-sm font-bold transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? (isHi ? 'गणना जारी...' : 'Calculating...') : t.calendar.calculateBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      )}

      {/* Results Banner & Stages */}
      {!loading && calendarData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Estimated Harvest Window Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-kisan-800 to-kisan-900 text-white p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-kisan-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  {t.calendar.summaryCard}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-3">
                  {isHi ? calendarData.crop_name_hi : calendarData.crop_name}
                  {calendarData.variety && (
                    <span className="text-lg font-normal text-kisan-200 ml-2">
                      ({calendarData.variety})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-kisan-300 mt-1">
                  {isHi ? 'अनुशंसित स्रोत' : 'Source'}: {calendarData.source_reference}
                </p>
              </div>

              {/* Harvest Estimation Window Pill */}
              <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 md:text-right">
                <span className="text-xs text-kisan-200 block font-medium">
                  {t.calendar.projectedHarvest}
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                  {calendarData.estimated_harvest_start}
                  <span className="text-sm font-normal text-kisan-200 mx-2">{isHi ? 'से' : 'to'}</span>
                  {calendarData.estimated_harvest_end}
                </span>
                <span className="text-xs text-kisan-300 block mt-1">
                  {t.calendar.totalDays}: {calendarData.total_duration_days} {t.calendar.days}
                </span>
              </div>
            </div>

            {/* Advisory Note */}
            <div className="mt-5 pt-4 border-t border-white/10 text-xs text-kisan-100 flex items-start space-x-2">
              <Sprout className="w-4 h-4 text-kisan-300 shrink-0 mt-0.5" />
              <p>{isHi ? calendarData.seasonal_advisory_hi : calendarData.seasonal_advisory}</p>
            </div>
          </div>

          {/* Phenological Stage Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-kisan-600" />
              <span>{t.calendar.stagesTitle}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendarData.stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-100 p-5 bg-gradient-to-br from-white to-gray-50/50 hover:border-kisan-300 transition shadow-sm space-y-3"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-kisan-100 text-kisan-800">
                      {isHi ? `चरण ${idx + 1}` : `Stage ${idx + 1}`}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      {stage.start_day} - {stage.end_day} {t.calendar.days}
                    </span>
                  </div>

                  {/* Stage Name & Date Range */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900">
                      {isHi ? stage.stage_name_hi : stage.stage_name}
                    </h4>
                    <span className="text-xs text-kisan-700 font-semibold block mt-0.5">
                      {stage.start_date} → {stage.end_date}
                    </span>
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                      {isHi ? stage.description_hi : stage.description}
                    </p>
                  </div>

                  {/* Irrigation Milestone Guidance */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold mb-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.calendar.irrigationReminder}</span>
                    </div>
                    <p className="text-blue-800 text-[11px] leading-tight">
                      {isHi ? stage.irrigation_guidance_hi : stage.irrigation_guidance}
                    </p>
                  </div>

                  {/* Key Activities */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 block mb-1">
                      {t.calendar.keyActivities}:
                    </span>
                    <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                      {(isHi ? stage.key_activities_hi : stage.key_activities).map((act, ai) => (
                        <li key={ai} className="leading-tight">{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
