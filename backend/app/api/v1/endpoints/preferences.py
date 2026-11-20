from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.models.models import Farmer, District

router = APIRouter()

SUPPORTED_LANGUAGES = [
    {
        "code": "hi",
        "name": "हिंदी",
        "english_name": "Hindi",
        "region": "बिहार की मुख्य भाषा",
        "is_default": True
    },
    {
        "code": "en",
        "name": "English",
        "english_name": "English",
        "region": "Standard AgriTech English",
        "is_default": False
    },
    {
        "code": "bho",
        "name": "भोजपुरी",
        "english_name": "Bhojpuri",
        "region": "शाहाबाद, सारण एवं चंपारण क्षेत्र",
        "is_default": False
    },
    {
        "code": "mai",
        "name": "मैथिली",
        "english_name": "Maithili",
        "region": "मिथिलांचल एवं कोसी क्षेत्र",
        "is_default": False
    }
]

class FarmerPreferenceInput(BaseModel):
    farmer_id: Optional[int] = None
    name: Optional[str] = "Kisan"
    preferred_language: str = Field(default="hi", description="Language code: hi, en, bho, mai")
    district_id: Optional[int] = 26

class FarmerPreferenceResponse(BaseModel):
    farmer_id: Optional[int] = None
    preferred_language: str
    district_id: Optional[int] = None
    supported_languages: List[Dict[str, str | bool]]
    message: str

@router.get("/farmer/preferences", response_model=FarmerPreferenceResponse)
def get_preferences(farmer_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieve farmer preferences and directory of supported Bihar languages."""
    pref_lang = "hi"
    dist_id = 26
    if farmer_id:
        f = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if f:
            pref_lang = f.preferred_language or "hi"
            dist_id = f.district_id or 26

    return FarmerPreferenceResponse(
        farmer_id=farmer_id,
        preferred_language=pref_lang,
        district_id=dist_id,
        supported_languages=SUPPORTED_LANGUAGES,
        message="Preferences retrieved successfully"
    )

@router.post("/farmer/preferences", response_model=FarmerPreferenceResponse)
def update_preferences(data: FarmerPreferenceInput, db: Session = Depends(get_db)):
    """Save or update farmer language and district preference."""
    valid_codes = [l["code"] for l in SUPPORTED_LANGUAGES]
    if data.preferred_language not in valid_codes:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language code '{data.preferred_language}'. Must be one of: {', '.join(valid_codes)}"
        )

    farmer = None
    if data.farmer_id:
        farmer = db.query(Farmer).filter(Farmer.id == data.farmer_id).first()

    if not farmer:
        farmer = Farmer(
            name=data.name or "Kisan",
            preferred_language=data.preferred_language,
            district_id=data.district_id or 26
        )
        db.add(farmer)
    else:
        farmer.preferred_language = data.preferred_language
        if data.district_id:
            farmer.district_id = data.district_id

    db.commit()
    db.refresh(farmer)

    return FarmerPreferenceResponse(
        farmer_id=farmer.id,
        preferred_language=farmer.preferred_language,
        district_id=farmer.district_id,
        supported_languages=SUPPORTED_LANGUAGES,
        message="Language preference saved successfully"
    )
