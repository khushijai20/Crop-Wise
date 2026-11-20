import datetime
import logging
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from app.models.models import Crop, CropRequirement, CropCalendar, District
from app.schemas.schemas import (
    RecommendationRequest, RecommendationResponse, RecommendationItem,
    CropScoreBreakdown, SoilDataBase, WeatherForecastResponse
)
from app.services.weather_service import WeatherService
from app.services.soil_service import SoilService

logger = logging.getLogger(__name__)

# Hindi name translations for crops
CROP_NAMES_HI = {
    "Rice (Paddy)": "धान (चावल)",
    "Wheat": "गेहूं",
    "Maize": "मक्का",
    "Chickpea (Gram)": "चना",
    "Lentil (Masoor)": "मसूर",
    "Arhar (Pigeon Pea)": "अरहर (तूर)",
    "Moong (Green Gram)": "मूंग",
    "Urad (Black Gram)": "उड़द",
    "Mustard": "सरसों / राई",
    "Rapeseed (Toria)": "तोरी / लाही",
    "Groundnut": "मूंगफली",
    "Sugarcane": "गन्ना",
    "Potato": "आलू",
    "Onion": "प्याज़",
    "Tomato": "टमाटर",
    "Brinjal (Eggplant)": "बैंगन",
    "Cauliflower": "फूलगोभी",
    "Cabbage": "पत्तागोभी",
    "Okra (Bhindi)": "भिंडी"
}

# Seasonal mapping based on calendar month
def detect_current_season() -> str:
    month = datetime.date.today().month
    if month in [6, 7, 8, 9, 10]:
        return "Kharif"
    elif month in [11, 12, 1, 2]:
        return "Rabi"
    else:
        return "Zaid"

