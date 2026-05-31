import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { priceService } from '../services/api';
import { toast } from 'sonner';

const CROPS = [
    'Wheat', 'Rice', 'Maize', 'Potato', 'Onion', 'Tomato',
    'Soybean', 'Cotton', 'Sugarcane', 'Mustard', 'Gram', 'Chilli',
];

const STATES = [
    'Punjab', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Maharashtra',
    'Karnataka', 'Andhra Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Bihar',
    'Gujarat', 'Tamil Nadu',
];

const CROP_EMOJI = {
    Wheat: '🌾', Rice: '🍚', Maize: '🌽', Potato: '🥔',
    Onion: '🧅', Tomato: '🍅',
};

const TREND_CONFIG = {
    increase: { icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50',  label: 'Rising'  },
    decrease: { icon: TrendingDown, color: 'text-red-600',   bg: 'bg-red-50',    label: 'Falling' },
    stable:   { icon: Minus,        color: 'text-gray-500',  bg: 'bg-gray-50',   label: 'Stable'  },
};

export const PricesPage = () => {
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({
        crop: 'Wheat',
        state: 'Punjab',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        rainfall_mm: 100,
        temperature_c: 30,
        demand_index: 1.0,
        inflation_rate: 5.5,
    });
    const [prediction, setPrediction] = useState(null);
    const [loadingPredict, setLoadingPredict] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await priceService.getLatestPrices(undefined, 12);
                const mapped = (response.data?.data || []).map((record) => {
                    const history = record.historicalPrices || [];
                    const oldest  = history[0]?.price || record.predictedPrice || 0;
                    const newest  = record.predictedPrice || 0;
                    const change  = oldest ? ((newest - oldest) / oldest) * 100 : 0;
                    const trend   = record.trend === 'increase' ? 'increase'
                                  : record.trend === 'decrease' ? 'decrease'
                                  : 'stable';
                    return {
                        id: record._id,
                        product: record.cropName || 'Unknown',
                        currentPrice: Number(record.predictedPrice || 0),
                        unit: record.unit || 'quintal',
                        trend,
                        change: Number(change.toFixed(1)),
                        insights: record.insights || '',
                        confidence: record.confidence || null,
                        historicalPrices: history,
                    };
                });
                setPrices(mapped);
            } catch (error) {
                toast.error('Failed to load prices. Is the ML server running?');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const chartData = useMemo(() => {
        // Deduplicate by product name, keep first occurrence
        const seen = new Set();
        const unique = prices.filter((p) => {
            if (seen.has(p.product)) return false;
            seen.add(p.product);
            return true;
        });
        const series = unique.slice(0, 3);
        if (!series.length) return [];

        const labelSet = new Set();
        series.forEach((item) =>
            (item.historicalPrices || []).forEach((p) =>
                labelSet.add(new Date(p.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }))
            )
        );
        return Array.from(labelSet).map((label) => {
            const entry = { month: label };
            series.forEach((item) => {
                const point = (item.historicalPrices || []).find(
                    (p) => new Date(p.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) === label
                );
                entry[item.product] = point?.price ?? null;
            });
            return entry;
        });
    }, [prices]);

    const handlePredict = async () => {
        setLoadingPredict(true);
        setPrediction(null);
        try {
            const res = await priceService.predictPrice(form);
            if (res.data?.success) {
                setPrediction(res.data.data);
                toast.success('Prediction ready!');
            } else {
                toast.error(res.data?.message || 'Prediction failed');
            }
        } catch (err) {
            toast.error('ML server unreachable. Is it running on port 5001?');
        } finally {
            setLoadingPredict(false);
        }
    };

    const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground">Fetching ML predictions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Market Prices</h1>
                <p className="text-muted-foreground">ML-powered price predictions &mdash; XGBoost model &mdash; Updated live</p>
            </div>

            {/* Price Cards */}
            {prices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No price data. Make sure the ML server is running:
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">python ml-server/app.py</code>
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prices.map((price, index) => {
                        const cfg = TREND_CONFIG[price.trend] || TREND_CONFIG.stable;
                        const Icon = cfg.icon;
                        return (
                            <motion.div
                                key={price.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.07 }}
                            >
                                <Card className="hover:shadow-lg transition-all">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-2xl">{CROP_EMOJI[price.product] || '🌿'}</span>
                                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                <Icon className="w-3 h-3" />
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold">{price.product}</h3>
                                        <p className="text-xs text-muted-foreground mb-3">per {price.unit}</p>
                                        <div className="text-3xl font-bold text-green-700 mb-2">
                                            INR {price.currentPrice.toLocaleString('en-IN')}
                                        </div>
                                        {price.confidence && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className="bg-green-500 h-1.5 rounded-full"
                                                        style={{ width: `${price.confidence * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {Math.round(price.confidence * 100)}% confidence
                                                </span>
                                            </div>
                                        )}
                                        {price.insights && (
                                            <p className="text-xs text-muted-foreground leading-relaxed">{price.insights}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Price Trends Chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Price Trends (Last 6 Months)</CardTitle>
                        <CardDescription>Historical price movement for top 3 crops</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(v) => `INR ${v}`} />
                                <Tooltip formatter={(v) => [`INR ${v}`, '']} />
                                <Legend />
                        {(() => {
                            const seen = new Set();
                            const unique = prices.filter((p) => {
                                if (seen.has(p.product)) return false;
                                seen.add(p.product);
                                return true;
                            }).slice(0, 3);
                            return unique.map((item, idx) => (
                                <Line
                                    key={item.id}
                                    type="monotone"
                                    dataKey={item.product}
                                    stroke={['#16a34a', '#84cc16', '#f59e0b'][idx]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    connectNulls
                                />
                            ));
                        })()}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Custom Price Prediction Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-green-600" />
                        Custom Price Prediction
                    </CardTitle>
                    <CardDescription>Enter your crop details to get a tailored ML price forecast</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Crop</label>
                            <select
                                value={form.crop}
                                onChange={(e) => updateForm('crop', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {CROPS.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                            <select
                                value={form.state}
                                onChange={(e) => updateForm('state', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {STATES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Month</label>
                            <select
                                value={form.month}
                                onChange={(e) => updateForm('month', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
                            <select
                                value={form.year}
                                onChange={(e) => updateForm('year', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Rainfall (mm)</label>
                            <input
                                type="number"
                                value={form.rainfall_mm}
                                onChange={(e) => updateForm('rainfall_mm', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Temperature (&deg;C)</label>
                            <input
                                type="number"
                                value={form.temperature_c}
                                onChange={(e) => updateForm('temperature_c', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handlePredict}
                        disabled={loadingPredict}
                        className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loadingPredict ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Running ML model...
                            </>
                        ) : 'Predict Price'}
                    </button>

                    {prediction && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-lg p-5 border ${
                                prediction.trend === 'increase' ? 'bg-green-50 border-green-200'
                                : prediction.trend === 'decrease' ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Predicted Price</p>
                                    <p className="text-4xl font-bold text-green-700">
                                        INR {prediction.predicted_price?.toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">per quintal &mdash; {prediction.season} season</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                        prediction.trend === 'increase' ? 'bg-green-100 text-green-700'
                                        : prediction.trend === 'decrease' ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {prediction.trend === 'increase' ? 'Rising'
                                        : prediction.trend === 'decrease' ? 'Falling'
                                        : 'Stable'}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {Math.round((prediction.confidence || 0) * 100)}% confidence
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{prediction.insights}</p>
                            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Rainfall</p>
                                    <p className="text-sm font-semibold">{prediction.factors?.rainfall_mm}mm</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Temperature</p>
                                    <p className="text-sm font-semibold">{prediction.factors?.temperature_c}&deg;C</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Weather Risk</p>
                                    <p className="text-sm font-semibold">{prediction.factors?.weather_risk?.toFixed(1)}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
