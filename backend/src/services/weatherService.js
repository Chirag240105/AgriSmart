import axios from "axios";
import Groq from "groq-sdk";

const OPEN_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildSimulatedWeather = ({ lat, lng }) => {
  const seed = Math.abs(Math.round((lat + lng) * 1000));
  return {
    temperature: 20 + (seed % 12),
    humidity: 45 + (seed % 40),
    rainfall: (seed % 5) * 0.6,
    windSpeed: 2 + (seed % 8),
    forecastSummary: "Simulated clear-to-cloudy conditions",
    source: "simulated",
  };
};

export const fetchCurrentWeather = async ({ lat, lng }) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return buildSimulatedWeather({ lat, lng });

  const response = await axios.get(OPEN_WEATHER_URL, {
    params: { lat, lon: lng, appid: apiKey, units: "metric" },
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

export const deriveWeatherRiskSuggestion = async ({ temperature, humidity, rainfall, windSpeed, forecastSummary, city, lang = 'en' }) => {
  try {
    const langInstruction = lang !== 'en'
      ? `IMPORTANT: Respond entirely in the language with code "${lang}". hi=Hindi, pa=Punjabi, ta=Tamil, te=Telugu, mr=Marathi.`
      : 'Respond in English.';

    const prompt = `Current weather in ${city || "India"}:
- Temperature: ${temperature}°C ${temperature > 38 ? '(VERY HOT)' : temperature < 10 ? '(COLD)' : ''}
- Humidity: ${humidity}% ${humidity > 80 ? '(HIGH - fungal risk)' : humidity < 30 ? '(DRY)' : ''}
- Rainfall: ${rainfall}mm ${rainfall > 10 ? '(HEAVY RAIN)' : rainfall > 0 ? '(LIGHT RAIN)' : '(NO RAIN)'}
- Wind: ${windSpeed} m/s
- Condition: ${forecastSummary}

Give 4 specific bullet points for Indian farmers based on THESE exact values:
1. Irrigation: needed today given rainfall=${rainfall}mm?
2. Pest/disease risk at humidity=${humidity}% and ${temperature}°C?
3. Field operations safe? (spraying/harvesting given wind=${windSpeed}m/s)
4. Any urgent warning for these conditions?

Each point under 15 words. ${langInstruction}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert agricultural advisor for Indian farmers. Give concise, practical advice based on the exact weather values provided.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const advice = response.choices[0].message.content;

    let riskLevel = "low";
    if (temperature >= 38 || rainfall >= 30 || windSpeed >= 14) riskLevel = "high";
    else if (temperature >= 33 || rainfall >= 15 || windSpeed >= 10) riskLevel = "medium";

    return {
      riskLevel,
      aiSuggestion: advice,
    };
  } catch (error) {
    console.error("Weather AI advice error:", error.message);

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
  }
};