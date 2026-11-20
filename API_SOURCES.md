# Smart Kisan 🌱 – External API Integration Directory

This document details all external APIs, official endpoints, documentation references, authentication prerequisites, response fields, and their active integration status within the Smart Kisan platform.

---

## 1. Open-Meteo Weather Forecast & Historical API

- **Official Documentation**: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
- **Forecast Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Historical Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **Authentication**: None required (Free for non-commercial and fair-use open science).
- **Rate Limits**: 10,000 daily API calls per IP without API key.
- **Request Parameters**:
  - `latitude`: District coordinate (float)
  - `longitude`: District coordinate (float)
  - `current`: `temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`
  - `daily`: `weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration`
  - `timezone`: `Asia/Kolkata`
- **Response Fields Captured**:
  - `current.temperature_2m` (°C)
  - `current.relative_humidity_2m` (%)
  - `current.precipitation` (mm)
  - `current.weather_code` (WMO code mapped to sunny, partly cloudy, rain, thunderstorm, etc.)
  - `current.wind_speed_10m` (km/h)
  - `daily.temperature_2m_max`, `daily.temperature_2m_min` (7-day forecast array)
  - `daily.precipitation_sum` (mm)
  - `daily.precipitation_probability_max` (%)
- **Integration Status**: **LIVE & ACTIVE**
- **Fallback Strategy**: In-memory cache (TTL 15 minutes) + historical district baseline. Clear badge `Live API Data` or `Cached Regional Data`.

---

## 2. India Meteorological Department (IMD) API

- **Official Documentation**: [https://api.imd.gov.in/public/api_reference.html](https://api.imd.gov.in/public/api_reference.html)
- **API Portal**: [https://api.imd.gov.in/public/](https://api.imd.gov.in/public/)
- **Target Services**:
  - District Rainfall Forecast
  - City Weather Forecast
  - District-wise Warnings
  - Agromet Advisory Bulletins (AAS)
- **Authentication**: Requires institutional registration and authorized API key (`IMD_API_KEY`).
- **Integration Status**: **CONFIGURATION READY (GRACEFUL FALLBACK)**
- **Handling**: Smart Kisan checks for valid IMD credentials via `IMD_API_KEY`. If credentials are not present or portal returns 401/403, the system transparently utilizes Open-Meteo for district weather and displays official ICAR/KVK agromet advisories from our verified database. No fake IMD warnings are manufactured.

---

## 3. ISRIC SoilGrids v2.0 REST API

- **Official Documentation**: [https://docs.isric.org/globaldata/soilgrids/](https://docs.isric.org/globaldata/soilgrids/)
- **API Endpoint**: `https://rest.isric.org/soilgrids/v2.0/properties/query`
- **Authentication**: None required.
- **Rate Limit & Operational Status Note**: The SoilGrids REST service has intermittent uptime and strict rate limits.
- **Query Properties**:
  - `phh2o`: Soil pH in H2O
  - `nitrogen`: Total nitrogen (cg/kg)
  - `soc`: Soil organic carbon (dg/kg)
  - `clay`: Clay content (%)
  - `sand`: Sand content (%)
  - `silt`: Silt content (%)
- **Integration Status**: **ACTIVE WITH AUTOMATIC FALLBACK**
- **Fallback Strategy**: When SoilGrids endpoint times out or returns 503/429, the system seamlessly pulls from the verified Bihar District Soil Database (derived from Bihar Soil Health Card portal and ICAR-RCER). All values carry an unambiguous provenance badge: `Verified Regional Soil Data` or `SoilGrids API Data`. Farmers can also enter their exact Soil Health Card measurements manually.

---

## 4. Open Government Data (OGD) Platform India (data.gov.in)

- **Official Portal**: [https://www.data.gov.in/](https://www.data.gov.in/)
- **Target Datasets**: District-wise, season-wise crop production statistics for Bihar.
- **Access Method**: CSV batch download and structured PostgreSQL/SQLite ingestion pipeline (`/api/v1/admin/import-dataset`).
- **Integration Status**: **IMPORT PIPELINE ACTIVE**

---

## 5. Google Gemini API (Smart Kisan Assistant)

- **Official Documentation**: [https://ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)
- **SDK**: `google-genai`
- **Model**: `gemini-2.5-flash`
- **Authentication**: Environment variable `GEMINI_API_KEY`.
- **RAG Architecture**:
  1. Semantic retrieval of matched crops, soil requirements, and ICAR advisory records based on the user's selected district and query.
  2. Grounded system prompt with strict agricultural guardrails (no fabricated pesticide dosages, yield guarantees, or synthetic disease certitude).
  3. Bilingual responses in Hindi and English.
- **Integration Status**: **CONFIGURED & ACTIVE** (with graceful fallback to database guidance if key is absent).
