from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Crop, CropCalendar
from app.schemas.schemas import CalendarRequest, CalendarResponse
from app.services.crop_calendar_service import CropCalendarService

router = APIRouter()

@router.post("/calendar", response_model=CalendarResponse)
def calculate_crop_calendar(request: CalendarRequest, db: Session = Depends(get_db)):
    """Calculate projected phenological growth stages, irrigation milestones, and estimated harvest date window."""
    try:
        return CropCalendarService.calculate_calendar(request, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar calculation error: {str(e)}")

@router.get("/calendar/{crop_id}")
def get_crop_calendar_details(crop_id: int, db: Session = Depends(get_db)):
    """Retrieve seasonal sowing and harvesting months for a specific crop."""
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    calendars = db.query(CropCalendar).filter(CropCalendar.crop_id == crop_id).all()
    return {
        "crop_id": crop.id,
        "crop_name": crop.name,
        "calendars": [
            {
                "district_id": c.district_id,
                "sowing_start_month": c.sowing_start_month,
                "sowing_end_month": c.sowing_end_month,
                "harvest_start_month": c.harvest_start_month,
                "harvest_end_month": c.harvest_end_month,
                "variety": c.variety,
                "source": c.source
            }
            for c in calendars
        ]
    }
