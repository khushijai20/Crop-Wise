'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, ExternalLink, Sparkles, CloudSun, Zap, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { AllApiKeysStatusResponse } from '@/types';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [status, setStatus] = useState<AllApiKeysStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form inputs
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [weatherKey, setWeatherKey] = useState('');

  // Password visibility toggles
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getApiKeysStatus();
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to load API keys status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload: any = {};
    if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
    if (groqKey.trim()) payload.groq_api_key = groqKey.trim();
    if (weatherKey.trim()) {
      payload.weather_api_key = weatherKey.trim();
      if (weatherKey.trim().length > 30) {
        payload.weatherapi_key = weatherKey.trim();
      }
    }

    try {
      const updated = await api.saveApiKeys(payload);
      setStatus(updated);
      setSuccessMsg('API keys saved and activated successfully! Runtime services re-initialized.');
      setGeminiKey('');
      setGroqKey('');
      setWeatherKey('');
      if (onKeysUpdated) onKeysUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save API keys.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-800 via-kisan-800 to-kisan-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
              <Key className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">API Keys Configuration 🔑</h3>
              <p className="text-xs text-emerald-100">Configure Groq, Google Gemini & Weather App API Keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Direct Runtime & Persistent Configuration</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Keys entered here are securely saved into your local <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">.env</code> and activated immediately without restarting the server.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Status Overview Pills */}
          {status && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Active AI</span>
                <span className="font-semibold text-gray-900 truncate block mt-0.5">
                  {status.active_ai_provider}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Active Weather</span>
                <span className="font-semibold text-gray-900 truncate block mt-0.5">
                  {status.active_weather_provider}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs col-span-2 sm:col-span-1">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Target Region</span>
                <span className="font-semibold text-kisan-800 block mt-0.5">Bihar (38 Districts)</span>
              </div>
            </div>
          )}

          {/* 1. Google Gemini API */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2.5 hover:border-kisan-400 transition bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-gray-900">1. Google Gemini API Key</span>
              </div>
              <div className="flex items-center space-x-2">
                {status?.gemini.is_configured ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Active ({status.gemini.masked_key})</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                    Not Configured
                  </span>
                )}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 hover:underline"
                  title="Get free Gemini key"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Powers Gemini 2.5 Flash for multimodal RAG reasoning, agronomic advice, and crop health questions.
            </p>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={status?.gemini.is_configured ? 'Paste new key to update (e.g. AIzaSy...)' : 'Paste Gemini API Key (e.g. AIzaSy...)'}
                className="w-full px-3 py-2 pr-16 text-xs sm:text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-kisan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-2 top-2 text-[11px] text-gray-500 hover:text-gray-800 px-1.5 py-0.5 rounded bg-gray-100"
              >
                {showGemini ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* 2. Groq Cloud API */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2.5 hover:border-kisan-400 transition bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-sm text-gray-900">2. Groq Cloud API Key</span>
              </div>
              <div className="flex items-center space-x-2">
                {status?.groq.is_configured ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Active ({status.groq.masked_key})</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                    Not Configured
                  </span>
                )}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-700 hover:text-amber-900 flex items-center space-x-0.5 hover:underline"
                  title="Get free Groq key"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Powers ultra-fast LLaMA 3.3 70B inference for sub-second agricultural answers in Hindi, Bhojpuri, Maithili & English.
            </p>
            <div className="relative">
              <input
                type={showGroq ? 'text' : 'password'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder={status?.groq.is_configured ? 'Paste new key to update (e.g. gsk_...)' : 'Paste Groq API Key (e.g. gsk_...)'}
                className="w-full px-3 py-2 pr-16 text-xs sm:text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-kisan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                className="absolute right-2 top-2 text-[11px] text-gray-500 hover:text-gray-800 px-1.5 py-0.5 rounded bg-gray-100"
              >
                {showGroq ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* 3. Weather App API */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2.5 hover:border-kisan-400 transition bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CloudSun className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-gray-900">3. Weather App API Key</span>
              </div>
              <div className="flex items-center space-x-2">
                {status?.weather.is_configured ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Active ({status.weather.masked_key})</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[11px] font-bold rounded-full">
                    Using Open-Meteo
                  </span>
                )}
                <a
                  href="https://www.weatherapi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center space-x-0.5 hover:underline"
                  title="Get WeatherAPI key"
                >
                  <span>WeatherAPI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Integrates WeatherAPI.com or OpenWeatherMap for commercial live forecasts. If omitted, Open-Meteo open science API works automatically without any key.
            </p>
            <div className="relative">
              <input
                type={showWeather ? 'text' : 'password'}
                value={weatherKey}
                onChange={(e) => setWeatherKey(e.target.value)}
                placeholder={status?.weather.is_configured ? 'Paste new key to update...' : 'Paste WeatherAPI or OpenWeather API Key...'}
                className="w-full px-3 py-2 pr-16 text-xs sm:text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-kisan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowWeather(!showWeather)}
                className="absolute right-2 top-2 text-[11px] text-gray-500 hover:text-gray-800 px-1.5 py-0.5 rounded bg-gray-100"
              >
                {showWeather ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-emerald-700 to-kisan-700 hover:from-emerald-800 hover:to-kisan-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Connecting...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Save & Connect Keys</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
