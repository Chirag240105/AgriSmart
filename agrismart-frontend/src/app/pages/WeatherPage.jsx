import { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, CloudRain, Sun, Wind, Droplets, CloudSun, LocateFixed, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';

const RISK_CONFIG = {
    high:   { color: 'bg-red-100 text-red-700 border-red-200',    icon: AlertTriangle, label: 'High Risk'   },
    medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Info,          label: 'Medium Risk' },
    low:    { color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle,   label: 'Low Risk'    },
};

const getWeatherIcon = (condition) => {
    const c = String(condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
    if (c.includes('cloud')) return Cloud;
    if (c.includes('partly')) return CloudSun;
    return Sun;
};

export const WeatherPage = () => {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { i18n } = useTranslation();

    const handleFetch = async () => {
        if (!city.trim()) {
            toast.error('Enter a city name');
            return;
        }

        setIsLoading(true);
        try {
            // Step 1: geocode city → lat/lng via OpenStreetMap (no API key needed)
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
            );
            const geoData = await geoRes.json();

            if (!geoData.length) {
                toast.error('City not found');
                return;
            }

            const lat = parseFloat(geoData[0].lat);
            const lng = parseFloat(geoData[0].lon);

            // Step 2: call backend — gets OpenWeather data + AI farming advice in user's language
            const lang = i18n.resolvedLanguage || 'en';
            const res = await apiClient.get(`/api/weather/current?lat=${lat}&lng=${lng}&lang=${lang}`);
            const data = res.data?.data;

            if (!data) {
                toast.error('No weather data returned');
                return;
            }

            setWeather({
                city: geoData[0].display_name?.split(',')[0] || city,
                temperature: data.temperature,
                humidity: data.humidity,
                windSpeed: data.windSpeed,
                rainfall: data.rainfall,
                forecastSummary: data.forecastSummary,
                aiSuggestion: data.aiSuggestion,
                riskLevel: data.riskLevel || 'low',
                createdAt: data.createdAt || new Date().toISOString(),
                source: res.data?.source,
            });

            toast.success(`Weather loaded for ${geoData[0].display_name?.split(',')[0] || city}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch weather');
        } finally {
            setIsLoading(false);
        }
    };

    const WeatherIcon = weather ? getWeatherIcon(weather.forecastSummary) : Cloud;
    const riskCfg = weather ? (RISK_CONFIG[weather.riskLevel] || RISK_CONFIG.low) : null;
    const RiskIcon = riskCfg?.icon;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Weather</h1>
                <p className="text-muted-foreground">Live weather with AI farming advice for your fields</p>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Fetch Current Weather</CardTitle>
                    <CardDescription>Enter your city to get live weather and AI-powered farming advice</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            placeholder="e.g. Ludhiana, Punjab"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            className="max-w-sm"
                        />
                        <Button onClick={handleFetch} disabled={isLoading} className="gap-2">
                            <LocateFixed className="w-4 h-4" />
                            {isLoading ? 'Fetching...' : 'Fetch'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Weather Display */}
            {weather ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Main weather card */}
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white text-2xl">{weather.city}</CardTitle>
                                    <CardDescription className="text-blue-100">
                                        {new Date(weather.createdAt).toLocaleString()}
                                        {weather.source === 'simulated' && (
                                            <span className="ml-2 text-xs bg-blue-400/40 px-2 py-0.5 rounded">simulated</span>
                                        )}
                                    </CardDescription>
                                </div>
                                <WeatherIcon className="w-16 h-16 text-blue-100" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-6xl font-bold mb-1">{weather.temperature}°C</div>
                            <p className="text-xl text-blue-100 capitalize mb-6">{weather.forecastSummary}</p>

                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-400">
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
                                        <p className="text-sm text-blue-100">Wind</p>
                                        <p className="font-semibold">{weather.windSpeed} m/s</p>
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
                        </CardContent>
                    </Card>

                    {/* AI Farming Advice */}
                    {weather.aiSuggestion && (
                        <Card className={`border ${riskCfg.color}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <RiskIcon className="w-5 h-5" />
                                        AI Farming Advice
                                    </CardTitle>
                                    <Badge className={riskCfg.color}>{riskCfg.label}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm whitespace-pre-line leading-relaxed">
                                    {weather.aiSuggestion}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Enter a city above to get weather and farming advice</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
