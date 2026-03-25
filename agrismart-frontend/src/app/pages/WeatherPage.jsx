import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  CloudSun,
  LocateFixed,
  Sprout
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
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { OPENWEATHER_API_KEY } from '../services/envService.js';

const COMMON_CROPS = [
  'Wheat', 'Rice', 'Maize', 'Mustard', 'Potato',
  'Onion', 'Tomato', 'Sugarcane', 'Cotton', 'Soybean'
];

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month >= 11 || month <= 3) return 'Rabi';
  return 'Zaid';
};

export const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Crop-specific AI advice state
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [cropAdvice, setCropAdvice] = useState('');
  const [loadingCropAdvice, setLoadingCropAdvice] = useState(false);

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
      setCropAdvice('');

      // 1. Get coordinates using OpenStreetMap
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

      // 2. Get weather from OpenWeather
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherData = await weatherRes.json();

      if (weatherData.cod !== 200) {
        toast.error(weatherData.message || 'Weather fetch failed');
        return;
      }

      // 3. Format data
      const formatted = {
        temperature: weatherData.main?.temp,
        humidity: weatherData.main?.humidity,
        windSpeed: weatherData.wind?.speed,
        rainfall: weatherData.rain?.['1h'] ?? 0,
        forecastSummary: weatherData.weather?.[0]?.main,
        city: weatherData.name,
        lat,
        lon,
        createdAt: new Date().toISOString(),
        aiSuggestion: null,
        riskLevel: null,
      };

      // 4. Get general AI farming advice from backend
      try {
        const backendRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/weather/current?lat=${lat}&lng=${lon}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const backendData = await backendRes.json();
        if (backendData.success) {
          formatted.aiSuggestion = backendData.data.aiSuggestion;
          formatted.riskLevel = backendData.data.riskLevel;
        }
      } catch (e) {
        console.error('AI advice fetch failed:', e);
        // Non-blocking
      }

      setWeather(formatted);
      localStorage.setItem(city.toLowerCase(), JSON.stringify(formatted));

    } catch (error) {
      toast.error('Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  };

  // Crop-specific advice using the same backend endpoint but with crop context
  const getCropSpecificAdvice = async () => {
    if (!weather || selectedCrops.length === 0) {
      toast.error('Select at least one crop first');
      return;
    }

    setLoadingCropAdvice(true);
    setCropAdvice('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/weather/crop-advice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
            windSpeed: weather.windSpeed,
            condition: weather.forecastSummary,
            location: weather.city,
            crops: selectedCrops,
            season: getCurrentSeason(),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setCropAdvice(data.advice);
      } else {
        toast.error('Could not get crop advice');
      }
    } catch (err) {
      toast.error('Crop advice request failed');
    } finally {
      setLoadingCropAdvice(false);
    }
  };

  const toggleCrop = (crop) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const getWeatherIcon = (condition) => {
    const normalized = String(condition || '').toLowerCase();
    const iconMap = {
      sunny: Sun, clear: Sun,
      'partly cloudy': CloudSun, cloudy: Cloud, clouds: Cloud,
      rain: CloudRain, drizzle: CloudRain
    };
    const Icon = iconMap[normalized] || Cloud;
    return <Icon className="w-16 h-16" />;
  };

  const riskBadgeClass = (level) => {
    if (level === 'high') return 'bg-red-500 text-white';
    if (level === 'medium') return 'bg-yellow-400 text-yellow-900';
    return 'bg-green-400 text-green-900';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Weather</h1>
        <p className="text-muted-foreground">
          Get current weather insights and AI crop advice for your fields
        </p>
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fetch Current Weather</CardTitle>
          <CardDescription>Enter your city to pull live weather data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="City Name (e.g. Lucknow)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetCoordinates()}
            />
            <Button onClick={handleGetCoordinates} className="gap-2" disabled={isLoading}>
              <LocateFixed className="w-4 h-4" />
              {isLoading ? 'Fetching...' : 'Fetch Weather'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weather Display */}
      {weather ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Main Weather Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">
                Current Weather — {weather.city}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {new Date(weather.createdAt).toLocaleString()} · {getCurrentSeason()} Season
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Temperature & Icon */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold mb-2">
                    {weather.temperature !== undefined ? `${weather.temperature}°C` : 'N/A'}
                  </div>
                  <p className="text-2xl text-blue-100">{weather.forecastSummary}</p>
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
                    <p className="font-semibold">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Wind Speed</p>
                    <p className="font-semibold">{weather.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Rainfall</p>
                    <p className="font-semibold">{weather.rainfall} mm</p>
                  </div>
                </div>
              </div>

              {/* General AI Advice */}
              {weather.aiSuggestion && (
                <div className="mt-6 pt-6 border-t border-blue-400">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-semibold text-white">🤖 AI Farming Advice</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskBadgeClass(weather.riskLevel)}`}>
                      {weather.riskLevel?.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm whitespace-pre-line leading-relaxed">
                    {weather.aiSuggestion}
                  </p>
                </div>
              )}

              {!isLoading && weather && !weather.aiSuggestion && (
                <div className="mt-6 pt-6 border-t border-blue-400">
                  <p className="text-blue-200 text-sm">
                    ⚠️ General AI advice unavailable — backend may be offline
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crop-Specific AI Advice Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                Crop-Specific AI Advice
              </CardTitle>
              <CardDescription>
                Select your crops to get tailored advice based on today's weather
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Crop Toggle Buttons */}
              <div className="flex flex-wrap gap-2">
                {COMMON_CROPS.map(crop => (
                  <button
                    key={crop}
                    onClick={() => toggleCrop(crop)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                      selectedCrops.includes(crop)
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>

              {selectedCrops.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-green-700">{selectedCrops.join(', ')}</span>
                </p>
              )}

              <Button
                onClick={getCropSpecificAdvice}
                disabled={loadingCropAdvice || selectedCrops.length === 0}
                className="w-full bg-green-700 hover:bg-green-800 gap-2"
              >
                {loadingCropAdvice ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analyzing for {selectedCrops.join(', ')}...
                  </>
                ) : (
                  <>🌾 Get Crop-Specific Advice</>
                )}
              </Button>

              {/* Crop Advice Output */}
              {cropAdvice && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-semibold text-green-800">🤖 Advice for {selectedCrops.join(', ')}</span>
                    <span className="ml-auto text-xs text-gray-400">Groq LLaMA 3.3</span>
                  </div>
                  <div className="text-sm leading-relaxed space-y-1 text-gray-700">
                    {cropAdvice.split('\n').map((line, i) => (
                      <p
                        key={i}
                        className={line.match(/^\*\*|^\d\./) ? 'font-semibold text-green-800 mt-2' : ''}
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No weather data available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};