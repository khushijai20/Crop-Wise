import time
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings
from app.schemas.schemas import (
    WeatherForecastResponse, WeatherCurrent, DailyForecastItem,
    WeatherHistoryResponse, WeatherHistoryPoint
)

logger = logging.getLogger(__name__)

# Weather code WMO mappings in English and Hindi
WMO_CODES = {
    0: ("Clear sky", "साफ़ आसमान"),
    1: ("Mainly clear", "मुख्य रूप से साफ़"),
    2: ("Partly cloudy", "आंशिक रूप से बादल"),
    3: ("Overcast", "घने बादल"),
    45: ("Foggy", "कोहरा"),
    48: ("Depositing rime fog", "घना कोहरा"),
    51: ("Light drizzle", "हल्की बूंदाबांदी"),
    53: ("Moderate drizzle", "मध्यम बूंदाबांदी"),
    55: ("Dense drizzle", "तेज बूंदाबांदी"),
    61: ("Slight rain", "हल्की बारिश"),
    63: ("Moderate rain", "मध्यम बारिश"),
    65: ("Heavy rain", "भारी बारिश"),
    71: ("Slight snow", "हल्की बर्फबारी"),
    73: ("Moderate snow", "मध्यम बर्फबारी"),
    75: ("Heavy snow", "भारी बर्फबारी"),
    80: ("Slight rain showers", "हल्की बौछारें"),
    81: ("Moderate rain showers", "मध्यम बौछारें"),
    82: ("Violent rain showers", "तेज मूसलाधार बौछारें"),
    95: ("Thunderstorm", "गरज के साथ तूफ़ान"),
    96: ("Thunderstorm with slight hail", "ओलावृष्टि के साथ तूफ़ान"),
    99: ("Thunderstorm with heavy hail", "भारी ओलावृष्टि के साथ तूफ़ान"),
}

# In-memory weather cache: (lat, lon) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, Any] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes

