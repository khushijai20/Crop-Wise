from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import District
from app.schemas.schemas import WeatherForecastResponse, WeatherHistoryResponse
from app.services.weather_service import WeatherService

router = APIRouter()

@router.get("/weather/{district_id}", response_model=WeatherForecastResponse)
async def get_weather(district_id: int, db: Session = Depends(get_db)):
    """Retrieve current weather and 7-day forecast for selected district."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return await WeatherService.get_district_weather(
        district.id, district.name, district.latitude, district.longitude
    )

@router.get("/weather/{district_id}/forecast", response_model=WeatherForecastResponse)
async def get_forecast(district_id: int, db: Session = Depends(get_db)):
    """Retrieve extended daily forecast for selected district."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return await WeatherService.get_district_weather(
        district.id, district.name, district.latitude, district.longitude
    )

@router.get("/weather/{district_id}/history", response_model=WeatherHistoryResponse)
async def get_weather_history(district_id: int, db: Session = Depends(get_db)):
    """Retrieve historical climate and precipitation trends for selected district."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return await WeatherService.get_weather_history(
        district.id, district.name, district.latitude, district.longitude
    )
