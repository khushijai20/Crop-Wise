from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    country_code = Column(String(10), default="IN", nullable=False)

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    administrative_code = Column(String(50), nullable=True)

    state = relationship("State", back_populates="districts")
    blocks = relationship("Block", back_populates="district", cascade="all, delete-orphan")
    soil_records = relationship("SoilData", back_populates="district", cascade="all, delete-orphan")
    weather_records = relationship("WeatherRecord", back_populates="district", cascade="all, delete-orphan")
    crop_calendars = relationship("CropCalendar", back_populates="district", cascade="all, delete-orphan")
    recommendations = relationship("CropRecommendation", back_populates="district", cascade="all, delete-orphan")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    administrative_code = Column(String(50), nullable=True)

    district = relationship("District", back_populates="blocks")


class SoilData(Base):
    __tablename__ = "soil_data"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    soil_type = Column(String(100), nullable=False)
    ph = Column(Float, nullable=False)
    nitrogen = Column(Float, nullable=False)  # in kg/ha
    organic_carbon = Column(Float, nullable=False)  # in %
    clay_percentage = Column(Float, nullable=False)
    sand_percentage = Column(Float, nullable=False)
    silt_percentage = Column(Float, nullable=False)
    source = Column(String(200), nullable=False)
    data_resolution = Column(String(100), default="District-level aggregate")
    verified_at = Column(String(50), nullable=True)

    district = relationship("District", back_populates="soil_records")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    scientific_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Cereals, Pulses, Oilseeds, Vegetables, Cash
    description = Column(Text, nullable=True)

    requirements = relationship("CropRequirement", back_populates="crop", cascade="all, delete-orphan")
    calendars = relationship("CropCalendar", back_populates="crop", cascade="all, delete-orphan")
    recommendations = relationship("CropRecommendation", back_populates="crop", cascade="all, delete-orphan")
    advisories = relationship("AgriculturalAdvisory", back_populates="crop", cascade="all, delete-orphan")


class CropRequirement(Base):
    __tablename__ = "crop_requirements"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    season = Column(String(50), nullable=False, index=True)  # Kharif, Rabi, Zaid, Annual
    ph_min = Column(Float, nullable=False)
    ph_max = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    rainfall_min = Column(Float, nullable=False)
    rainfall_max = Column(Float, nullable=False)
    water_requirement = Column(String(50), nullable=False)  # Low, Medium, High
    duration_days = Column(Integer, nullable=False)
    suitable_soil_types = Column(String(255), nullable=False)

    crop = relationship("Crop", back_populates="requirements")


class CropCalendar(Base):
    __tablename__ = "crop_calendar"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    sowing_start_month = Column(Integer, nullable=False)
    sowing_end_month = Column(Integer, nullable=False)
    harvest_start_month = Column(Integer, nullable=False)
    harvest_end_month = Column(Integer, nullable=False)
    source = Column(String(200), nullable=False)
    variety = Column(String(150), nullable=True)
    verified_at = Column(String(50), nullable=True)

    crop = relationship("Crop", back_populates="calendars")
    district = relationship("District", back_populates="crop_calendars")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    data_type = Column(String(50), default="forecast")
    source = Column(String(100), default="Open-Meteo")

    district = relationship("District", back_populates="weather_records")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="hi")
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recommendations = relationship("CropRecommendation", back_populates="farmer")
    chats = relationship("ChatHistory", back_populates="farmer")


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    season = Column(String(50), nullable=False)
    suitability_score = Column(Float, nullable=False)
    recommendation_reasons = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    district = relationship("District", back_populates="recommendations")
    crop = relationship("Crop", back_populates="recommendations")
    farmer = relationship("Farmer", back_populates="recommendations")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    language = Column(String(10), default="hi")
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="chats")


class AgriculturalAdvisory(Base):
    __tablename__ = "agricultural_advisories"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)
    season = Column(String(50), nullable=False)
    stage = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    advisory_en = Column(Text, nullable=False)
    advisory_hi = Column(Text, nullable=False)
    symptoms = Column(Text, nullable=True)
    management = Column(Text, nullable=True)
    source = Column(String(200), nullable=False)

    crop = relationship("Crop", back_populates="advisories")