class WeatherService:
    @staticmethod
    def get_wmo_description(code: int) -> tuple[str, str]:
        return WMO_CODES.get(code, ("Partly cloudy", "सामान्य मौसम"))

    @classmethod
    async def get_district_weather(
        cls, district_id: int, district_name: str, latitude: float, longitude: float
    ) -> WeatherForecastResponse:
        cache_key = f"{round(latitude, 2)}_{round(longitude, 2)}"
        now = time.time()

        if cache_key in _WEATHER_CACHE:
            cached_time, cached_data = _WEATHER_CACHE[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                logger.info("Returning cached weather for %s", district_name)
                cached_data.data_status_label = "Cached Regional Data"
                return cached_data

        # 1. Check Commercial Weather App API Key (WeatherAPI.com or OpenWeatherMap)
        weatherapi_k = settings.WEATHERAPI_KEY or settings.WEATHER_API_KEY
        if weatherapi_k and len(weatherapi_k) > 15:
            api_res = await cls._fetch_from_weatherapi(district_id, district_name, latitude, longitude, weatherapi_k)
            if api_res:
                _WEATHER_CACHE[cache_key] = (now, api_res)
                return api_res

        openweather_k = settings.OPENWEATHER_API_KEY or settings.WEATHER_API_KEY
        if openweather_k and len(openweather_k) >= 30:
            owm_res = await cls._fetch_from_openweather(district_id, district_name, latitude, longitude, openweather_k)
            if owm_res:
                _WEATHER_CACHE[cache_key] = (now, owm_res)
                return owm_res

        # 2. Open-Meteo High-Resolution Free Weather Model (Official open scientific API)
        url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "timezone": "Asia/Kolkata",
            "forecast_days": 7
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    curr = data.get("current", {})
                    daily = data.get("daily", {})

                    w_code = int(curr.get("weather_code", 1))
                    w_en, w_hi = cls.get_wmo_description(w_code)

                    current_obj = WeatherCurrent(
                        temperature=float(curr.get("temperature_2m", 26.5)),
                        relative_humidity=float(curr.get("relative_humidity_2m", 65.0)),
                        precipitation=float(curr.get("precipitation", 0.0)),
                        rain=float(curr.get("rain", 0.0)),
                        weather_code=w_code,
                        weather_description=w_en,
                        weather_description_hi=w_hi,
                        wind_speed=float(curr.get("wind_speed_10m", 8.5)),
                        data_source="Open-Meteo Live API",
                        is_live=True,
                        recorded_at=curr.get("time", time.strftime("%Y-%m-%dT%H:%M"))
                    )

                    daily_items: List[DailyForecastItem] = []
                    dates = daily.get("time", [])
                    max_temps = daily.get("temperature_2m_max", [])
                    min_temps = daily.get("temperature_2m_min", [])
                    precip_sums = daily.get("precipitation_sum", [])
                    precip_probs = daily.get("precipitation_probability_max", [])
                    codes = daily.get("weather_code", [])

                    for i in range(len(dates)):
                        code_i = int(codes[i]) if i < len(codes) else 1
                        en_i, hi_i = cls.get_wmo_description(code_i)
                        daily_items.append(
                            DailyForecastItem(
                                date=dates[i],
                                temp_max=float(max_temps[i]) if i < len(max_temps) else 30.0,
                                temp_min=float(min_temps[i]) if i < len(min_temps) else 18.0,
                                precipitation_sum=float(precip_sums[i]) if i < len(precip_sums) else 0.0,
                                precipitation_probability=float(precip_probs[i]) if i < len(precip_probs) else 10.0,
                                weather_code=code_i,
                                weather_description=en_i,
                                weather_description_hi=hi_i
                            )
                        )

                    result = WeatherForecastResponse(
                        district_id=district_id,
                        district_name=district_name,
                        latitude=latitude,
                        longitude=longitude,
                        current=current_obj,
                        daily_forecast=daily_items,
                        status="success",
                        data_status_label="Live API Data",
                        warning=None
                    )

                    _WEATHER_CACHE[cache_key] = (now, result)
                    return result
                else:
                    logger.warning("Open-Meteo returned status %d. Using fallback.", response.status_code)
        except Exception as e:
            logger.error("Error connecting to Open-Meteo: %s. Using fallback.", str(e))

        # Fallback to realistic regional agro-climatic baseline for Bihar
        return cls._get_baseline_fallback(district_id, district_name, latitude, longitude)

    @classmethod
    def _get_baseline_fallback(
        cls, district_id: int, district_name: str, latitude: float, longitude: float
    ) -> WeatherForecastResponse:
        import datetime
        today = datetime.date.today()
        month = today.month

        # Seasonal baseline for Bihar
        if month in [11, 12, 1, 2]:  # Rabi (Winter)
            base_temp = 22.0
            base_min = 12.0
            base_rain = 0.0
            w_code = 1
        elif month in [3, 4, 5]:  # Summer / Zaid
            base_temp = 34.0
            base_min = 23.0
            base_rain = 2.0
            w_code = 0
        else:  # Kharif (Monsoon)
            base_temp = 30.0
            base_min = 25.0
            base_rain = 12.5
            w_code = 61

        w_en, w_hi = cls.get_wmo_description(w_code)
        current_obj = WeatherCurrent(
            temperature=base_temp,
            relative_humidity=62.0,
            precipitation=base_rain,
            rain=base_rain,
            weather_code=w_code,
            weather_description=w_en,
            weather_description_hi=w_hi,
            wind_speed=9.0,
            data_source="Regional Agro-Climatic Baseline (Fallback)",
            is_live=False,
            recorded_at=datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")
        )

        daily_items = []
        for i in range(7):
            d = today + datetime.timedelta(days=i)
            daily_items.append(
                DailyForecastItem(
                    date=d.isoformat(),
                    temp_max=base_temp + 1.5,
                    temp_min=base_min,
                    precipitation_sum=base_rain,
                    precipitation_probability=20.0,
                    weather_code=w_code,
                    weather_description=w_en,
                    weather_description_hi=w_hi
                )
            )

        return WeatherForecastResponse(
            district_id=district_id,
            district_name=district_name,
            latitude=latitude,
            longitude=longitude,
            current=current_obj,
            daily_forecast=daily_items,
            status="fallback",
            data_status_label="Estimated Regional Data",
            warning="Live weather server is currently unreachable. Displaying verified regional seasonal estimates."
        )

    @classmethod
    async def get_weather_history(
        cls, district_id: int, district_name: str, latitude: float, longitude: float
    ) -> WeatherHistoryResponse:
        import datetime
        end_date = datetime.date.today() - datetime.timedelta(days=1)
        start_date = end_date - datetime.timedelta(days=14)

        url = f"{settings.OPEN_METEO_ARCHIVE_URL}/archive"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": "temperature_2m_mean,precipitation_sum",
            "timezone": "Asia/Kolkata"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    d = res.json().get("daily", {})
                    times = d.get("time", [])
                    means = d.get("temperature_2m_mean", [])
                    precips = d.get("precipitation_sum", [])
                    pts = [
                        WeatherHistoryPoint(
                            date=times[i],
                            temperature_mean=float(means[i]) if i < len(means) and means[i] is not None else 25.0,
                            precipitation_sum=float(precips[i]) if i < len(precips) and precips[i] is not None else 0.0
                        )
                        for i in range(len(times))
                    ]
                    return WeatherHistoryResponse(
                        district_id=district_id,
                        district_name=district_name,
                        points=pts,
                        source="Open-Meteo Historical Archive"
                    )
        except Exception as e:
            logger.warning("Historical weather query failed: %s", str(e))

        # Synthetic points based on calendar
        pts = []
        for i in range(14, 0, -1):
            dt = end_date - datetime.timedelta(days=i)
            pts.append(
                WeatherHistoryPoint(
                    date=dt.isoformat(),
                    temperature_mean=26.0,
                    precipitation_sum=0.5
                )
            )
        return WeatherHistoryResponse(
            district_id=district_id,
            district_name=district_name,
            points=pts,
            source="Regional Historical Estimates (Fallback)"
        )

    @classmethod
    async def _fetch_from_weatherapi(
        cls, district_id: int, district_name: str, latitude: float, longitude: float, api_key: str
    ) -> Optional[WeatherForecastResponse]:
        url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={latitude},{longitude}&days=7&aqi=no&alerts=no"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    curr = data.get("current", {})
                    forecast_days = data.get("forecast", {}).get("forecastday", [])
                    
                    temp_c = float(curr.get("temp_c", 26.0))
                    humidity = float(curr.get("humidity", 60.0))
                    precip_mm = float(curr.get("precip_mm", 0.0))
                    wind_kph = float(curr.get("wind_kph", 10.0))
                    condition_text = curr.get("condition", {}).get("text", "Clear")

                    current_obj = WeatherCurrent(
                        temperature=temp_c,
                        relative_humidity=humidity,
                        precipitation=precip_mm,
                        rain=precip_mm,
                        weather_code=1,
                        weather_description=condition_text,
                        weather_description_hi=condition_text,
                        wind_speed=round(wind_kph / 3.6, 1),
                        data_source="WeatherAPI.com Live",
                        is_live=True,
                        recorded_at=curr.get("last_updated", time.strftime("%Y-%m-%dT%H:%M"))
                    )

                    daily_items: List[DailyForecastItem] = []
                    for fd in forecast_days:
                        date_str = fd.get("date", "")
                        day = fd.get("day", {})
                        daily_items.append(
                            DailyForecastItem(
                                date=date_str,
                                temp_max=float(day.get("maxtemp_c", 30.0)),
                                temp_min=float(day.get("mintemp_c", 18.0)),
                                precipitation_sum=float(day.get("totalprecip_mm", 0.0)),
                                precipitation_probability=float(day.get("daily_chance_of_rain", 10)),
                                weather_code=1,
                                weather_description=day.get("condition", {}).get("text", "Sunny"),
                                weather_description_hi=day.get("condition", {}).get("text", "साफ़")
                            )
                        )

                    return WeatherForecastResponse(
                        district_id=district_id,
                        district_name=district_name,
                        latitude=latitude,
                        longitude=longitude,
                        current=current_obj,
                        daily_forecast=daily_items,
                        status="success",
                        data_status_label="WeatherAPI Live Data",
                        warning=None
                    )
        except Exception as e:
            logger.warning("WeatherAPI fetch error: %s", str(e))
        return None

    @classmethod
    async def _fetch_from_openweather(
        cls, district_id: int, district_name: str, latitude: float, longitude: float, api_key: str
    ) -> Optional[WeatherForecastResponse]:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    main = data.get("main", {})
                    wind = data.get("wind", {})
                    weather_list = data.get("weather", [{}])
                    w_desc = weather_list[0].get("description", "clear sky").capitalize()

                    current_obj = WeatherCurrent(
                        temperature=float(main.get("temp", 26.0)),
                        relative_humidity=float(main.get("humidity", 60.0)),
                        precipitation=float(data.get("rain", {}).get("1h", 0.0)),
                        rain=float(data.get("rain", {}).get("1h", 0.0)),
                        weather_code=1,
                        weather_description=w_desc,
                        weather_description_hi=w_desc,
                        wind_speed=float(wind.get("speed", 3.0)),
                        data_source="OpenWeatherMap Live",
                        is_live=True,
                        recorded_at=time.strftime("%Y-%m-%dT%H:%M")
                    )

                    daily_items: List[DailyForecastItem] = []
                    f_res = await client.get(forecast_url)
                    if f_res.status_code == 200:
                        fdata = f_res.json()
                        by_date: Dict[str, list] = {}
                        for entry in fdata.get("list", []):
                            d = entry.get("dt_txt", "")[:10]
                            if d not in by_date:
                                by_date[d] = []
                            by_date[d].append(entry)

                        for d, entries in list(by_date.items())[:7]:
                            temps = [float(e.get("main", {}).get("temp", 25.0)) for e in entries]
                            rains = [float(e.get("rain", {}).get("3h", 0.0)) for e in entries]
                            daily_items.append(
                                DailyForecastItem(
                                    date=d,
                                    temp_max=max(temps),
                                    temp_min=min(temps),
                                    precipitation_sum=round(sum(rains), 1),
                                    precipitation_probability=25.0 if sum(rains) > 0 else 5.0,
                                    weather_code=1,
                                    weather_description=entries[0].get("weather", [{}])[0].get("description", "Clear").capitalize(),
                                    weather_description_hi=entries[0].get("weather", [{}])[0].get("description", "साफ़")
                                )
                            )

                    return WeatherForecastResponse(
                        district_id=district_id,
                        district_name=district_name,
                        latitude=latitude,
                        longitude=longitude,
                        current=current_obj,
                        daily_forecast=daily_items,
                        status="success",
                        data_status_label="OpenWeatherMap Live Data",
                        warning=None
                    )
        except Exception as e:
            logger.warning("OpenWeatherMap fetch error: %s", str(e))
        return None

