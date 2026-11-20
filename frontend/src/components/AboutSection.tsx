'use client';

import React, { useEffect, useState } from 'react';
import { Info, ExternalLink, ShieldCheck, AlertTriangle, Database, Cpu } from 'lucide-react';
import { DataSourceInfo } from '@/types';
import { Language, translations } from '@/lib/translations';
import { api } from '@/lib/api';

interface AboutSectionProps {
  lang: Language;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  const [dataSources, setDataSources] = useState<DataSourceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDataSources()
      .then((data) => setDataSources(data))
      .catch((err) => console.error('Failed to load data sources', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Info className="w-7 h-7 text-kisan-600" />
          <span>{t.about.title}</span>
        </h2>
        <p className="text-sm text-gray-600">{t.tagline}</p>
      </div>

      {/* Mission & Platform Identity */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-kisan-700" />
          <span>{t.about.missionTitle}</span>
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {t.about.missionDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="p-4 rounded-2xl bg-kisan-50/70 border border-kisan-100">
            <span className="text-2xl font-black text-kisan-800">38 / 38</span>
            <span className="text-xs font-semibold text-kisan-900 block mt-1">
              {isHi ? 'बिहार के सभी ज़िले आच्छादित' : 'Bihar Districts Fully Mapped'}
            </span>
            <span className="text-[11px] text-gray-600">
              {isHi ? 'आधिकारिक LGD निर्देशांकों के साथ' : 'With verified LGD coordinates'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-kisan-50/70 border border-kisan-100">
            <span className="text-2xl font-black text-kisan-800">19+</span>
            <span className="text-xs font-semibold text-kisan-900 block mt-1">
              {isHi ? 'प्रमुख सत्यापित फसलें' : 'Verified Major Crops'}
            </span>
            <span className="text-[11px] text-gray-600">
              {isHi ? 'अनाज, दलहन, तिलहन व सब्जियां' : 'Cereals, Pulses, Oilseeds & Veg'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-kisan-50/70 border border-kisan-100">
            <span className="text-2xl font-black text-kisan-800">100%</span>
            <span className="text-xs font-semibold text-kisan-900 block mt-1">
              {isHi ? 'द्विभाषी सहायता' : 'Bilingual Support'}
            </span>
            <span className="text-[11px] text-gray-600">
              {isHi ? 'हिंदी एवं अंग्रेज़ी में पूर्ण इंटरफ़ेस' : 'Hindi & English throughout'}
            </span>
          </div>
        </div>
      </div>

      {/* External APIs & Datasets Provenance Directory */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-kisan-700" />
          <span>{t.about.dataSourcesTitle}</span>
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dataSources.map((ds, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{ds.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                      {ds.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isHi ? 'प्रदाता' : 'Provider'}: <span className="font-medium text-gray-800">{ds.provider}</span> •{' '}
                    {isHi ? 'सीमा' : 'Limits'}: {ds.rate_limit}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    {ds.status}
                  </span>
                  {ds.documentation_url && (
                    <a
                      href={ds.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-kisan-700 hover:bg-kisan-50 transition"
                      title="View Official API Documentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Agronomic Limitations Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 text-amber-900 space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>{t.about.disclaimerTitle}</span>
        </h3>
        <p className="text-xs text-amber-900/90 leading-relaxed">
          {t.about.disclaimerDesc}
        </p>
      </div>
    </div>
  );
};
