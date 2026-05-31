import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: fetch weather from Open-Meteo using lat/lng
const fetchOpenMeteoWeather = async (lat, lng) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const c = data.current;
  return {
    temperature: c.temperature_2m,
    humidity:    c.relative_humidity_2m,
    rainfall:    c.precipitation,
    windSpeed:   c.wind_speed_10m,
    weatherCode: c.weather_code,
  };
};

// Helper: determine risk level
const getRiskLevel = (temperature, humidity, rainfall) => {
  if (rainfall > 20 || temperature > 42 || temperature < 5 || humidity > 90) return 'high';
  if (rainfall > 5  || temperature > 38 || humidity > 75)                    return 'medium';
  return 'low';
};

// ─────────────────────────────────────────────────────
// GET /api/weather/current?lat=xx&lng=yy
// Auto-called when city is fetched in WeatherPage
// ─────────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const weatherData = await fetchOpenMeteoWeather(lat, lng);
    const { temperature, humidity, rainfall, windSpeed } = weatherData;

    const lang = req.query.lang || 'en';
    const langInstruction = lang !== 'en'
      ? `IMPORTANT: Respond entirely in the language with code "${lang}". hi=Hindi, pa=Punjabi, ta=Tamil, te=Telugu, mr=Marathi.`
      : 'Respond in English.';

    const prompt = `You are an expert agricultural advisor for Indian farmers.

Current weather:
- Temperature: ${temperature}°C ${temperature > 38 ? '(VERY HOT)' : temperature < 10 ? '(COLD)' : ''}
- Humidity: ${humidity}% ${humidity > 80 ? '(HIGH - fungal risk)' : humidity < 30 ? '(LOW - dry)' : ''}
- Rainfall last hour: ${rainfall}mm ${rainfall > 10 ? '(HEAVY)' : rainfall > 0 ? '(LIGHT RAIN)' : '(NO RAIN)'}
- Wind: ${windSpeed} km/h ${windSpeed > 20 ? '(STRONG)' : ''}

Give specific advice for THESE exact conditions:
1. Irrigation: needed today? (rainfall is ${rainfall}mm, humidity ${humidity}%)
2. Disease/pest risk at ${humidity}% humidity and ${temperature}°C
3. One action to take right now

Under 80 words. ${langInstruction}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are AgriSmart AI, an agricultural advisor for Indian farmers. Give short, actionable advice based on weather data.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const aiSuggestion = completion.choices[0]?.message?.content?.trim() || 'No advice available.';
    const riskLevel    = getRiskLevel(temperature, humidity, rainfall);

    res.json({
      success: true,
      data: {
        aiSuggestion,
        riskLevel,
        weatherSnapshot: { temperature, humidity, rainfall, windSpeed },
      }
    });

  } catch (error) {
    console.error('Weather advice error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to generate weather advice' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/weather/crop-advice
// Called when user selects crops and clicks button
// ─────────────────────────────────────────────────────
router.post('/crop-advice', async (req, res) => {
  try {
    const {
      temperature, humidity, rainfall, windSpeed,
      condition, location, crops, season
    } = req.body;

    if (!crops || crops.length === 0) {
      return res.status(400).json({ success: false, error: 'crops array is required' });
    }
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ success: false, error: 'temperature and humidity are required' });
    }

    const prompt = `You are an expert agricultural advisor for Indian farmers.

Current weather in ${location || 'India'} (${season || 'current'} season):
- Temperature: ${temperature}°C
- Humidity: ${humidity}%
- Rainfall (last hour): ${rainfall ?? 0}mm
- Wind Speed: ${windSpeed ?? 0} km/h
- Condition: ${condition || 'N/A'}

The farmer grows: ${crops.join(', ')}

Give specific advice for EACH crop listed. For each crop cover:
1. Irrigation needed today? (yes/no and why)
2. Any disease or pest risk given these conditions?
3. One action to take today

Keep total response under 150 words. Be direct. Use simple language.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are AgriSmart AI, an agricultural advisor for Indian farmers. Give concise, crop-specific advice based on weather conditions.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const advice = completion.choices[0]?.message?.content?.trim();
    if (!advice) {
      return res.status(500).json({ success: false, error: 'No advice generated' });
    }

    res.json({ success: true, advice });

  } catch (error) {
    console.error('Crop advice error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to generate crop advice' });
  }
});

export default router;