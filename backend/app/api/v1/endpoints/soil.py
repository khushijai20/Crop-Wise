from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import District
from app.schemas.schemas import SoilDataBase, SoilTestReportInput
from app.services.soil_service import SoilService

router = APIRouter()

@router.get("/soil/{district_id}", response_model=SoilDataBase)
async def get_district_soil(district_id: int, db: Session = Depends(get_db)):
    """Retrieve district soil properties (pH, N, Organic Carbon, Texture) with provenance tracking."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return await SoilService.get_district_soil(district.id, db)

@router.post("/soil/test-report", response_model=SoilDataBase)
def submit_soil_test_report(report: SoilTestReportInput, db: Session = Depends(get_db)):
    """Submit farmer's custom field soil test results from a physical Soil Health Card."""
    district = db.query(District).filter(District.id == report.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return SoilService.process_user_test_report(report)
