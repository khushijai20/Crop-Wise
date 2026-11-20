import datetime
import logging
from typing import List
from sqlalchemy.orm import Session
from app.models.models import Crop, CropRequirement, CropCalendar, District
from app.schemas.schemas import CalendarRequest, CalendarResponse, PhenologicalStage

logger = logging.getLogger(__name__)

# Specialized phenological stage breakdown presets based on ICAR package of practices
STAGE_TEMPLATES = {
    "Cereals": [
        ("Germination & Seedling", "अंकुरण एवं प्रारंभिक अवस्था", 0, 0.12,
         "Seed emergence and initial root establishment.",
         "बीज अंकुरण एवं प्रारंभिक जड़ों का विकास।",
         "Maintain optimal moist seedbed; avoid flooding.",
         "खेत में पर्याप्त नमी रखें; जलभराव से बचें।",
         ["Seed treatment with Trichoderma", "Gap filling if required"],
         ["ट्राइकोडर्मा से बीजोपचार", "आवश्यकता पड़ने पर खाली स्थानों पर रोपाई"]),
        ("Vegetative & Tillering", "वानस्पतिक एवं कल्ले फूटने की अवस्था", 0.12, 0.45,
         "Rapid vegetative growth, leaf production, and active tiller formation.",
         "तेज वानस्पतिक विकास और कल्ले फूटने का मुख्य समय।",
         "Critical irrigation stage (e.g. CRI in wheat at 20-25 days).",
         "अति संवेदनशील सिंचाई अवस्था (जैसे गेहूं में 21 दिन पर सीआरआई)।",
         ["First split application of Nitrogen", "Manual weeding or hoeing"],
         ["नाइट्रोजन की पहली टॉप-ड्रेसिंग", "खुरपी से निराई-गुड़ाई"]),
        ("Flowering & Grain Filling", "फूल एवं दाना भराव अवस्था", 0.45, 0.80,
         "Panicle emergence, flowering, pollination, and milk-to-dough grain formation.",
         "बाली निकलना, परागण और दानों में दूध व गूदा भराव।",
         "Crucial moisture required; moisture stress causes unfilled grains.",
         "पर्याप्त नमी अत्यंत आवश्यक; सूखा रहने पर दाने सिकुड़ जाते हैं।",
         ["Monitor for earhead pests or aphids", "Foliar potassium spray if advised"],
         ["माहू या बालियों के कीटों की निगरानी", "पोटेशियम का पर्णीय छिड़काव"]),
        ("Maturity & Harvesting", "परिपक्वता एवं कटाई अवस्था", 0.80, 1.0,
         "Grains harden, foliage yellows, moisture content drops to 14-16%.",
         "दाने सख्त होते हैं, पत्तियां पीली पड़ती हैं और नमी 14-16% पर आती है।",
         "Stop irrigation 10-14 days prior to expected harvest.",
         "कटाई से 10-14 दिन पूर्व सिंचाई पूरी तरह बंद कर दें।",
         ["Harvesting in dry sunny conditions", "Threshing and sun-drying to 12% moisture"],
         ["धूप वाले मौसम में कटाई", "गहाई और 12% नमी तक सुखाना"])
    ],
    "Pulses": [
        ("Germination & Early Emergence", "अंकुरण एवं प्रारंभिक बढ़वार", 0, 0.15,
         "Emergence of seedlings and establishment of nitrogen-fixing root nodules.",
         "पौधों का अंकुरण और जड़ों में राइजोबियम ग्रंथियों का निर्माण।",
         "Light moisture only; pulse crops are highly vulnerable to waterlogging.",
         "केवल हल्की नमी; दलहन में जलभराव अत्यंत हानिकारक है।",
         ["Rhizobium and PSB seed inoculation", "Check seedling vigor"],
         ["राइजोबियम एवं पीएसबी संवर्धन", "पौधों के स्वास्थ्य की जांच"]),
        ("Vegetative & Branching", "वानस्पतिक एवं शाखा विस्तार", 0.15, 0.45,
         "Branch development and canopy coverage.",
         "शाखाओं का फैलाव और पत्तियों का विकास।",
         "Irrigate only if severe soil cracks appear.",
         "मिट्टी में दरारें दिखने पर ही बहुत हल्की सिंचाई करें।",
         ["Weeding at 25-30 days", "Install bird perches for natural pest control"],
         ["25-30 दिन पर निराई", "पक्षी मचान (T-perches) लगाएं"]),
        ("Flowering & Pod Formation", "फूल एवं फली निर्माण अवस्था", 0.45, 0.80,
         "Profuse flower bud opening and pod elongation.",
         "फूलों का खिलना और फलियों का तेजी से बनना।",
         "One critical light irrigation at pod initiation if winter rains fail.",
         "शीतकालीन वर्षा न होने पर फली बनते समय एक हल्की सिंचाई।",
         ["Monitor for pod borer (Helicoverpa)", "Spray bio-agent HaNPV if larvae seen"],
         ["फली छेदक सुंडी पर निगरानी", "आवश्यकतानुसार जैव कीटनाशक का उपयोग"]),
        ("Pod Maturity & Harvest", "फली परिपक्वता एवं कटाई", 0.80, 1.0,
         "Pods turn brownish yellow and seeds rattle inside.",
         "फलियां भूरी-पीली हो जाती हैं और हिलाने पर बीज बजने लगते हैं।",
         "No irrigation.",
         "सिंचाई की आवश्यकता नहीं।",
         ["Timely picking/harvesting before pod shattering", "Threshing and grading"],
         ["फलियां चटकने से पूर्व कटाई", "थ्रेशिंग व भंडारण"])
    ],
    "Default": [
        ("Germination & Early Growth", "अंकुरण एवं प्रारंभिक विकास", 0, 0.15,
         "Seedling emergence and initial rooting.",
         "बीज अंकुरण और जड़ विकास।",
         "Keep seedbed moist.",
         "खेत में हल्की नमी रखें।",
         ["Sowing at recommended spacing"],
         ["उचित दूरी पर बुवाई"]),
        ("Vegetative Growth", "वानस्पतिक बढ़वार", 0.15, 0.50,
         "Stems and foliage expansion.",
         "तने और पत्तियों का विकास।",
         "Regular balanced irrigation.",
         "संतुलित अंतराल पर सिंचाई।",
         ["Weeding and balanced fertilization"],
         ["निराई-गुड़ाई एवं खाद"]),
        ("Reproductive Phase", "प्रजनन / पुष्पन अवस्था", 0.50, 0.80,
         "Flowering, fruiting, or bulking phase.",
         "फूल, फल या कंद बनने की मुख्य अवस्था।",
         "Critical irrigation phase.",
         "सिंचाई की सबसे महत्वपूर्ण अवस्था।",
         ["Pest vigil and disease scouting"],
         ["रोग व कीटों पर निगरानी"]),
        ("Maturity & Harvest", "परिपक्वता एवं कटाई", 0.80, 1.0,
         "Crop reaches physiological maturity.",
         "फसल पूर्ण रूप से पक कर तैयार।",
         "Withhold irrigation prior to harvest.",
         "कटाई से पहले सिंचाई रोकें।",
         ["Harvesting and post-harvest handling"],
         ["कटाई एवं भंडारण प्रबंधन"])
    ]
}

