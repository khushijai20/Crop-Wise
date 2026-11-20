import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, SessionLocal, Base
from app.models.models import State
from app.services.data_importer import seed_all
from app.api.v1.endpoints import (
    locations, weather, soil, crops,
    recommendations, calendar, assistant, admin, preferences
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and database has seed data on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        states_count = db.query(State).count()
        if states_count == 0:
            seed_all()
    finally:
        db.close()
    yield

app = FastAPI(
    title="Smart Kisan Bihar 🌱",
    description="AI-Powered Smart Agriculture & Crop Recommendation Platform dedicated for Bihar Farmers (All 38 Districts)",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(locations.router, prefix=settings.API_V1_STR, tags=["Locations (Bihar)"])
app.include_router(weather.router, prefix=settings.API_V1_STR, tags=["Weather"])
app.include_router(soil.router, prefix=settings.API_V1_STR, tags=["Soil Health"])
app.include_router(crops.router, prefix=settings.API_V1_STR, tags=["Crops"])
app.include_router(recommendations.router, prefix=settings.API_V1_STR, tags=["Crop Recommendations"])
app.include_router(calendar.router, prefix=settings.API_V1_STR, tags=["Crop Calendar & Harvest Estimation"])
app.include_router(assistant.router, prefix=settings.API_V1_STR, tags=["AI Farming Assistant"])
app.include_router(preferences.router, prefix=settings.API_V1_STR, tags=["Farmer Language Preferences"])
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["Admin & Provenance"])

@app.get("/")
def root():
    return {
        "project": "Smart Kisan Bihar 🌱",
        "tagline": "Right Crop. Right Season. Better Farming.",
        "status": "active",
        "version": "2.0.0",
        "docs": "/docs",
        "coverage": "Bihar (Exclusively All 38 Districts)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
