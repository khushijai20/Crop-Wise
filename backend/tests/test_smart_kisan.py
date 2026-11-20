import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Smart Kisan" in response.json()["project"]
    assert "Bihar" in response.json()["coverage"]

def test_locations_states_and_districts():
    # 1. Fetch States (Dedicated Bihar)
    states_res = client.get("/api/v1/states")
    assert states_res.status_code == 200
    states = states_res.json()
    assert len(states) == 1
    bihar = states[0]
    assert bihar["name"] == "Bihar"

    # 2. Fetch all 38 Bihar districts
    districts_res = client.get(f"/api/v1/districts/{bihar['id']}")
    assert districts_res.status_code == 200
    districts = districts_res.json()
    assert len(districts) == 38

    # Verify key districts exist with accurate coordinates
    test_district_names = ["Patna", "Bhagalpur", "Muzaffarpur", "Gaya", "Darbhanga"]
    for name in test_district_names:
        d = next((item for item in districts if item["name"] == name), None)
        assert d is not None, f"District {name} missing from Bihar dataset"
        assert 24.0 <= d["latitude"] <= 28.0
        assert 83.0 <= d["longitude"] <= 89.0

def test_location_search():
    res = client.get("/api/v1/locations/search?q=Pat")
    assert res.status_code == 200
    results = res.json()
    assert any("Patna" in r["district_name"] for r in results)

def test_weather_endpoint_and_fallback():
    # Test Patna (ID 26)
    res = client.get("/api/v1/weather/26")
    assert res.status_code == 200
    data = res.json()
    assert data["district_id"] == 26
    assert "current" in data
    assert "daily_forecast" in data
    assert len(data["daily_forecast"]) == 7
    assert data["current"]["temperature"] is not None
    assert data["data_status_label"] in ["Live API Data", "Cached Regional Data", "Estimated Regional Data"]

def test_soil_endpoint_and_custom_card():
    # 1. Fetch district soil for Bhagalpur (ID 6)
    res = client.get("/api/v1/soil/6")
    assert res.status_code == 200
    soil = res.json()
    assert soil["district_id"] == 6
    assert 5.0 <= soil["ph"] <= 9.0
    assert soil["nitrogen"] > 0
    assert soil["source"] is not None

    # 2. Submit custom Soil Health Card values
    custom_report = {
        "district_id": 6,
        "farmer_name": "Ramesh Kumar",
        "soil_type": "Clay Loam",
        "ph": 6.8,
        "nitrogen": 255.0,
        "organic_carbon": 0.65,
        "clay_percentage": 32.0,
        "sand_percentage": 38.0,
        "silt_percentage": 30.0
    }
    post_res = client.post("/api/v1/soil/test-report", json=custom_report)
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["ph"] == 6.8
    assert data["nitrogen"] == 255.0
    assert data["data_status_label"] == "User-Entered Soil Card Data"

def test_crops_catalog():
    res = client.get("/api/v1/crops")
    assert res.status_code == 200
    crops = res.json()
    assert len(crops) >= 19
    names = [c["name"] for c in crops]
    assert "Rice (Paddy)" in names
    assert "Wheat" in names
    assert "Chickpea (Gram)" in names
    assert "Mustard" in names

def test_crop_recommendation_scoring_and_constraints():
    # Evaluate for Patna in Rabi
    req = {
        "district_id": 26,
        "season": "Rabi",
        "water_availability": "Moderate"
    }
    res = client.post("/api/v1/recommendations", json=req)
    assert res.status_code == 200
    data = res.json()
    recs = data["recommendations"]
    assert len(recs) <= 5
    assert len(recs) > 0

    top = recs[0]
    assert top["suitability_score"] >= 60.0
    assert top["suitability_category"] in ["Highly suitable", "Potentially suitable"]
    assert "breakdown" in top
    # Check formula components
    b = top["breakdown"]
    assert 0 <= b["soil_score"] <= 100
    assert 0 <= b["climate_score"] <= 100
    assert 0 <= b["season_score"] <= 100
    assert 0 <= b["water_score"] <= 100
    assert 0 <= b["duration_score"] <= 100
    assert len(top["why_recommended"]) > 0