class CropCalendarService:
    @classmethod
    def calculate_calendar(cls, request: CalendarRequest, db: Session) -> CalendarResponse:
        crop = db.query(Crop).filter(Crop.id == request.crop_id).first()
        if not crop:
            raise ValueError(f"Crop ID {request.crop_id} not found")

        # Parse sowing date
        try:
            sow_dt = datetime.datetime.strptime(request.sowing_date, "%Y-%m-%d").date()
        except ValueError:
            sow_dt = datetime.date.today()

        # Determine total duration
        req = db.query(CropRequirement).filter(CropRequirement.crop_id == crop.id).first()
        duration_days = req.duration_days if req else 115

        # Calendar entry for variety and source
        cal = db.query(CropCalendar).filter(
            CropCalendar.crop_id == crop.id,
            CropCalendar.district_id == request.district_id
        ).first()
        if not cal:
            cal = db.query(CropCalendar).filter(CropCalendar.crop_id == crop.id).first()

        variety = request.variety or (cal.variety if cal else "KVK Recommended Variety")
        source = cal.source if cal else "ICAR / BAU Sabour Package of Practices"

        # Harvest window calculation:
        # Estimated window = sow_dt + duration - 5 days to sow_dt + duration + 7 days
        harvest_start = sow_dt + datetime.timedelta(days=max(30, duration_days - 5))
        harvest_end = sow_dt + datetime.timedelta(days=duration_days + 7)

        # Select stage template
        stages_template = STAGE_TEMPLATES.get(crop.category, STAGE_TEMPLATES["Default"])
        stages: List[PhenologicalStage] = []

        for name_en, name_hi, frac_start, frac_end, desc_en, desc_hi, irr_en, irr_hi, act_en, act_hi in stages_template:
            start_d = int(duration_days * frac_start)
            end_d = int(duration_days * frac_end)
            if start_d == end_d and end_d > 0:
                start_d = max(0, end_d - 1)

            st_date = sow_dt + datetime.timedelta(days=start_d)
            en_date = sow_dt + datetime.timedelta(days=end_d)

            stages.append(
                PhenologicalStage(
                    stage_name=name_en,
                    stage_name_hi=name_hi,
                    start_day=start_d,
                    end_day=end_d,
                    start_date=st_date.isoformat(),
                    end_date=en_date.isoformat(),
                    description=desc_en,
                    description_hi=desc_hi,
                    irrigation_guidance=irr_en,
                    irrigation_guidance_hi=irr_hi,
                    key_activities=act_en,
                    key_activities_hi=act_hi
                )
            )

        # Hindi crop name
        crop_names_hi = {
            "Rice (Paddy)": "धान (चावल)",
            "Wheat": "गेहूं",
            "Maize": "मक्का",
            "Chickpea (Gram)": "चना",
            "Lentil (Masoor)": "मसूर",
            "Arhar (Pigeon Pea)": "अरहर",
            "Moong (Green Gram)": "मूंग",
            "Urad (Black Gram)": "उड़द",
            "Mustard": "सरसों",
            "Rapeseed (Toria)": "तोरी",
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
        name_hi = crop_names_hi.get(crop.name, crop.name)

        seasonal_advisory_en = (
            f"For {crop.name} ({variety}), ensure balanced basal NPK application at sowing. "
            f"Harvest window is projected between {harvest_start.strftime('%d %B %Y')} and "
            f"{harvest_end.strftime('%d %B %Y')} depending on field weather conditions."
        )
        seasonal_advisory_hi = (
            f"{name_hi} ({variety}) के लिए बुवाई के समय संतुलित डीएपी/एनपीके का उपयोग करें। "
            f"मौसम की अनुकूलता के आधार पर कटाई की अनुमानित अवधि {harvest_start.strftime('%d %B %Y')} से "
            f"{harvest_end.strftime('%d %B %Y')} के मध्य होगी।"
        )

        return CalendarResponse(
            crop_id=crop.id,
            crop_name=crop.name,
            crop_name_hi=name_hi,
            variety=variety,
            sowing_date=sow_dt.isoformat(),
            estimated_harvest_start=harvest_start.isoformat(),
            estimated_harvest_end=harvest_end.isoformat(),
            total_duration_days=duration_days,
            stages=stages,
            seasonal_advisory=seasonal_advisory_en,
            seasonal_advisory_hi=seasonal_advisory_hi,
            source_reference=source
        )
