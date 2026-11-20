import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Kisan"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_kisan.db")
    
    # External AI APIs (Gemini & Groq)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # "gemini", "groq", "auto"

    # External Weather App APIs
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    WEATHERAPI_KEY: str = os.getenv("WEATHERAPI_KEY", "")
    WEATHER_PROVIDER: str = os.getenv("WEATHER_PROVIDER", "auto") # "open_meteo", "weatherapi", "openweather", "auto"

    # Weather & Government APIs
    IMD_API_KEY: str = os.getenv("IMD_API_KEY", "")
    IMD_API_BASE_URL: str = os.getenv("IMD_API_BASE_URL", "https://api.imd.gov.in/public")
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    OPEN_METEO_ARCHIVE_URL: str = os.getenv("OPEN_METEO_ARCHIVE_URL", "https://archive-api.open-meteo.com/v1")
    SOILGRIDS_BASE_URL: str = os.getenv("SOILGRIDS_BASE_URL", "https://rest.isric.org/soilgrids/v2.0")
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    # Admin Key
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "smartkisan_admin_secret_2026")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        uri = self.DATABASE_URL
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        return uri

settings = Settings()