def test_crop_calendar_calculation():
    # Test Wheat (crop_id 2) sown on 2026-11-20 in Gaya (ID 11)
    req = {
        "crop_id": 2,
        "district_id": 11,
        "sowing_date": "2026-11-20"
    }
    res = client.post("/api/v1/calendar", json=req)
    assert res.status_code == 200
    cal = res.json()
    assert cal["crop_name"] == "Wheat"
    assert cal["sowing_date"] == "2026-11-20"
    assert "estimated_harvest_start" in cal
    assert len(cal["stages"]) >= 4
    # CRI stage check in stage 2
    assert any("वानस्पतिक" in s["stage_name_hi"] or "Tillering" in s["stage_name"] for s in cal["stages"])

def test_ai_assistant_bilingual_chat():
    # 1. Hindi question
    hi_req = {
        "message": "आलू की फसल में पत्तियां पीली क्यों हो रही हैं?",
        "district_id": 26,
        "language": "hi"
    }
    res_hi = client.post("/api/v1/assistant/chat", json=hi_req)
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert len(data_hi["answer"]) > 20
    assert len(data_hi["sources"]) >= 1

    # 2. English question
    en_req = {
        "message": "When should I irrigate wheat?",
        "district_id": 26,
        "language": "en"
    }
    res_en = client.post("/api/v1/assistant/chat", json=en_req)
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert len(data_en["answer"]) > 20

def test_multiple_districts_weather_and_soil():
    """Verify test coverage across 5 priority Bihar districts."""
    test_district_ids = [26, 6, 23, 11, 9]  # Patna, Bhagalpur, Muzaffarpur, Gaya, Darbhanga
    for d_id in test_district_ids:
        s_res = client.get(f"/api/v1/soil/{d_id}")
        assert s_res.status_code == 200
        w_res = client.get(f"/api/v1/weather/{d_id}")
        assert w_res.status_code == 200

def test_language_preferences_endpoint():
    """Verify Bihar languages: Hindi, English, Bhojpuri, Maithili."""
    # 1. Get supported languages
    res = client.get("/api/v1/farmer/preferences")
    assert res.status_code == 200
    data = res.json()
    codes = [l["code"] for l in data["supported_languages"]]
    assert "hi" in codes
    assert "en" in codes
    assert "bho" in codes
    assert "mai" in codes

    # 2. Update preference to Bhojpuri
    up_res = client.post("/api/v1/farmer/preferences", json={
        "name": "Bhojpuri Kisan",
        "preferred_language": "bho",
        "district_id": 7 # Bhojpur
    })
    assert up_res.status_code == 200
    assert up_res.json()["preferred_language"] == "bho"

    # 3. Test Bhojpuri AI response
    bho_req = {
        "message": "गेहूं के बोआई कइसे करीं?",
        "district_id": 7,
        "language": "bho"
    }
    bho_chat = client.post("/api/v1/assistant/chat", json=bho_req)
    assert bho_chat.status_code == 200
    assert "भोजपुरी" in bho_chat.json()["answer"] or "गेहूं" in bho_chat.json()["answer"]

def test_api_keys_management_and_status():
    """Verify Groq, Gemini, and Weather App API key management."""
    # 1. Fetch current status
    res = client.get("/api/v1/api-keys/status")
    assert res.status_code == 200
    data = res.json()
    assert "gemini" in data
    assert "groq" in data
    assert "weather" in data
    assert "active_ai_provider" in data
    assert "active_weather_provider" in data

    # 2. Save test API keys
    save_res = client.post("/api/v1/api-keys/save", json={
        "gemini_api_key": "AIzaSyFakeTestGeminiKey12345678",
        "groq_api_key": "gsk_FakeTestGroqKey1234567890",
        "weather_api_key": "fake_weather_key_12345678901234"
    })
    assert save_res.status_code == 200
    updated = save_res.json()
    assert updated["gemini"]["is_configured"] is True
    assert "AIza" in updated["gemini"]["masked_key"]
    assert updated["groq"]["is_configured"] is True
    assert "gsk_" in updated["groq"]["masked_key"]
    assert updated["weather"]["is_configured"] is True

