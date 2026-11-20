from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import State, District, Block
from app.schemas.schemas import StateBase, DistrictBase, BlockBase, LocationSearchResult

router = APIRouter()

@router.get("/states", response_model=List[StateBase])
def get_states(db: Session = Depends(get_db)):
    """Fetch all supported Indian states."""
    return db.query(State).order_by(State.name).all()

@router.get("/districts/{state_id}", response_model=List[DistrictBase])
def get_districts_by_state(state_id: int, db: Session = Depends(get_db)):
    """Fetch all districts belonging to a specific state (e.g. state_id=1 for Bihar)."""
    districts = db.query(District).filter(District.state_id == state_id).order_by(District.name).all()
    if not districts:
        raise HTTPException(status_code=404, detail="No districts found for given state_id")
    return districts

@router.get("/locations/search", response_model=List[LocationSearchResult])
def search_locations(q: str = Query(..., min_length=2, description="Search district name"), db: Session = Depends(get_db)):
    """Search districts by partial name query."""
    pattern = f"%{q}%"
    results = db.query(District, State).join(State, District.state_id == State.id).filter(
        District.name.ilike(pattern)
    ).limit(10).all()

    return [
        LocationSearchResult(
            district_id=d.id,
            district_name=d.name,
            state_name=s.name,
            latitude=d.latitude,
            longitude=d.longitude
        )
        for d, s in results
    ]
