# 🌱 AgriSmart

### AI-Powered Smart Crop Intelligence Platform

🚀 **Live Demo:** https://agri-smart-six-eta.vercel.app/

AgriSmart is a full-stack AI-powered agricultural management platform that helps farmers and buyers make smarter decisions through crop disease detection, market price forecasting, weather intelligence, AI-powered advisory services, and seamless agricultural commerce.

---

## 🎯 Overview

Agriculture remains the backbone of India's economy, yet farmers often struggle with unpredictable weather, crop diseases, fluctuating market prices, and limited access to expert guidance.

AgriSmart addresses these challenges through Artificial Intelligence, Machine Learning, and Real-Time Data Analytics, providing farmers with actionable insights and a digital ecosystem for smarter farming.

---

## ✨ Key Features

### 👨‍🌾 Farmer Portal

* Crop listing and management
* AI-powered disease detection
* Weather-based farming advisories
* Shipment and logistics tracking
* Market price forecasting

### 🛒 Buyer Portal

* Browse available crops
* Place and manage orders
* Track deliveries
* View market intelligence

### 🤖 AI Features

* Plant Disease Detection using MobileNetV2
* Price Prediction using XGBoost
* AI Chatbot powered by Groq LLaMA 3.3 70B
* Weather Risk Assessment

### 📊 Analytics

* Historical market trends
* Commodity price monitoring
* Forecasting dashboard
* State-wise market comparisons

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│      Frontend       │
│ React + Vite + TS   │
└──────────┬──────────┘
           │ REST APIs
           ▼
┌─────────────────────┐
│      Backend        │
│ Node.js + Express   │
│ JWT + MongoDB       │
└──────────┬──────────┘
           │
 ┌─────────┴─────────┐
 ▼                   ▼

ML Server        External APIs
Flask            Open-Meteo
TensorFlow       Groq AI
XGBoost          Cloudinary
```

---

## 🚀 Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts
* Framer Motion
* shadcn/ui

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Cloudinary

### Machine Learning

* Python
* Flask
* TensorFlow / Keras
* MobileNetV2
* XGBoost
* Scikit-learn

### External Services

* Open-Meteo API
* Groq AI
* Cloudinary

---

## 🤖 AI & ML Capabilities

### 🌿 Crop Disease Detection

* MobileNetV2 Transfer Learning Model
* 38+ Plant Disease Classes
* Real-Time Image Analysis
* Treatment Recommendations
* Prevention Guidance

### 📈 Crop Price Prediction

Algorithm: XGBoost Regressor

Performance Metrics:

* R² Score: 0.9975
* Accuracy: 99.75%
* MAE: ₹88.04
* MAPE: 2.82%

Data Sources:

* Agricultural Market Data
* Open-Meteo Historical Weather API
* World Bank Economic Data

### 💬 AI Farming Assistant

Powered by Groq LLaMA 3.3 70B

Provides:

* Crop Recommendations
* Disease Guidance
* Weather Insights
* Market Intelligence
* Farming Best Practices

---

## 📂 Project Structure

```text
AgriSmart/
│
├── agrismart-frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── config/
│
└── ml-server/
    ├── models/
    ├── scripts/
    ├── datasets/
    └── app.py
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/agrismart.git
cd agrismart
```

### Frontend Setup

```bash
cd agrismart-frontend

npm install

npm run dev
```

### Backend Setup

```bash
cd backend

npm install

npm start
```

### ML Server Setup

```bash
cd ml-server

pip install -r requirements.txt

python app.py
```

---

## 🔐 Environment Variables

### Frontend

```env
VITE_API_URL=http://localhost:5000
VITE_ML_API_URL=http://localhost:5001
```

### Backend

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_api_key
```

### ML Server

```env
FLASK_ENV=production

GROQ_API_KEY=your_groq_api_key
```

---

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Weather

```http
GET /api/weather/:location
```

### Prices

```http
GET /api/prices
```

### Chatbot

```http
POST /api/chatbot
```

### Disease Detection

```http
POST /predict
```

### Price Prediction

```http
POST /predict-price
```

---

## 🎯 Project Impact

* Built a complete full-stack agricultural ecosystem for farmers and buyers.
* Integrated AI-based disease detection supporting 38+ plant diseases.
* Developed a high-accuracy crop price prediction model with R² score of 0.9975.
* Processed real-time weather and market data using multiple APIs.
* Implemented secure JWT authentication and role-based access control.
* Designed scalable REST APIs for marketplace, logistics, and AI services.

---

## 🚀 Deployment

### Frontend

Deployed on Vercel:

👉 https://agri-smart-six-eta.vercel.app/

### Backend

Deployable on:

* Railway
* Render
* Fly.io
* AWS EC2

### ML Server

Deployable on:

* Railway
* Render
* VPS

---

## 🔮 Future Enhancements

* Mobile Application
* Soil Health Analysis
* Yield Prediction
* Pest Outbreak Alerts
* Multi-language Support
* Farmer Community Platform
* Government Scheme Integration

---

## 👨‍💻 Contributors

**Chirag Pandey**
Full Stack Developer & AI Enthusiast

---

## 📜 License

Licensed under the MIT License.

---

<div align="center">

### 🌾 Empowering Farmers with AI & Data Intelligence

Built with ❤️ for the future of Indian Agriculture 🇮🇳

</div>
