# Smart Kisan 🌱 – Agricultural Dataset Sources & Provenance

This document details all baseline datasets used by Smart Kisan, including provenance, license terms, geographic coverage, verification timelines, and agricultural limitations.

---

## 1. Administrative Boundaries & District Coordinates

- **File**: `backend/data/seeds/districts.csv`, `states.csv`
- **Data Source**: Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India ([https://lgdirectory.gov.in/](https://lgdirectory.gov.in/)) and Census of India administrative district centroids.
- **Coverage**: All 38 districts of Bihar state + representative Indian states (Uttar Pradesh, Punjab, Madhya Pradesh, Haryana, West Bengal).
- **License**: Government Open Data License - India (GODL).
- **Limitation Notice**: District centroid coordinates provide macro-level regional climate and soil estimates. A district centroid does NOT replace GPS-measured microclimate or plot-specific topography of an individual farm.

---

## 2. Bihar District Soil Profiles

- **File**: `backend/data/seeds/soil_data.csv`
- **Primary Source**:
  1. Soil Health Card Portal, Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare, Govt of India ([https://soilhealth.dac.gov.in/](https://soilhealth.dac.gov.in/)).
  2. ICAR Research Complex for Eastern Region (ICAR-RCER), Patna – "Soil Resource Atlas of Bihar".
  3. Bihar Agricultural University (BAU), Sabour, Bhagalpur – Department of Soil Science & Agricultural Chemistry.
- **Parameters**: Soil type classification, Soil pH, Available Nitrogen (kg/ha), Organic Carbon (%), Clay (%), Sand (%), Silt (%).
- **Verification Date**: April 2026.
- **Limitation Notice**: Regional aggregates indicate broad agro-ecological zone characteristics (Zone I: North-West Alluvial, Zone II: North-East Alluvial, Zone III-A: South Bihar Alluvial, Zone III-B: South-East Alluvial/Hilly). Individual plots may differ; farmers are encouraged to input their exact field Soil Health Card lab results via the Soil Health dashboard.

---

## 3. Crop Growth Requirements & Agronomic Parameters

- **File**: `backend/data/seeds/crops.csv`, `crop_requirements.csv`
- **Primary Sources**:
  1. Indian Council of Agricultural Research (ICAR) – Major Crops Handbook ([https://icar.gov.in/](https://icar.gov.in/)).
  2. Dr. Rajendra Prasad Central Agricultural University (Dr. RPCAU), Pusa, Samastipur ([https://www.rpcau.ac.in/](https://www.rpcau.ac.in/)).
  3. Bihar Agricultural University (BAU), Sabour ([https://bausabour.ac.in/](https://bausabour.ac.in/)) – Package of Practices for Kharif, Rabi, and Summer (Zaid) Crops.
- **Crops Covered**:
  - **Cereals**: Rice (Paddy), Wheat, Maize (Kharif and Rabi).
  - **Pulses**: Chickpea (Gram), Lentil (Masoor), Arhar (Pigeon Pea), Moong (Green Gram), Urad (Black Gram).
  - **Oilseeds**: Mustard (Sarson), Rapeseed (Toria), Groundnut.
  - **Cash & Other**: Sugarcane, Potato, Onion.
  - **Vegetables**: Tomato, Brinjal, Cauliflower, Cabbage, Okra (Bhindi).
- **Verification Date**: May 2026.

---

## 4. Seasonal Crop Calendar & Phenological Stages

- **File**: `backend/data/seeds/crop_calendar.csv`
- **Primary Sources**:
  - BAU Sabour Agro-meteorological Bulletins & Crop Calendar.
  - Krishi Vigyan Kendra (KVK) district advisories (Patna, Bhagalpur, Muzaffarpur, Gaya, Darbhanga, Nalanda, etc.).
- **Parameters**: Sowing start/end months, Harvesting start/end months, Recommended Bihar-adapted varieties (e.g. Swarna Sub-1, Rajendra Sweta, DBW-187 Karan Vandana, Sabour Chana-1, Shaktiman-1), verified phenological stage durations (germination, vegetative, flowering, maturity).

---

## 5. Crop Protection & Agromet Advisories

- **File**: `backend/data/seeds/agricultural_advisories.csv`
- **Primary Sources**:
  - ICAR-National Rice Research Institute (NRRI), Cuttack.
  - ICAR-Indian Institute of Wheat & Barley Research (IIWBR), Karnal.
  - ICAR-Indian Institute of Pulses Research (IIPR), Kanpur.
  - ICAR-Directorate of Rapeseed-Mustard Research (DRMR), Bharatpur.
  - ICAR-Central Potato Research Institute (CPRI), Shimla.
- **Language**: English and Hindi (*द्विभाषी सलाह*).
- **Safety Protocol**: All advisories focus on integrated pest management (cultural practices, pheromone traps, biological agents, resistant varieties). Farmers are explicitly instructed to consult official local KVK experts and read government-registered CIBRC product labels before chemical applications.
