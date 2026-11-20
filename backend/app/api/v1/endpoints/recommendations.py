from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import CropRecommendation, District
from app.schemas.schemas import RecommendationRequest, RecommendationResponse
from app.services.recommendation_engine import CropRecommendationEngine

router = APIRouter()

@router.post("/recommendations", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Generate explainable top 5 crop recommendations based on:
    - 30% Soil compatibility
    - 25% Climate compatibility
    - 20% Seasonal suitability
    - 15% Water availability
    - 10% Crop growing duration
    """
    try:
        return await CropRecommendationEngine.evaluate_crops(request, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation evaluation error: {str(e)}")

@router.get("/recommendations/{recommendation_id}")
def get_recommendation_by_id(recommendation_id: int, db: Session = Depends(get_db)):
    """Retrieve previously saved recommendation record."""
    rec = db.query(CropRecommendation).filter(CropRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation record not found")
    return {
        "id": rec.id,
        "district_id": rec.district_id,
        "crop_id": rec.crop_id,
        "season": rec.season,
        "suitability_score": rec.suitability_score,
        "recommendation_reasons": rec.recommendation_reasons,
        "generated_at": rec.generated_at
    }