class CropRecommendationEngine:
    @classmethod
    async def evaluate_crops(
        cls, request: RecommendationRequest, db: Session
    ) -> RecommendationResponse:
        district = db.query(District).filter(District.id == request.district_id).first()
        if not district:
            raise ValueError(f"District ID {request.district_id} not found")

        # Determine target season
        target_season = request.season if request.season else detect_current_season()

        # Retrieve Soil Data
        if request.soil_test_values:
            soil_info = SoilService.process_user_test_report(request.soil_test_values)
            soil_source_used = "Farmer Soil Health Card (Manual Test)"
        else:
            soil_info = await SoilService.get_district_soil(district.id, db)
            soil_source_used = soil_info.source

        # Retrieve Weather Data
        weather_info = await WeatherService.get_district_weather(
            district.id, district.name, district.latitude, district.longitude
        )
        weather_source_used = weather_info.current.data_source

        # Fetch all crops with requirements
        crops = db.query(Crop).all()
        scored_items: List[RecommendationItem] = []

        curr_temp = weather_info.current.temperature
        soil_ph = soil_info.ph
        water_input = (request.water_availability or "Moderate").capitalize()

        for crop in crops:
            # Find best matching requirement for this season (or Annual)
            req = next(
                (r for r in crop.requirements if r.season.lower() == target_season.lower() or r.season.lower() == "annual"),
                None
            )
            # If no requirement for this season, take the first requirement available
            if not req and crop.requirements:
                req = crop.requirements[0]
            if not req:
                continue

            # 1. Soil Compatibility Score (30%)
            soil_score, soil_reasons, soil_risks = cls._calc_soil_score(soil_info, req)

            # 2. Climate Compatibility Score (25%)
            climate_score, climate_reasons, climate_risks = cls._calc_climate_score(curr_temp, req)

            # 3. Season Compatibility Score (20%)
            season_score, season_reasons, season_risks = cls._calc_season_score(target_season, req)

            # 4. Water Availability Score (15%)
            water_score, water_reasons, water_risks = cls._calc_water_score(water_input, req)

            # 5. Duration Suitability Score (10%)
            duration_score, duration_reasons, duration_risks = cls._calc_duration_score(req)

            # Weighted Formula:
            # Final = (Soil * 0.30) + (Climate * 0.25) + (Season * 0.20) + (Water * 0.15) + (Duration * 0.10)
            final_score = (
                (soil_score * 0.30) +
                (climate_score * 0.25) +
                (season_score * 0.20) +
                (water_score * 0.15) +
                (duration_score * 0.10)
            )
            final_score = round(max(10.0, min(99.0, final_score)), 1)

            # Classify Suitability
            if final_score >= 80.0:
                cat_en = "Highly suitable"
                cat_hi = "अत्यधिक उपयुक्त"
            elif final_score >= 60.0:
                cat_en = "Potentially suitable"
                cat_hi = "मध्यम उपयुक्त"
            else:
                cat_en = "Less suitable"
                cat_hi = "कम उपयुक्त"

            # Variety & Calendar lookup
            cal = db.query(CropCalendar).filter(
                CropCalendar.crop_id == crop.id,
                CropCalendar.district_id == district.id
            ).first()
            if not cal:
                cal = db.query(CropCalendar).filter(CropCalendar.crop_id == crop.id).first()

            sowing_window, sowing_window_hi = cls._format_window(
                cal.sowing_start_month if cal else 6, cal.sowing_end_month if cal else 7
            )
            harvest_window, harvest_window_hi = cls._format_window(
                cal.harvest_start_month if cal else 10, cal.harvest_end_month if cal else 11
            )
            variety = cal.variety if cal else "Local / KVK Recommended"

            # Combine explanations
            all_reasons_en = soil_reasons + climate_reasons + season_reasons
            all_risks_en = soil_risks + climate_risks + water_risks

            # Hindi translations for explanations
            reasons_hi = [cls._translate_reason_to_hi(r) for r in all_reasons_en]
            risks_hi = [cls._translate_risk_to_hi(r) for r in all_risks_en]

            breakdown = CropScoreBreakdown(
                soil_score=round(soil_score, 1),
                climate_score=round(climate_score, 1),
                season_score=round(season_score, 1),
                water_score=round(water_score, 1),
                duration_score=round(duration_score, 1)
            )

            scored_items.append(
                RecommendationItem(
                    crop_id=crop.id,
                    crop_name=crop.name,
                    crop_name_hi=CROP_NAMES_HI.get(crop.name, crop.name),
                    scientific_name=crop.scientific_name,
                    category=crop.category,
                    suitability_score=final_score,
                    suitability_category=cat_en,
                    suitability_category_hi=cat_hi,
                    breakdown=breakdown,
                    why_recommended=all_reasons_en,
                    why_recommended_hi=reasons_hi,
                    important_risks=all_risks_en if all_risks_en else ["No immediate environmental stress detected under normal irrigation."],
                    important_risks_hi=risks_hi if risks_hi else ["सामान्य सिंचाई परिस्थितियों में कोई गंभीर पर्यावरणीय तनाव नहीं।"],
                    water_requirement=req.water_requirement,
                    expected_duration_days=req.duration_days,
                    sowing_period=sowing_window,
                    sowing_period_hi=sowing_window_hi,
                    harvest_period=harvest_window,
                    harvest_period_hi=harvest_window_hi,
                    recommended_variety=variety,
                    data_source="ICAR / BAU Sabour Agronomic Model",
                    confidence="High" if not weather_info.warning else "Estimated Regional"
                )
            )

        # Sort descending by score and pick top 5
        scored_items.sort(key=lambda x: x.suitability_score, reverse=True)
        top_5 = scored_items[:5]

        disclaimer_en = (
            "Suitability scores are decision-support estimates based on district-level agro-climatic "
            "baselines and open weather forecasts. Farm-specific topography, microclimates, and soil "
            "variability should be validated with local KVK agronomists."
        )
        disclaimer_hi = (
            "उपयुक्तता स्कोर जिला-स्तरीय कृषि-जलवायु आधार और मौसम पूर्वानुमान पर आधारित अनुमान हैं। "
            "व्यक्तिगत खेत की स्थिति और मिट्टी की जांच के लिए अपने निकटतम कृषि विज्ञान केंद्र (KVK) से परामर्श लें।"
        )

        return RecommendationResponse(
            district_id=district.id,
            district_name=district.name,
            season_evaluated=target_season,
            soil_source_used=soil_source_used,
            weather_source_used=weather_source_used,
            recommendations=top_5,
            disclaimer=disclaimer_en,
            disclaimer_hi=disclaimer_hi
        )

    @classmethod
    def _calc_soil_score(cls, soil: SoilDataBase, req: CropRequirement) -> Tuple[float, List[str], List[str]]:
        reasons = []
        risks = []
        score = 85.0

        # pH evaluation
        if req.ph_min <= soil.ph <= req.ph_max:
            score += 10.0
            reasons.append(f"Soil pH {soil.ph} is in optimal range ({req.ph_min} - {req.ph_max}).")
        elif abs(soil.ph - req.ph_min) <= 0.6 or abs(soil.ph - req.ph_max) <= 0.6:
            score -= 15.0
            risks.append(f"Soil pH {soil.ph} is slightly borderline for optimal growth ({req.ph_min} - {req.ph_max}).")
        else:
            # Hard constraint penalty
            score -= 40.0
            risks.append(f"Soil pH {soil.ph} is outside required threshold ({req.ph_min} - {req.ph_max}). Amendment recommended.")

        # Nitrogen evaluation
        if soil.nitrogen >= 220.0:
            score += 5.0
            reasons.append(f"Available soil nitrogen ({soil.nitrogen} kg/ha) supports active tillering/vegetation.")
        else:
            score -= 5.0
            risks.append(f"Low available nitrogen ({soil.nitrogen} kg/ha); supplementary biofertilizer/urea split recommended.")

        return max(10.0, min(100.0, score)), reasons, risks

    @classmethod
    def _calc_climate_score(cls, temp: float, req: CropRequirement) -> Tuple[float, List[str], List[str]]:
        reasons = []
        risks = []
        score = 85.0

        if req.temperature_min <= temp <= req.temperature_max:
            score += 15.0
            reasons.append(f"Current temperature {temp}°C aligns with growth requirement ({req.temperature_min}°C - {req.temperature_max}°C).")
        elif abs(temp - req.temperature_min) <= 4.0 or abs(temp - req.temperature_max) <= 4.0:
            score -= 20.0
            risks.append(f"Temperature {temp}°C is near thermal boundary ({req.temperature_min}°C - {req.temperature_max}°C).")
        else:
            score -= 45.0
            risks.append(f"Thermal stress alert: {temp}°C deviates significantly from normal ({req.temperature_min}°C - {req.temperature_max}°C).")

        return max(10.0, min(100.0, score)), reasons, risks

    @classmethod
    def _calc_season_score(cls, current_season: str, req: CropRequirement) -> Tuple[float, List[str], List[str]]:
        reasons = []
        risks = []
        if req.season.lower() == current_season.lower() or req.season.lower() == "annual":
            score = 95.0
            reasons.append(f"Natural fit for current {current_season} agricultural calendar.")
        else:
            # Out of season crop
            score = 30.0
            risks.append(f"Crop is traditionally grown in {req.season}, out of phase with current {current_season} season.")
        return score, reasons, risks

    @classmethod
    def _calc_water_score(cls, water_avail: str, req: CropRequirement) -> Tuple[float, List[str], List[str]]:
        reasons = []
        risks = []
        req_w = req.water_requirement.lower()
        avail_w = water_avail.lower()

        if req_w == "high" and avail_w in ["high"]:
            score = 95.0
            reasons.append("Sufficient irrigation source available for high-water crop.")
        elif req_w == "high" and avail_w in ["moderate"]:
            score = 65.0
            risks.append("High water demanding crop; assured tube-well/canal irrigation is vital.")
        elif req_w == "high" and avail_w in ["low", "rainfed"]:
            score = 30.0
            risks.append("Severe drought/water-stress risk without supplemental irrigation.")
        elif req_w in ["low", "medium"] and avail_w in ["moderate", "high"]:
            score = 90.0
            reasons.append(f"Moderate/Low water requirement ({req.water_requirement}) fits irrigation setup well.")
        else:
            score = 75.0
        return score, reasons, risks

    @classmethod
    def _calc_duration_score(cls, req: CropRequirement) -> Tuple[float, List[str], List[str]]:
        reasons = []
        risks = []
        score = 85.0
        if req.duration_days <= 100:
            score += 10.0
            reasons.append(f"Short crop duration ({req.duration_days} days) facilitates fast field turnover.")
        elif req.duration_days >= 160:
            score -= 10.0
            risks.append(f"Long growing duration ({req.duration_days} days) occupies land for multiple quarters.")
        return score, reasons, risks

    @staticmethod
    def _format_window(start_m: int, end_m: int) -> Tuple[str, str]:
        months_en = ["", "January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"]
        months_hi = ["", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
                     "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]
        en_str = f"{months_en[start_m]} - {months_en[end_m]}"
        hi_str = f"{months_hi[start_m]} - {months_hi[end_m]}"
        return en_str, hi_str

    @staticmethod
    def _translate_reason_to_hi(text: str) -> str:
        if "Soil pH" in text:
            return "मिट्टी का पीएच स्तर फसल के विकास के लिए अनुकूल है।"
        if "nitrogen" in text:
            return "मिट्टी में उपलब्ध नाइट्रोजन वनस्पति विकास के अनुकूल है।"
        if "temperature" in text:
            return "वर्तमान तापमान फसल की सामान्य वृद्धि सीमा में है।"
        if "Natural fit" in text:
            return "यह फसल वर्तमान मौसमी कृषि चक्र के पूर्णतः अनुकूल है।"
        if "Short crop duration" in text:
            return "कम अवधि की फसल होने से खेत जल्दी खाली हो जाता है।"
        if "water requirement" in text:
            return "फसल की पानी की आवश्यकता उपलब्ध सिंचाई व्यवस्था के अनुकूल है।"
        return text

    @staticmethod
    def _translate_risk_to_hi(text: str) -> str:
        if "borderline" in text or "Soil pH" in text:
            return "मिट्टी का पीएच थोड़ा असंतुलित है; जिप्सम या चूने के संतुलित उपयोग पर विचार करें।"
        if "nitrogen" in text:
            return "उपलब्ध नाइट्रोजन कम है; यूरिया या जैव उर्वरकों की संतुलित खुराक आवश्यक है।"
        if "thermal boundary" in text or "Thermal stress" in text:
            return "तापमान में उतार-चढ़ाव से विकास पर प्रभाव पड़ सकता है।"
        if "traditionally grown in" in text:
            return "यह फसल किसी अन्य मौसम की है; वर्तमान मौसम में बुवाई से पैदावार प्रभावित हो सकती है।"
        if "water-stress" in text or "High water demanding" in text:
            return "फसल को अधिक पानी की आवश्यकता है; सुनिश्चित सिंचाई साधन आवश्यक हैं।"
        return text
