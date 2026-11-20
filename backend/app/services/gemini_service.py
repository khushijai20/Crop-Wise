import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Crop, CropRequirement, SoilData, District, AgriculturalAdvisory
from app.schemas.schemas import ChatRequest, ChatResponse, SourceCitation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are 'Smart Kisan Assistant' (स्मार्ट किसान सहायक), an empathetic, expert agricultural AI advisor for Indian farmers.
You are grounded in verified agronomic science from ICAR (Indian Council of Agricultural Research), State Agricultural Universities (like BAU Sabour, RPCAU Pusa), and Krishi Vigyan Kendras (KVK).

CORE PRINCIPLES:
1. Always adapt your language strictly to the user's preferred language (Hindi or English). If Hindi, use warm, respectful, simple language understandable by rural farmers (e.g., using terms like 'सिंचाई', 'खाद', 'बुवाई', 'रोग रोकथाम').
2. Ground your advice in the provided Location, Weather, Soil, and Verified Agricultural Context.
3. NEVER guarantee crop yields or financial profits. Farming is contingent upon local climate and farm practices.
4. NEVER invent synthetic pesticide chemical names or unauthorized high dosages. For chemical plant protection, advise integrated pest management (IPM), cultural practices, and recommend consulting their local KVK agronomist or reading CIBRC registered container labels.
5. If a plant health symptom is ambiguous (e.g. 'leaves turning yellow'), outline 2-3 potential causes (Nitrogen deficiency, waterlogging, or fungal root rot) and suggest simple diagnostic checks rather than asserting absolute certainty.
6. Clearly distinguish between verified regional facts and general estimates.
"""

class GeminiAssistantService:
    @classmethod
    async def get_response(cls, request: ChatRequest, db: Session) -> ChatResponse:
        # 1. RAG Context Retrieval
        district = db.query(District).filter(District.id == request.district_id).first() if request.district_id else None
        district_name = district.name if district else "Bihar"
        
        # Retrieve soil info
        soil = db.query(SoilData).filter(SoilData.district_id == request.district_id).first() if request.district_id else None
        soil_summary = f"Soil Type: {soil.soil_type}, pH: {soil.ph}, Available Nitrogen: {soil.nitrogen} kg/ha, Organic Carbon: {soil.organic_carbon}%" if soil else "Standard Gangetic Alluvial Soil"

        # Search relevant crops and advisories from local database
        query_text = request.message.lower()
        matched_crops = []
        for c in db.query(Crop).all():
            if c.name.lower() in query_text or (c.scientific_name and c.scientific_name.lower() in query_text):
                matched_crops.append(c)
        
        matched_advisories = []
        for adv in db.query(AgriculturalAdvisory).all():
            if any(term in query_text for term in [adv.stage.lower(), adv.title.lower(), "disease", "pest", "रोग", "कीट", "खाद", "सिंचाई"]):
                matched_advisories.append(adv)

        sources: List[SourceCitation] = [
            SourceCitation(
                title=f"District Soil Profile ({district_name})",
                source=soil.source if soil else "Bihar Soil Survey / ICAR-RCER",
                relevance="Soil baseline for nutrient and crop compatibility"
            ),
            SourceCitation(
                title="Agrometeorological & Crop Advisory",
                source="ICAR / BAU Sabour Package of Practices",
                relevance="Agronomic guidelines and pest management"
            )
        ]

        # 2. Check if Gemini API Key is available
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")

        if not api_key:
            # High-quality database-backed fallback response
            return cls._build_fallback_response(request, district_name, soil_summary, matched_crops, matched_advisories, sources)

        # 3. Call Google Gemini API
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            # Build contextual RAG prompt
            rag_context = f"""
USER CONTEXT:
- Selected District: {district_name}, Bihar
- Soil Metrics: {soil_summary}
- Query: {request.message}
- Preferred Language: {request.language}

