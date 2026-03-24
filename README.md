# 🌾 AgriSmart - AI-Based Agricultural Management System

An intelligent agricultural management platform powered by AI/ML, providing crop disease detection, price prediction, weather forecasting, and agricultural advisory services.

## 🚀 Features

### 1. **Crop Disease Detection**
- AI-powered plant disease identification using MobileNetV2
- 38+ disease classifications across multiple crops
- Real-time image analysis with confidence scores
- Treatment and prevention recommendations

### 2. **Price Prediction (ML)**
- **99.75% accuracy** using XGBoost Regressor
- Real-time price forecasting for 6 major crops
- Historical price analysis and trends
- Market intelligence across 890+ markets in India

### 3. **Weather Integration**
- Real-time weather data from Open-Meteo API
- 7-day weather forecasts
- Agricultural weather advisories
- Location-based weather insights

### 4. **AI Chatbot**
- Powered by Groq LLaMA 3.3 70B
- Agricultural expert advice
- Crop management guidance
- Pest and disease consultation

### 5. **Market Intelligence**
- Live commodity prices
- Market trends and analysis
- State-wise price comparisons
- Historical price data

## 🏗️ Architecture

```
AgriSmart/
├── agrismart-frontend/    # React + Vite frontend
├── backend/               # Node.js + Express API
└── ml-server/            # Python Flask ML server
```

### Technology Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS + shadcn/ui
- React Router v6
- Axios for API calls

**Backend:**
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- RESTful API

**ML Server:**
- Python 3.9+
- Flask + Flask-CORS
- TensorFlow/Keras (Disease Detection)
- XGBoost (Price Prediction)
- scikit-learn

## 📊 ML Model Performance

### Price Prediction Model
- **Algorithm:** XGBoost Regressor
- **Accuracy:** 99.75% (R² = 0.9975)
- **MAE:** ₹88.04
- **MAPE:** 2.82%
- **Data Sources:** 100% Real APIs
  - Weather: Open-Meteo Historical API
  - Inflation: World Bank API
  - Prices: Agricultural Market Data

### Disease Detection Model
- **Algorithm:** MobileNetV2 (Transfer Learning)
- **Classes:** 38 plant diseases
- **Dataset:** PlantVillage
- **Accuracy:** 95%+

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- MongoDB
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/agrismart.git
cd agrismart
```

### 2. Frontend Setup
```bash
cd agrismart-frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI and API keys
npm start
```

### 4. ML Server Setup
```bash
cd ml-server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with API keys
python app.py
```

## 🔑 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_ML_API_URL=http://localhost:5001
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrismart
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_weather_api_key
```

### ML Server (.env)
```env
GROQ_API_KEY=your_groq_api_key
FLASK_ENV=production
```

## 📡 API Endpoints

### Backend API (Port 5000)
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
GET    /api/weather/:location      - Weather data
GET    /api/prices                 - Commodity prices
POST   /api/chatbot                - AI chatbot
```

### ML Server API (Port 5001)
```
GET    /health                     - Health check
POST   /predict                    - Disease detection
POST   /predict-price              - Price prediction
```

## 🤖 ML Pipeline (Price Prediction)

### Data Pipeline
```bash
cd ml-server

# Step 1: Clean price data
python scripts/clean_price_data.py

# Step 2: Fetch real weather data (Open-Meteo API)
python scripts/fetch_weather_real.py

# Step 3: Fetch real inflation data (World Bank API)
python scripts/fetch_inflation_real.py

# Step 4 & 5: Merge all data
python scripts/merge_real_data.py

# Step 6: Feature engineering
python scripts/feature_engineer_real.py

# Step 7: Train model
python train_price_model_real.py
```

### Supported Crops
- Potato
- Onion
- Wheat
- Rice
- Maize
- Tomato

## 🧪 Testing

### Test Price Prediction API
```bash
cd ml-server
python test_price_api.py
```

### Test Disease Detection
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "your_image_url"}'
```

## 📈 Model Training Details

### Features Used (18 total)
- **Lag Features:** lag_1, lag_2, lag_3
- **Rolling Averages:** rolling_mean_2, rolling_mean_3
- **Weather Data:** temperature, rainfall (Open-Meteo API)
- **Economic Data:** inflation_rate (World Bank API)
- **Categorical:** commodity, state, market (encoded)
- **Temporal:** day_of_week, day_of_month, week_of_year
- **Derived:** price_range, price_volatility, min_price, max_price

### Top Feature Importance
1. max_price (47.63%)
2. min_price (31.92%)
3. rolling_mean_2 (15.29%)
4. lag_1 (2.38%)
5. temperature - Real API data (0.30%)

## 🌐 Deployment

### Frontend (Vercel/Netlify)
```bash
cd agrismart-frontend
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd backend
# Add Procfile: web: node src/server.js
git push heroku main
```

### ML Server (Railway/Render)
```bash
cd ml-server
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## 📚 Documentation

- [API Usage Guide](ml-server/API_USAGE.txt)
- [ML Pipeline Summary](ml-server/PIPELINE_SUMMARY.txt)
- [Quick Start Guide](ml-server/QUICK_START.txt)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- PlantVillage Dataset for disease detection
- Open-Meteo for weather data API
- World Bank for inflation data API
- Groq for LLaMA 3.3 70B API
- shadcn/ui for UI components

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Soil health analysis
- [ ] Crop yield prediction
- [ ] Irrigation management
- [ ] Pest outbreak alerts
- [ ] Multi-language support
- [ ] Farmer community forum
- [ ] Government scheme integration

## 📊 Project Status

🟢 **Active Development** - Version 1.0.0

---

**Made with ❤️ for Indian Farmers**
