from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Location Schemas ---
class StateBase(BaseModel):
    id: int
    name: str
    country_code: str
    model_config = ConfigDict(from_attributes=True)

class DistrictBase(BaseModel):
    id: int
    state_id: int
    name: str
    latitude: float
    longitude: float
    administrative_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class BlockBase(BaseModel):
    id: int
    district_id: int
    name: str
    administrative_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class LocationSearchResult(BaseModel):
    district_id: int
    district_name: str
    state_name: str
    latitude: float
    longitude: float


# --- Weather Schemas ---
class WeatherCurrent(BaseModel):
    temperature: float
    relative_humidity: float
    precipitation: float
    rain: float
    weather_code: int
    weather_description: str
    weather_description_hi: str
    wind_speed: float
    data_source: str
    is_live: bool
    recorded_at: str

class DailyForecastItem(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    precipitation_sum: float
    precipitation_probability: Optional[float] = 0.0
    weather_code: int
    weather_description: str
    weather_description_hi: str

class WeatherForecastResponse(BaseModel):
    district_id: int
    district_name: str
    latitude: float
    longitude: float
    current: WeatherCurrent
    daily_forecast: List[DailyForecastItem]
    status: str
    data_status_label: str  # "Live API Data", "Cached Regional Data", "Estimated Baseline"
    warning: Optional[str] = None

class WeatherHistoryPoint(BaseModel):
    date: str
    temperature_mean: float
    precipitation_sum: float

class WeatherHistoryResponse(BaseModel):
    district_id: int
    district_name: str
    points: List[WeatherHistoryPoint]
    source: str


# --- Soil Schemas ---
class SoilDataBase(BaseModel):
    id: Optional[int] = None
    district_id: int
    soil_type: str
    ph: float
    nitrogen: float
    organic_carbon: float
    clay_percentage: float
    sand_percentage: float
    silt_percentage: float
    source: str
    data_resolution: str
    verified_at: Optional[str] = None
    data_status_label: str = "Verified Regional Soil Data"
    model_config = ConfigDict(from_attributes=True)

class SoilTestReportInput(BaseModel):
    district_id: int
    farmer_name: Optional[str] = None
    soil_type: Optional[str] = "Farm Tested Loam"
    ph: float = Field(..., ge=3.0, le=10.0, description="Soil pH value between 3 and 10")
    nitrogen: float = Field(..., ge=0.0, le=800.0, description="Available Nitrogen in kg/ha")
    organic_carbon: float = Field(..., ge=0.0, le=5.0, description="Organic Carbon percentage")
    clay_percentage: Optional[float] = 30.0
    sand_percentage: Optional[float] = 40.0
    silt_percentage: Optional[float] = 30.0


# --- Crop Schemas ---
class CropRequirementBase(BaseModel):
    id: int
    crop_id: int
    season: str
    ph_min: float
    ph_max: float
    temperature_min: float
    temperature_max: float
    rainfall_min: float
    rainfall_max: float
    water_requirement: str
    duration_days: int
    suitable_soil_types: str
    model_config = ConfigDict(from_attributes=True)

class CropBase(BaseModel):
    id: int
    name: str
    scientific_name: str
    category: str
    description: Optional[str] = None
    requirements: Optional[List[CropRequirementBase]] = []
    model_config = ConfigDict(from_attributes=True)


# --- Recommendation Engine Schemas ---
class RecommendationRequest(BaseModel):
    district_id: int
    season: Optional[str] = None  # If omitted, auto-detected from current month
    soil_test_values: Optional[SoilTestReportInput] = None
    water_availability: Optional[str] = "Moderate"  # High, Moderate, Low, Rainfed

class CropScoreBreakdown(BaseModel):
    soil_score: float
    climate_score: float
    season_score: float
    water_score: float
    duration_score: float

class RecommendationItem(BaseModel):
    crop_id: int
    crop_name: str
    crop_name_hi: str
    scientific_name: str
    category: str
    suitability_score: float  # 0 to 100
    suitability_category: str  # "Highly suitable", "Potentially suitable", "Less suitable"
    suitability_category_hi: str
    breakdown: CropScoreBreakdown
    why_recommended: List[str]
    why_recommended_hi: List[str]
    important_risks: List[str]
    important_risks_hi: List[str]
    water_requirement: str
    expected_duration_days: int
    sowing_period: str
    sowing_period_hi: str
    harvest_period: str
    harvest_period_hi: str
    recommended_variety: Optional[str] = None
    data_source: str
    confidence: str  # High, Medium, Estimated

class RecommendationResponse(BaseModel):
    district_id: int
    district_name: str
    season_evaluated: str
    soil_source_used: str
    weather_source_used: str
    recommendations: List[RecommendationItem]
    disclaimer: str
    disclaimer_hi: str


# --- Crop Calendar Schemas ---
class CalendarRequest(BaseModel):
    crop_id: int
    district_id: int
    sowing_date: str  # YYYY-MM-DD
    variety: Optional[str] = None

class PhenologicalStage(BaseModel):
    stage_name: str
    stage_name_hi: str
    start_day: int
    end_day: int
    start_date: str
    end_date: str
    description: str
    description_hi: str
    irrigation_guidance: str
    irrigation_guidance_hi: str
    key_activities: List[str]
    key_activities_hi: List[str]

class CalendarResponse(BaseModel):
    crop_id: int
    crop_name: str
    crop_name_hi: str
    variety: str
    sowing_date: str
    estimated_harvest_start: str
    estimated_harvest_end: str
    total_duration_days: int
    stages: List[PhenologicalStage]
    seasonal_advisory: str
    seasonal_advisory_hi: str
    source_reference: str


# --- Assistant Schemas ---
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    district_id: Optional[int] = 26  # Default Patna
    language: Optional[str] = "hi"  # "hi" or "en"
    conversation_history: Optional[List[ChatMessage]] = []

class SourceCitation(BaseModel):
    title: str
    source: str
    relevance: str

class ChatResponse(BaseModel):
    answer: str
    language: str
    sources: List[SourceCitation]
    is_gemini_active: bool
    status_message: Optional[str] = None


# --- Admin & Health Schemas ---
class HealthCheck(BaseModel):
    status: str
    database: str
    open_meteo_api: str
    soilgrids_api: str
    gemini_api: str
    timestamp: str

class DataSourceInfo(BaseModel):
    name: str
    type: str
    provider: str
    status: str
    documentation_url: str
    rate_limit: str
    last_verified: str
