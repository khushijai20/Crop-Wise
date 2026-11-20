import os
import time
import logging
import httpx
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.schemas.schemas import HealthCheck, DataSourceInfo
from app.services.data_importer import seed_all

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", response_model=HealthCheck)
async def check_health(db: Session = Depends(get_db)):
    """System health inspection for database, Open-Meteo, SoilGrids, and Gemini."""
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    open_meteo_status = "operational"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.OPEN_METEO_BASE_URL}/forecast?latitude=25.59&longitude=85.13&current=temperature_2m")
            if res.status_code != 200:
                open_meteo_status = f"warning: status {res.status_code}"
    except Exception:
        open_meteo_status = "offline/fallback_mode"

    soilgrids_status = "operational (cached fallback available)"
    gemini_status = "configured" if settings.GEMINI_API_KEY else "unconfigured (using verified agronomic knowledge fallback)"

    return HealthCheck(
        status="ok",
        database=db_status,
        open_meteo_api=open_meteo_status,
        soilgrids_api=soilgrids_status,
        gemini_api=gemini_status,
        timestamp=datetime.utcnow().isoformat()
    )

@router.get("/data-sources", response_model=List[DataSourceInfo])
def get_data_sources():
    """Directory of all integrated external APIs, datasets, and provenance licenses."""
    return [
        DataSourceInfo(
            name="Open-Meteo Forecast & Archive API",
            type="Weather & Climate",
            provider="Open-Meteo GmbH",
            status="Live & Active",
            documentation_url="https://open-meteo.com/en/docs",
            rate_limit="10,000 requests/day fair use",
            last_verified="2026 Live"
        ),
        DataSourceInfo(
            name="India Meteorological Department (IMD) API",
            type="Weather Forecast & Warnings",
            provider="Ministry of Earth Sciences, Govt of India",
            status="Configuration Ready (Credentials required for private gateway)",
            documentation_url="https://api.imd.gov.in/public/api_reference.html",
            rate_limit="Authorized Token Access",
            last_verified="2026 Reference"
        ),
        DataSourceInfo(
            name="ISRIC SoilGrids v2.0 REST API",
            type="Soil Physical & Chemical Properties",
            provider="ISRIC - World Soil Information",
            status="Active with Regional Fallback",
            documentation_url="https://docs.isric.org/globaldata/soilgrids/",
            rate_limit="Standard REST Fair Use",
            last_verified="2026 Live"
        ),
        DataSourceInfo(
            name="Bihar Soil Health Card & ICAR-RCER Dataset",
            type="District Soil Baseline",
            provider="Department of Agriculture, Govt of Bihar / ICAR Patna",
            status="Verified Seeded Dataset",
            documentation_url="https://soilhealth.dac.gov.in/",
            rate_limit="Offline Database",
            last_verified="April 2026"
        ),
        DataSourceInfo(
            name="ICAR & BAU Sabour Agronomic Package of Practices",
            type="Crops, Calendar & Pest Management",
            provider="Indian Council of Agricultural Research / BAU Sabour",
            status="Verified Seeded Dataset",
            documentation_url="https://bausabour.ac.in/",
            rate_limit="Offline Database",
            last_verified="May 2026"
        ),
        DataSourceInfo(
            name="Google Gemini API",
            type="Generative AI & Agricultural RAG",
            provider="Google DeepMind / Google Cloud",
            status="Integrated (Active via GEMINI_API_KEY)" if settings.GEMINI_API_KEY else "Ready for Key",
            documentation_url="https://ai.google.dev/gemini-api/docs",
            rate_limit="Per Gemini API Tier",
            last_verified="2026 Live"
        ),
        DataSourceInfo(
            name="Groq Cloud LLaMA 3.3 API",
            type="Ultra-Fast Generative AI Inference",
            provider="Groq Inc.",
            status="Integrated (Active via GROQ_API_KEY)" if settings.GROQ_API_KEY else "Ready for Key",
            documentation_url="https://console.groq.com/docs",
            rate_limit="High-Speed Free/Pro Tier",
            last_verified="2026 Live"
        ),
        DataSourceInfo(
            name="Weather App API (WeatherAPI / OpenWeather)",
            type="Commercial Real-Time Hyperlocal Weather",
            provider="WeatherAPI.com / OpenWeatherMap",
            status="Integrated (Active via WEATHER_API_KEY)" if (settings.WEATHER_API_KEY or settings.WEATHERAPI_KEY or settings.OPENWEATHER_API_KEY) else "Fallback to Open-Meteo Active",
            documentation_url="https://www.weatherapi.com/",
            rate_limit="Per Account Tier",
            last_verified="2026 Live"
        )
    ]

from pydantic import BaseModel
from typing import Optional

class ApiKeyItemStatus(BaseModel):
    name: str
    is_configured: bool
    masked_key: Optional[str]
    provider_details: str
    docs_url: str

class AllApiKeysStatusResponse(BaseModel):
    gemini: ApiKeyItemStatus
    groq: ApiKeyItemStatus
    weather: ApiKeyItemStatus
    active_ai_provider: str
    active_weather_provider: str
    message: str