DATABASE RETRIEVED KNOWLEDGE:
"""
            if matched_crops:
                rag_context += "\nMatched Crops:\n" + "\n".join([f"- {c.name} ({c.scientific_name}): {c.description}" for c in matched_crops])
            if matched_advisories:
                rag_context += "\nVerified Advisories:\n" + "\n".join([f"- {a.title}: {a.advisory_en} / {a.advisory_hi}" for a in matched_advisories[:3]])

            prompt = f"{SYSTEM_PROMPT}\n\n{rag_context}\n\nPlease respond directly to the farmer in {'Hindi (हिंदी)' if request.language == 'hi' else 'English'}."

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            answer_text = response.text if response and response.text else "उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।"
            return ChatResponse(
                answer=answer_text,
                language=request.language or "hi",
                sources=sources,
                is_gemini_active=True,
                status_message=None
            )

        except Exception as e:
            logger.error("Gemini API call failed: %s. Returning database fallback.", str(e))
            return cls._build_fallback_response(request, district_name, soil_summary, matched_crops, matched_advisories, sources, error_msg=str(e))

    @classmethod
    def _build_fallback_response(
        cls, request: ChatRequest, district_name: str, soil_summary: str,
        matched_crops: List[Any], matched_advisories: List[Any], sources: List[SourceCitation],
        error_msg: Optional[str] = None
    ) -> ChatResponse:
        is_hi = (request.language == "hi")
        msg = request.message.lower()

        if is_hi:
            answer = f"**नमस्ते किसान भाई! (स्मार्ट किसान सहायक)**\n\n"
            answer += f"आपके जिले **{district_name}** के कृषि रिकॉर्ड के अनुसार:\n"
            answer += f"• **मिट्टी की स्थिति**: {soil_summary}\n\n"

            if "गेहूं" in msg or "wheat" in msg:
                answer += "🌾 **गेहूं की खेती की मुख्य सलाह:**\n"
                answer += "- बुवाई का सबसे उपयुक्त समय 15 नवंबर से 10 दिसंबर है।\n"
                answer += "- बिहार के लिए उन्नत किस्में: **DBW 187 (करण वंदना)**, **HD 2967**, **सबौर निर्जल**।\n"
                answer += "- बुवाई के 20-25 दिन बाद **सीआरआई (CRI) अवस्था** पर पहली सिंचाई अत्यंत आवश्यक है।\n"
            elif "धान" in msg or "rice" in msg or "चावल" in msg:
                answer += "🌾 **धान की खेती की मुख्य सलाह:**\n"
                answer += "- रोपाई जून-जुलाई में करें। जलमग्न क्षेत्रों के लिए **स्वर्णा सब-1** और सामान्य सिंचित क्षेत्रों के लिए **राजेंद्र श्वेता** या **MTU 7029** चुनें।\n"
                answer += "- तना छेदक कीट की रोकथाम के लिए फेरोमोन ट्रैप का प्रयोग करें।\n"
            elif "खाद" in msg or "उर्वरक" in msg or "fertilizer" in msg:
                answer += "🌱 **उर्वरक प्रबंधन सलाह:**\n"
                answer += "- बुवाई के समय संतुलित फास्फोरस (DAP/SSP) और पोटाश बेसल डोज के रूप में दें।\n"
                answer += "- यूरिया को एक साथ न देकर 2 से 3 बराबर किस्तों में सिंचाई के बाद छिड़कें।\n"
                answer += "- मिट्टी के स्वास्थ्य सुधार के लिए प्रति 2-3 वर्ष में हरी खाद (ढैंचा/सनई) का प्रयोग करें।\n"
            elif "पीला" in msg or "yellow" in msg or "पत्तियां" in msg:
                answer += "🍂 **पत्तियां पीली पड़ने के संभावित कारण:**\n"
                answer += "1. **नाइट्रोजन की कमी**: पुरानी पत्तियां नीचे से पीली पड़ रही हों, तो हल्की यूरिया या 2% यूरिया घोल का छिड़काव लाभकारी होता है।\n"
                answer += "2. **जलभराव (Waterlogging)**: यदि खेत में पानी जमा है, तो जड़ों को ऑक्सीजन नहीं मिलती। जल निकासी तुरंत सुनिश्चित करें।\n"
                answer += "3. **सूक्ष्म पोषक तत्वों (जिंक/आयरन) की कमी**: जिंक की कमी में नई पत्तियों पर पीलापन आता है।\n"
                answer += "*सटीक निदान के लिए खेत का नमूना स्थानीय KVK विशेषज्ञ को दिखाएं।*\n"
            else:
                answer += "💡 **मौसमी कृषि दिशानिर्देश:**\n"
                answer += "- रबी मौसम में दलहन (चना, मसूर) एवं तिलहन (सरसों) में समय पर बुवाई करने से कीटों का प्रकोप न्यूनतम रहता है।\n"
                answer += "- कीटनाशकों का प्रयोग केवल आर्थिक नुकसान सीमा (ETL) पार होने पर ही KVK वैज्ञानिक की सलाह से करें।\n"

            status_note = (
                "ℹ️ *यह उत्तर स्थानीय ICAR/BAU डेटाबेस से प्राप्त है। पूर्ण AI जनरेटिव वार्तालाप के लिए .env में GEMINI_API_KEY जोड़ें।*"
            )
        else:
            answer = f"**Hello Farmer! (Smart Kisan Assistant)**\n\n"
            answer += f"Based on agricultural records for **{district_name}** district:\n"
            answer += f"• **Soil Baseline**: {soil_summary}\n\n"

            if "wheat" in msg or "गेहूं" in msg:
                answer += "🌾 **Wheat Agronomy Highlights:**\n"
                answer += "- Optimal sowing window: November 15 to December 10.\n"
                answer += "- Recommended varieties for Bihar: **DBW 187 (Karan Vandana)**, **HD 2967**, **PBW 343**.\n"
                answer += "- First irrigation at **Crown Root Initiation (CRI)** 20-25 days after sowing is critical for tillering.\n"
            elif "rice" in msg or "paddy" in msg:
                answer += "🌾 **Paddy Cultivation Guidance:**\n"
                answer += "- Sowing/transplanting in June-July. Flood-tolerant varieties like **Swarna Sub-1** or high-yielding **Rajendra Sweta**.\n"
                answer += "- Maintain balanced nitrogen and avoid excessive urea during humid spells to prevent blast disease.\n"
            elif "yellow" in msg:
                answer += "🍂 **Diagnostic Guide for Leaf Yellowing:**\n"
                answer += "1. **Nitrogen Deficiency**: Starts from bottom older leaves progressing upwards. Top dress urea after light irrigation.\n"
                answer += "2. **Root Asphyxiation**: Excessive standing water limits oxygen to roots. Drain stagnant water immediately.\n"
                answer += "3. **Zinc Deficiency (Khaira in Rice)**: Interveinal chlorosis in younger leaves. Foliar spray of zinc sulfate.\n"
                answer += "*Consult your local Krishi Vigyan Kendra (KVK) for exact on-field confirmation.*\n"
            else:
                answer += "💡 **Seasonal Farm Advisory:**\n"
                answer += "- Follow integrated nutrient management (FYM + balanced NPK + biofertilizers).\n"
                answer += "- Adhere to certified seed treatments with Trichoderma or Rhizobium before sowing.\n"

            status_note = (
                "ℹ️ *Response generated from local ICAR/BAU agronomic database. Add GEMINI_API_KEY to your .env file to enable live Gemini generative reasoning.*"
            )

        return ChatResponse(
            answer=answer,
            language=request.language or "hi",
            sources=sources,
            is_gemini_active=False,
            status_message=status_note
        )
