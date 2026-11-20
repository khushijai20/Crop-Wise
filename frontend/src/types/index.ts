export interface State {
  id: number;
  name: string;
  country_code: string;
}

export interface District {
  id: number;
  state_id: number;
  name: string;
  latitude: float;
  longitude: float;
  administrative_code?: string;
}

type float = number;

export interface LocationSearchResult {
  district_id: number;
  district_name: string;
  state_name: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCurrent {
  temperature: number;
  relative_humidity: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  weather_description: string;
  weather_description_hi: string;
  wind_speed: number;
  data_source: string;
  is_live: boolean;
  recorded_at: string;
}

export interface DailyForecastItem {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  precipitation_probability: number;
  weather_code: number;
  weather_description: string;
  weather_description_hi: string;
}

export interface WeatherForecastResponse {
  district_id: number;
  district_name: string;
  latitude: number;
  longitude: number;
  current: WeatherCurrent;
  daily_forecast: DailyForecastItem[];
  status: string;
  data_status_label: string;
  warning?: string | null;
}

export interface WeatherHistoryPoint {
  date: string;
  temperature_mean: number;
  precipitation_sum: number;
}

export interface WeatherHistoryResponse {
  district_id: number;
  district_name: string;
  points: WeatherHistoryPoint[];
  source: string;
}

export interface SoilData {
  id?: number;
  district_id: number;
  soil_type: string;
  ph: number;
  nitrogen: number;
  organic_carbon: number;
  clay_percentage: number;
  sand_percentage: number;
  silt_percentage: number;
  source: string;
  data_resolution: string;
  verified_at?: string;
  data_status_label: string;
}

export interface SoilTestReportInput {
  district_id: number;
  farmer_name?: string;
  soil_type?: string;
  ph: number;
  nitrogen: number;
  organic_carbon: number;
  clay_percentage?: number;
  sand_percentage?: number;
  silt_percentage?: number;
}

export interface CropRequirement {
  id: number;
  crop_id: number;
  season: string;
  ph_min: number;
  ph_max: number;
  temperature_min: number;
  temperature_max: number;
  rainfall_min: number;
  rainfall_max: number;
  water_requirement: string;
  duration_days: number;
  suitable_soil_types: string;
}

export interface Crop {
  id: number;
  name: string;
  scientific_name: string;
  category: string;
  description?: string;
  requirements?: CropRequirement[];
}

export interface CropScoreBreakdown {
  soil_score: number;
  climate_score: number;
  season_score: number;
  water_score: number;
  duration_score: number;
}

export interface RecommendationItem {
  crop_id: number;
  crop_name: string;
  crop_name_hi: string;
  scientific_name: string;
  category: string;
  suitability_score: number;
  suitability_category: string;
  suitability_category_hi: string;
  breakdown: CropScoreBreakdown;
  why_recommended: string[];
  why_recommended_hi: string[];
  important_risks: string[];
  important_risks_hi: string[];
  water_requirement: string;
  expected_duration_days: number;
  sowing_period: string;
  sowing_period_hi: string;
  harvest_period: string;
  harvest_period_hi: string;
  recommended_variety?: string;
  data_source: string;
  confidence: string;
}

export interface RecommendationRequest {
  district_id: number;
  season?: string;
  soil_test_values?: SoilTestReportInput;
  water_availability?: string;
}

export interface RecommendationResponse {
  district_id: number;
  district_name: string;
  season_evaluated: string;
  soil_source_used: string;
  weather_source_used: string;
  recommendations: RecommendationItem[];
  disclaimer: string;
  disclaimer_hi: string;
}

export interface PhenologicalStage {
  stage_name: string;
  stage_name_hi: string;
  start_day: number;
  end_day: number;
  start_date: string;
  end_date: string;
  description: string;
  description_hi: string;
  irrigation_guidance: string;
  irrigation_guidance_hi: string;
  key_activities: string[];
  key_activities_hi: string[];
}

export interface CalendarRequest {
  crop_id: number;
  district_id: number;
  sowing_date: string;
  variety?: string;
}

export interface CalendarResponse {
  crop_id: number;
  crop_name: string;
  crop_name_hi: string;
  variety: string;
  sowing_date: string;
  estimated_harvest_start: string;
  estimated_harvest_end: string;
  total_duration_days: number;
  stages: PhenologicalStage[];
  seasonal_advisory: string;
  seasonal_advisory_hi: string;
  source_reference: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SourceCitation {
  title: string;
  source: string;
  relevance: string;
}

export interface ChatRequest {
  message: string;
  district_id?: number;
  language?: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  language: string;
  sources: SourceCitation[];
  is_gemini_active: boolean;
  status_message?: string | null;
}

export interface DataSourceInfo {
  name: string;
  type: string;
  provider: string;
  status: string;
  documentation_url: string;
  rate_limit: string;
  last_verified: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  english_name: string;
  region: string;
  is_default: boolean;
}

export interface FarmerPreferenceInput {
  farmer_id?: number;
  name?: string;
  preferred_language: string;
  district_id?: number;
}

export interface FarmerPreferenceResponse {
  farmer_id?: number;
  preferred_language: string;
  district_id?: number;
  supported_languages: SupportedLanguage[];
  message: string;
}

export interface ApiKeyItemStatus {
  name: string;
  is_configured: boolean;
  masked_key?: string | null;
  provider_details: string;
  docs_url: string;
}

export interface AllApiKeysStatusResponse {
  gemini: ApiKeyItemStatus;
  groq: ApiKeyItemStatus;
  weather: ApiKeyItemStatus;
  active_ai_provider: string;
  active_weather_provider: string;
  message: string;
}

export interface SaveApiKeysInput {
  gemini_api_key?: string;
  groq_api_key?: string;
  weather_api_key?: string;
  openweather_api_key?: string;
  weatherapi_key?: string;
}