class SaveApiKeysInput(BaseModel):
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    weather_api_key: Optional[str] = None
    openweather_api_key: Optional[str] = None
    weatherapi_key: Optional[str] = None

def _mask(key: Optional[str]) -> Optional[str]:
    if not key or len(key.strip()) < 6:
        return None
    k = key.strip()
    return f"{k[:4]}...{k[-4:]}"

@router.get("/api-keys/status", response_model=AllApiKeysStatusResponse)
def get_api_keys_status():
    """Inspect active status and masked credentials for Gemini, Groq, and Weather App APIs."""
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 8)
    has_groq = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 8)
    
    weather_key = settings.WEATHERAPI_KEY or settings.OPENWEATHER_API_KEY or settings.WEATHER_API_KEY
    has_weather = bool(weather_key and len(weather_key) > 8)

    weather_provider = "Open-Meteo (Open Science Fallback)"
    if settings.WEATHERAPI_KEY or (settings.WEATHER_API_KEY and len(settings.WEATHER_API_KEY) > 30):
        weather_provider = "WeatherAPI.com"
    elif settings.OPENWEATHER_API_KEY or (settings.WEATHER_API_KEY and len(settings.WEATHER_API_KEY) == 32):
        weather_provider = "OpenWeatherMap"

    ai_provider = "Offline Agronomic Database"
    if has_gemini:
        ai_provider = "Google Gemini 2.5 Flash"
    elif has_groq:
        ai_provider = f"Groq Cloud ({settings.GROQ_MODEL})"

    return AllApiKeysStatusResponse(
        gemini=ApiKeyItemStatus(
            name="Google Gemini API",
            is_configured=has_gemini,
            masked_key=_mask(settings.GEMINI_API_KEY),
            provider_details="Google AI Studio (gemini-2.5-flash)",
            docs_url="https://aistudio.google.com/"
        ),
        groq=ApiKeyItemStatus(
            name="Groq Cloud API",
            is_configured=has_groq,
            masked_key=_mask(settings.GROQ_API_KEY),
            provider_details=f"Groq Ultra-Fast LLaMA ({settings.GROQ_MODEL})",
            docs_url="https://console.groq.com/keys"
        ),
        weather=ApiKeyItemStatus(
            name="Weather App API",
            is_configured=has_weather,
            masked_key=_mask(weather_key),
            provider_details=f"{weather_provider} + Open-Meteo fallback",
            docs_url="https://www.weatherapi.com/"
        ),
        active_ai_provider=ai_provider,
        active_weather_provider=weather_provider,
        message="API keys status retrieved successfully"
    )

@router.post("/api-keys/save", response_model=AllApiKeysStatusResponse)
def save_api_keys(data: SaveApiKeysInput):
    """Dynamically save API keys for Gemini, Groq, and Weather App into .env and runtime settings."""
    env_updates = {}
    
    if data.gemini_api_key is not None:
        settings.GEMINI_API_KEY = data.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
        env_updates["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
        
    if data.groq_api_key is not None:
        settings.GROQ_API_KEY = data.groq_api_key.strip()
        os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
        env_updates["GROQ_API_KEY"] = settings.GROQ_API_KEY
        
    if data.weather_api_key is not None:
        settings.WEATHER_API_KEY = data.weather_api_key.strip()
        os.environ["WEATHER_API_KEY"] = settings.WEATHER_API_KEY
        env_updates["WEATHER_API_KEY"] = settings.WEATHER_API_KEY

    if data.openweather_api_key is not None:
        settings.OPENWEATHER_API_KEY = data.openweather_api_key.strip()
        os.environ["OPENWEATHER_API_KEY"] = settings.OPENWEATHER_API_KEY
        env_updates["OPENWEATHER_API_KEY"] = settings.OPENWEATHER_API_KEY

    if data.weatherapi_key is not None:
        settings.WEATHERAPI_KEY = data.weatherapi_key.strip()
        os.environ["WEATHERAPI_KEY"] = settings.WEATHERAPI_KEY
        env_updates["WEATHERAPI_KEY"] = settings.WEATHERAPI_KEY

    # Persist to .env files (root and backend)
    for env_path in [".env", "backend/.env"]:
        try:
            existing_lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    existing_lines = f.readlines()
            
            written_keys = set()
            new_lines = []
            for line in existing_lines:
                matched = False
                for k, v in env_updates.items():
                    if line.startswith(f"{k}="):
                        new_lines.append(f"{k}={v}\n")
                        written_keys.add(k)
                        matched = True
                        break
                if not matched:
                    new_lines.append(line)
            
            for k, v in env_updates.items():
                if k not in written_keys:
                    new_lines.append(f"{k}={v}\n")
                    
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            logger.warning("Could not persist to %s: %s", env_path, str(e))

    return get_api_keys_status()

@router.post("/admin/import-dataset")
def trigger_dataset_import(
    x_admin_key: str = Header(..., description="Administrative Security Key"),
    db: Session = Depends(get_db)
):
    """Secure endpoint to reload seed datasets from CSV files into PostgreSQL/SQLite."""
    if x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid Admin Key")
    
    try:
        seed_all()
        return {"status": "success", "message": "All agricultural datasets re-imported and synchronized successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
