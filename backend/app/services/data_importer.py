import os
import csv
import logging
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.models.models import (
    State, District, Block, SoilData, Crop,
    CropRequirement, CropCalendar, WeatherRecord, AgriculturalAdvisory
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEEDS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "seeds")

def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

def seed_states(db: Session):
    path = os.path.join(SEEDS_DIR, "states.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            state_id = int(row["id"])
            existing = db.query(State).filter(State.id == state_id).first()
            if not existing:
                db.add(State(
                    id=state_id,
                    name=row["name"],
                    country_code=row.get("country_code", "IN")
                ))
    db.commit()
    logger.info("States seeded successfully.")

def seed_districts(db: Session):
    path = os.path.join(SEEDS_DIR, "districts.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dist_id = int(row["id"])
            existing = db.query(District).filter(District.id == dist_id).first()
            if not existing:
                db.add(District(
                    id=dist_id,
                    state_id=int(row["state_id"]),
                    name=row["name"],
                    latitude=float(row["latitude"]),
                    longitude=float(row["longitude"]),
                    administrative_code=row.get("administrative_code")
                ))
    db.commit()
    logger.info("Districts seeded successfully.")

def seed_crops(db: Session):
    path = os.path.join(SEEDS_DIR, "crops.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            crop_id = int(row["id"])
            existing = db.query(Crop).filter(Crop.id == crop_id).first()
            if not existing:
                db.add(Crop(
                    id=crop_id,
                    name=row["name"],
                    scientific_name=row["scientific_name"],
                    category=row["category"],
                    description=row.get("description", "")
                ))
    db.commit()
    logger.info("Crops seeded successfully.")

def seed_crop_requirements(db: Session):
    path = os.path.join(SEEDS_DIR, "crop_requirements.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            req_id = int(row["id"])
            existing = db.query(CropRequirement).filter(CropRequirement.id == req_id).first()
            if not existing:
                db.add(CropRequirement(
                    id=req_id,
                    crop_id=int(row["crop_id"]),
                    season=row["season"],
                    ph_min=float(row["ph_min"]),
                    ph_max=float(row["ph_max"]),
                    temperature_min=float(row["temperature_min"]),
                    temperature_max=float(row["temperature_max"]),
                    rainfall_min=float(row["rainfall_min"]),
                    rainfall_max=float(row["rainfall_max"]),
                    water_requirement=row["water_requirement"],
                    duration_days=int(row["duration_days"]),
                    suitable_soil_types=row["suitable_soil_types"]
                ))
    db.commit()
    logger.info("Crop requirements seeded successfully.")

def seed_crop_calendar(db: Session):
    path = os.path.join(SEEDS_DIR, "crop_calendar.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cal_id = int(row["id"])
            existing = db.query(CropCalendar).filter(CropCalendar.id == cal_id).first()
            if not existing:
                db.add(CropCalendar(
                    id=cal_id,
                    crop_id=int(row["crop_id"]),
                    district_id=int(row["district_id"]),
                    sowing_start_month=int(row["sowing_start_month"]),
                    sowing_end_month=int(row["sowing_end_month"]),
                    harvest_start_month=int(row["harvest_start_month"]),
                    harvest_end_month=int(row["harvest_end_month"]),
                    source=row["source"],
                    variety=row.get("variety"),
                    verified_at=row.get("verified_at")
                ))
    db.commit()
    logger.info("Crop calendar seeded successfully.")

def seed_soil_data(db: Session):
    path = os.path.join(SEEDS_DIR, "soil_data.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            soil_id = int(row["id"])
            existing = db.query(SoilData).filter(SoilData.id == soil_id).first()
            if not existing:
                db.add(SoilData(
                    id=soil_id,
                    district_id=int(row["district_id"]),
                    soil_type=row["soil_type"],
                    ph=float(row["ph"]),
                    nitrogen=float(row["nitrogen"]),
                    organic_carbon=float(row["organic_carbon"]),
                    clay_percentage=float(row["clay_percentage"]),
                    sand_percentage=float(row["sand_percentage"]),
                    silt_percentage=float(row["silt_percentage"]),
                    source=row["source"],
                    data_resolution=row.get("data_resolution", "District-level aggregate"),
                    verified_at=row.get("verified_at")
                ))
    db.commit()
    logger.info("Soil data seeded successfully.")

def seed_advisories(db: Session):
    path = os.path.join(SEEDS_DIR, "agricultural_advisories.csv")
    if not os.path.exists(path):
        return
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            adv_id = int(row["id"])
            existing = db.query(AgriculturalAdvisory).filter(AgriculturalAdvisory.id == adv_id).first()
            if not existing:
                db.add(AgriculturalAdvisory(
                    id=adv_id,
                    crop_id=int(row["crop_id"]) if row.get("crop_id") else None,
                    season=row["season"],
                    stage=row["stage"],
                    title=row["title"],
                    advisory_en=row["advisory_en"],
                    advisory_hi=row["advisory_hi"],
                    symptoms=row.get("symptoms"),
                    management=row.get("management"),
                    source=row["source"]
                ))
    db.commit()
    logger.info("Advisories seeded successfully.")

def seed_all():
    init_db()
    db = SessionLocal()
    try:
        seed_states(db)
        seed_districts(db)
        seed_crops(db)
        seed_crop_requirements(db)
        seed_crop_calendar(db)
        seed_soil_data(db)
        seed_advisories(db)
        logger.info("All agricultural seed datasets imported successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
