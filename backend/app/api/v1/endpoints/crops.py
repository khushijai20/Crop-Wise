from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Crop, CropRequirement
from app.schemas.schemas import CropBase

router = APIRouter()

@router.get("/crops", response_model=List[CropBase])
def get_all_crops(db: Session = Depends(get_db)):
    """Retrieve catalog of agricultural crops across Cereals, Pulses, Oilseeds, Vegetables, and Cash crops."""
    return db.query(Crop).all()

@router.get("/crops/{crop_id}", response_model=CropBase)
def get_crop_by_id(crop_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed requirements and description for a specific crop."""
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop

@router.get("/crops/season/{season}", response_model=List[CropBase])
def get_crops_by_season(season: str, db: Session = Depends(get_db)):
    """Retrieve crops suitable for a specific agricultural season (Kharif, Rabi, Zaid, Annual)."""
    crops = db.query(Crop).join(CropRequirement).filter(
        CropRequirement.season.ilike(f"%{season}%")
    ).all()
    return crops
