from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.gemini_service import GeminiAssistantService

router = APIRouter()

@router.post("/assistant/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Agricultural AI Chatbot (Smart Kisan Assistant) powered by Google Gemini and RAG:
    - Grounded in selected location, soil properties, and ICAR crop guidance.
    - Supports Hindi and English.
    - Safe recommendations (no synthetic dosage inventions, no yield guarantees).
    - Graceful fallback when Gemini API key is unconfigured.
    """
    return await GeminiAssistantService.get_response(request, db)
