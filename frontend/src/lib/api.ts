import {
  State, District, LocationSearchResult,
  WeatherForecastResponse, WeatherHistoryResponse,
  SoilData, SoilTestReportInput,
  Crop, RecommendationRequest, RecommendationResponse,
  CalendarRequest, CalendarResponse,
  ChatRequest, ChatResponse, DataSourceInfo,
  FarmerPreferenceInput, FarmerPreferenceResponse,
  AllApiKeysStatusResponse, SaveApiKeysInput
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch (_) {}
      throw new Error(errorDetail);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Locations
  getStates: () => fetchJson<State[]>('/states'),
  getDistricts: (stateId: number) => fetchJson<District[]>(`/districts/${stateId}`),
  searchLocations: (q: string) => fetchJson<LocationSearchResult[]>(`/locations/search?q=${encodeURIComponent(q)}`),

  // Weather
  getWeather: (districtId: number) => fetchJson<WeatherForecastResponse>(`/weather/${districtId}`),
  getWeatherHistory: (districtId: number) => fetchJson<WeatherHistoryResponse>(`/weather/${districtId}/history`),

  // Soil
  getSoil: (districtId: number) => fetchJson<SoilData>(`/soil/${districtId}`),
  submitSoilReport: (data: SoilTestReportInput) =>
    fetchJson<SoilData>('/soil/test-report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Crops
  getCrops: () => fetchJson<Crop[]>('/crops'),
  getCropById: (cropId: number) => fetchJson<Crop>(`/crops/${cropId}`),

  // Recommendations
  getRecommendations: (req: RecommendationRequest) =>
    fetchJson<RecommendationResponse>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Calendar
  calculateCalendar: (req: CalendarRequest) =>
    fetchJson<CalendarResponse>('/calendar', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // AI Assistant
  sendChatMessage: (req: ChatRequest) =>
    fetchJson<ChatResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Farmer Language & District Preferences
  getPreferences: (farmerId?: number) =>
    fetchJson<FarmerPreferenceResponse>(`/farmer/preferences${farmerId ? `?farmer_id=${farmerId}` : ''}`),
  updatePreferences: (data: FarmerPreferenceInput) =>
    fetchJson<FarmerPreferenceResponse>('/farmer/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // API Keys (Groq, Gemini, Weather App)
  getApiKeysStatus: () => fetchJson<AllApiKeysStatusResponse>('/api-keys/status'),
  saveApiKeys: (data: SaveApiKeysInput) =>
    fetchJson<AllApiKeysStatusResponse>('/api-keys/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Data Sources & Health
  getDataSources: () => fetchJson<DataSourceInfo[]>('/data-sources'),
  getHealth: () => fetchJson<any>('/health'),
};
