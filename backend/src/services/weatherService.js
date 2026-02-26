import axios from "axios";

const OPEN_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildSimulatedWeather = ({ lat, lng }) => {
  const seed = Math.abs(Math.round((lat + lng) * 1000));
  const temperature = 20 + (seed % 12);
  const humidity = 45 + (seed % 40);
  const rainfall = (seed % 5) * 0.6;
  const windSpeed = 2 + (seed % 8);

  return {
    temperature,
    humidity,
    rainfall,
    windSpeed,
    forecastSummary: "Simulated clear-to-cloudy conditions",
    source: "simulated",
  };
};

export const fetchCurrentWeather = async ({ lat, lng }) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return buildSimulatedWeather({ lat, lng });
  }

  const response = await axios.get(OPEN_WEATHER_URL, {
    params: {
      lat,
      lon: lng,
      appid: apiKey,
      units: "metric",
    },
    timeout: 10000,
  });

  const data = response.data || {};
  return {
    temperature: toNumber(data?.main?.temp, 0),
    humidity: toNumber(data?.main?.humidity, 0),
    rainfall: toNumber(data?.rain?.["1h"], 0),
    windSpeed: toNumber(data?.wind?.speed, 0),
    forecastSummary: data?.weather?.[0]?.description || "No summary",
    source: "openweather",
  };
};

export const deriveWeatherRiskSuggestion = ({ temperature, rainfall, windSpeed }) => {
  // TODO(ai-model): Replace this heuristic with your weather risk ML model output.
  if (temperature >= 38 || rainfall >= 30 || windSpeed >= 14) {
    return {
      riskLevel: "high",
      aiSuggestion: "High weather risk. Avoid spraying and secure harvested produce.",
    };
  }

  if (temperature >= 33 || rainfall >= 15 || windSpeed >= 10) {
    return {
      riskLevel: "medium",
      aiSuggestion: "Moderate weather risk. Monitor field conditions in shorter intervals.",
    };
  }

  return {
    riskLevel: "low",
    aiSuggestion: "Weather conditions are stable for routine farming activities.",
  };
};
