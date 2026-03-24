import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  CloudSun,
  LocateFixed
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../components/ui/card';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { OPENWEATHER_API_KEY } from '../services/envService.js';


export const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCoordinates = async () => {
    if (!city) {
      toast.error('Enter city name');
      return;
    }
    if (!OPENWEATHER_API_KEY) {
      toast.error('Missing OpenWeather API key (set VITE_OPENWEATHER_API_KEY in .env)');
      return;
    }

    try {
      setIsLoading(true);

      // 1️⃣ Get coordinates using OpenStreetMap
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        toast.error('City not found');
        return;
      }

      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);

      // 2️⃣ Get weather from OpenWeather
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherData = await weatherRes.json();

      if (weatherData.cod !== 200) {
        toast.error(weatherData.message || 'Weather fetch failed');
        return;
      }

      // 3️⃣ Format data
      const formatted = {
        temperature: weatherData.main?.temp,
        humidity: weatherData.main?.humidity,
        windSpeed: weatherData.wind?.speed,
        rainfall: weatherData.rain?.['1h'] ?? 0,
        forecastSummary: weatherData.weather?.[0]?.main,
        city: weatherData.name,
        createdAt: new Date().toISOString(),
        aiSuggestion: null,
        riskLevel: null,
      };

      // 4️⃣ Get AI farming advice from backend (no auth needed)
      try {
        const backendRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/weather/current?lat=${lat}&lng=${lon}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const backendData = await backendRes.json();
        if (backendData.success) {
          formatted.aiSuggestion = backendData.data.aiSuggestion;
          formatted.riskLevel = backendData.data.riskLevel;
        }
      } catch (e) {
        console.error('AI advice fetch failed:', e);
        // Non-blocking — weather still shows even if AI fails
      }

      setWeather(formatted);
      localStorage.setItem(city.toLowerCase(), JSON.stringify(formatted));

    } catch (error) {
      toast.error('Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const normalized = String(condition || '').toLowerCase();
    const iconMap = {
      sunny: Sun,
      clear: Sun,
      'partly cloudy': CloudSun,
      cloudy: Cloud,
      clouds: Cloud,
      rain: CloudRain,
      drizzle: CloudRain
    };
    const Icon = iconMap[normalized] || Cloud;
    return <Icon className="w-16 h-16" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Weather</h1>
        <p className="text-muted-foreground">
          Get current weather insights for your fields
        </p>
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fetch Current Weather</CardTitle>
          <CardDescription>
            Enter your city to pull live weather data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="City Name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetCoordinates()}
            />
            <Button
              onClick={handleGetCoordinates}
              className="gap-2"
              disabled={isLoading}
            >
              <LocateFixed className="w-4 h-4" />
              {isLoading ? 'Fetching...' : 'Fetch'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weather Display */}
      {weather ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">
                Current Weather — {weather.city}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {new Date(weather.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Temperature & Icon */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold mb-2">
                    {weather.temperature !== undefined
                      ? `${weather.temperature}°C`
                      : 'N/A'}
                  </div>
                  <p className="text-2xl text-blue-100">
                    {weather.forecastSummary}
                  </p>
                </div>
                <div className="text-blue-100">
                  {getWeatherIcon(weather.forecastSummary)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-blue-400">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Humidity</p>
                    <p>{weather.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Wind Speed</p>
                    <p>{weather.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Rainfall</p>
                    <p>{weather.rainfall} mm</p>
                  </div>
                </div>
              </div>

              {/* ✅ AI Farming Advice — inside weather card, after stats */}
              {weather.aiSuggestion && (
                <div className="mt-6 pt-6 border-t border-blue-400">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-semibold text-white">
                      🤖 AI Farming Advice
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      weather.riskLevel === 'high'
                        ? 'bg-red-500 text-white'
                        : weather.riskLevel === 'medium'
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-green-400 text-green-900'
                    }`}>
                      {weather.riskLevel?.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm whitespace-pre-line leading-relaxed">
                    {weather.aiSuggestion}
                  </p>
                </div>
              )}

              {/* Loading state for AI advice */}
              {isLoading === false && weather && !weather.aiSuggestion && (
                <div className="mt-6 pt-6 border-t border-blue-400">
                  <p className="text-blue-200 text-sm">
                    ⚠️ AI advice unavailable — backend may be offline
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No weather data available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};