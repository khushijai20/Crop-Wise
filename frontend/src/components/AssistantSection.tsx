'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, User, Sparkles, BookOpen,
  ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { ChatMessage, SourceCitation, ChatResponse } from '@/types';
import { Language, translations } from '@/lib/translations';

interface AssistantSectionProps {
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<ChatResponse>;
  lang: Language;
  districtName: string;
}

export const AssistantSection: React.FC<AssistantSectionProps> = ({
  chatHistory,
  onSendMessage,
  lang,
  districtName,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [isGeminiActive, setIsGeminiActive] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    t.assistant.p1,
    t.assistant.p2,
    t.assistant.p3,
    t.assistant.p4,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSubmit = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setInputMessage('');
    setLoading(true);

    try {
      const resp = await onSendMessage(textToSend);
      setSources(resp.sources || []);
      setIsGeminiActive(resp.is_gemini_active);
      setStatusMessage(resp.status_message || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-kisan-600" />
            <span>{t.assistant.title}</span>
          </h2>
          <p className="text-sm text-gray-600">{t.assistant.subtitle}</p>
        </div>

        {/* AI Engine Status Pill */}
        <span
          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto ${
            isGeminiActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-kisan-600" />
          <span>{isGeminiActive ? t.assistant.geminiActiveBadge : t.assistant.offlineModeBadge}</span>
        </span>
      </div>

      {/* Main Chat Interface Box */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md flex flex-col h-[600px] overflow-hidden">
        {/* Chat History Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Welcome Greeting from Assistant */}
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kisan-600 to-kisan-800 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-xl text-sm text-gray-800 leading-relaxed shadow-sm">
              <p className="font-semibold text-kisan-900 mb-1">
                {isHi ? 'नमस्ते! मैं आपका स्मार्ट किसान सहायक हूँ।' : 'Hello! I am your Smart Kisan Assistant.'}
              </p>
              <p>
                {isHi
                  ? `मैं ${districtName} ज़िले के वास्तविक मौसम, मिट्टी और ICAR संस्तुतियों के आधार पर आपकी मदद करने के लिए तैयार हूँ। आप बुवाई, खाद, सिंचाई या कीट नियंत्रण के बारे में कुछ भी पूछ सकते हैं!`
                  : `I am ready to help based on actual weather, soil, and ICAR guidelines for ${districtName} district. Ask me about sowing times, fertilizers, pest alerts, or crop recommendations!`}
              </p>
            </div>
          </div>

          {/* User and AI Messages */}
          {chatHistory.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-kisan-700 text-white'
                      : 'bg-gradient-to-br from-kisan-600 to-kisan-800 text-white'
                  }`}
                >
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div
                  className={`rounded-2xl p-4 max-w-xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-kisan-700 text-white'
                      : 'bg-gray-50 border border-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kisan-600 to-kisan-800 flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-500 italic">
                {isHi ? 'कृषि डेटाबेस एवं मौसम का विश्लेषण जारी...' : 'Analyzing agronomic knowledge & local weather...'}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Supporting RAG Citations (if any returned) */}
        {sources.length > 0 && (
          <div className="bg-kisan-50/60 border-t border-kisan-100 px-6 py-2.5 text-xs">
            <span className="font-bold text-kisan-900 mr-2 flex items-center gap-1 inline-flex">
              <BookOpen className="w-3.5 h-3.5 text-kisan-700" />
              <span>{t.assistant.sources}:</span>
            </span>
            <div className="inline-flex flex-wrap gap-2 mt-1">
              {sources.map((s, i) => (
                <span key={i} className="bg-white border border-kisan-200 px-2 py-0.5 rounded-md text-[11px] text-kisan-800 font-medium">
                  {s.title} ({s.source})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Question Chips */}
        <div className="p-3 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-gray-600 shrink-0">
              {isHi ? 'सुझावित प्रश्न:' : 'Suggested:'}
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(p)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-kisan-50 border border-gray-200 text-xs font-medium text-gray-700 hover:text-kisan-800 whitespace-nowrap transition shadow-2xs disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(inputMessage);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={t.assistant.placeholder}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-3 rounded-2xl bg-kisan-700 hover:bg-kisan-800 text-white font-bold transition shadow-sm disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
