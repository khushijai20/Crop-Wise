import os
import logging
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Crop, SoilData, District, AgriculturalAdvisory
from app.schemas.schemas import ChatRequest, ChatResponse, SourceCitation
from app.services.gemini_service import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class GroqAssistantService:
    @classmethod
    async def get_response(cls, request: ChatRequest, db: Session) -> Optional[ChatResponse]:
        groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        if not groq_api_key:
            return None

        # 1. RAG Context Retrieval
        district = db.query(District).filter(District.id == request.district_id).first() if request.district_id else None
        district_name = district.name if district else "Bihar"

        soil = db.query(SoilData).filter(SoilData.district_id == request.district_id).first() if request.district_id else None
        soil_summary = f"Soil Type: {soil.soil_type}, pH: {soil.ph}, Available Nitrogen: {soil.nitrogen} kg/ha, Organic Carbon: {soil.organic_carbon}%" if soil else "Standard Gangetic Alluvial Soil"

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

        # 2. Build RAG prompt
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

        lang_desc = {
            "hi": "Hindi (हिंदी) - सरल और सम्मानजनक ग्रामीण शब्दावली",
            "en": "English - Clear and practical agricultural English",
            "bho": "Bhojpuri (भोजपुरी) - विनम्र आ आदरपूर्वक देहाती भोजपुरी",
            "mai": "Maithili (मैथिली) - मिथिला क्षेत्रक विनम्र आ शुद्ध मैथिली",
        }.get(request.language or "hi", "Hindi (हिंदी)")

        user_content = f"{rag_context}\n\nPlease respond directly to the farmer in {lang_desc}."

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }

        model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.3,
            "max_tokens": 1024
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(GROQ_API_URL, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        answer_text = choices[0].get("message", {}).get("content", "")
                        return ChatResponse(
                            answer=answer_text,
                            language=request.language or "hi",
                            sources=sources,
                            is_gemini_active=True,
                            status_message=f"⚡ Powered by Groq Cloud ({model})"
                        )
                else:
                    logger.warning("Groq API returned HTTP %s: %s", res.status_code, res.text)
                    return None
        except Exception as e:
            logger.error("Groq API call error: %s", str(e))
            return None
