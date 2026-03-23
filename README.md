<div align="center">

# 🌱 AgriSmart
### Smart Crop Intelligence System

**A full-stack agriculture platform connecting farmers and buyers with AI-powered crop management, live market prices, weather insights, disease detection, and smart order logistics.**
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Role-Based Access](#-role-based-access)
- [Design System](#-design-system)
- [Deployment](#-deployment)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🌾 Overview

AgriSmart is a monorepo full-stack web platform built for the agricultural ecosystem. Farmers can list crops, monitor weather risks, detect plant diseases, and manage shipments. Buyers can browse listings, place orders, and track deliveries — all in one seamless interface.

The backend runs a **Smart Crop Intelligence System (SCIS)** powered by Node/Express with MongoDB, featuring a live price simulation stream, rule-based chatbot, and stubbed AI hooks ready for real model integrations.

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 **Authentication** | JWT auth with role-based guards (`farmer` / `buyer`) |
| 🌾 **Crop Management** | Full CRUD, image uploads via Cloudinary, status tracking |
| 📦 **Order Management** | Place, track, and update orders with buyer–seller linking |
| 🚚 **Shipment Tracking** | Timeline-based delivery tracking with Pathway hooks (placeholder) |
| ☁️ **Weather Forecasts** | OpenWeather integration with AI risk heuristics & simulated fallback |
| 📈 **Market Prices** | Live price simulation stream (auto-ticks every 5s), historical trends |
| 🔬 **Disease Detection** | Image-based crop health analysis (stub, ready for model swap) |
| 🤖 **AI Chatbot** | Rule-based farming assistant (ready for LLM integration) |
| 👤 **User Profiles** | Profile management, avatar upload, account statistics |

---

## 🚀 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI library |
| TypeScript | 5 | Type safety |
| Vite | 6.3 | Build tool |
| Tailwind CSS | 4.1 | Styling |
| React Router | 7.13 | Navigation |
| Context API | — | State management |
| Radix UI | latest | Accessible components |
| Lucide React | latest | Icons |
| Recharts | latest | Charts & graphs |
| Motion (Framer) | latest | Animations |
| Sonner | latest | Toast notifications |
| Axios | 1.13 | HTTP client |

### Backend

| Technology | Purpose |
|---|---|
| Node.js ≥ 18 + Express 5 | Server & API (ES modules) |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication & authorization |
| Multer + Cloudinary | In-memory file handling + cloud storage |
| Axios | External API calls (OpenWeather) |

---

## 📂 Project Structure

```
agrismart/
│
├── frontend/                        # React + TypeScript client
│   └── src/
│       ├── app/
│       │   ├── components/          # Reusable UI components
│       │   │   ├── ui/
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   ├── layouts/
│       │   │   └── DashboardLayout.tsx
│       │   ├── pages/               # Route-level pages
│       │   │   ├── LandingPage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── SignupPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── CropsPage.tsx
│       │   │   ├── OrdersPage.tsx
│       │   │   ├── ShipmentsPage.tsx
│       │   │   ├── WeatherPage.tsx
│       │   │   ├── PricesPage.tsx
│       │   │   ├── DiseasePage.tsx
│       │   │   ├── ChatbotPage.tsx
│       │   │   ├── ProfilePage.tsx
│       │   │   └── NotFoundPage.tsx
│       │   ├── services/
│       │   │   ├── api.ts           # Axios client & service methods
│       │   │   └── mockData.ts      # Demo fallback data
│       │   ├── App.tsx
│       │   └── routes.tsx
│       └── styles/
│           ├── index.css
│           ├── tailwind.css
│           ├── theme.css
│           └── fonts.css
│
└── backend/                         # Node.js + Express API
    ├── app.js                       # App entry, CORS, routes, price stream
    └── src/
        ├── config/                  # DB, env, Cloudinary, Pathway placeholders
        ├── controllers/             # Route handlers (auth, crops, orders…)
        ├── middlewares/             # JWT protect, role authorize, file filter
        ├── models/                  # Mongoose schemas
        │   └── User, Crop, Order, Shipment, Price, Alert, Weather, CropHealth
        ├── routes/                  # Express route definitions (/api/*)
        └── services/
            ├── weatherService.js    # OpenWeather fetch + risk heuristics
            ├── priceStreamService.js# Simulated live price ticker
            ├── diseaseService.js    # Detection stub (swap with real model)
            └── chatbotService.js    # Rule-based replies (swap with LLM)
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js ≥ 18 and npm
- MongoDB URI (local or Atlas)
- Cloudinary account (for image uploads)
- OpenWeather API key *(optional — simulated values used if absent)*

### Frontend

```bash
cd frontend
npm install          # or: pnpm install
cp .env.example .env # set VITE_API_URL
npm run dev          # http://localhost:5173
npm run build        # production build → /dist
```

### Backend

```bash
cd backend
npm install
cp .env.example .env  # fill in values (see below)
npm run dev           # nodemon, default port 5000
```

Health check: `GET http://localhost:5000/api/health`

---

## 🔑 Environment Variables

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

### Backend — `backend/.env`

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/agrismart
PORT=5000
JWT_SECRET_KEY=change-me-in-production

# Cloudinary (required for image uploads)
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret

# OpenWeather (optional — simulated fallback used if absent)
OPENWEATHER_API_KEY=your-openweather-key
```

> ⚠️ Never commit `.env` files. Add them to `.gitignore`.

---

## 🔌 API Reference

All routes are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <token>
```

### Auth *(public)*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register — multipart: name, email, password, role, profileImage |
| `POST` | `/auth/login` | Login, returns JWT |

### Users *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Get current user profile |
| `PATCH` | `/users/me` | Update profile details |
| `PATCH` | `/users/upload-profile` | Upload avatar (multipart) |

### Crops *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/crops` | Farmer: own crops · Others: available listings |
| `GET` | `/crops/:id` | Get crop by ID |
| `POST` | `/crops` | Create crop *(farmer only)* |
| `PUT` | `/crops/:id` | Update crop *(farmer owner)* |
| `DELETE` | `/crops/:id` | Delete crop *(farmer owner)* |

### Orders *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/orders` | Buyer: own orders · Farmer: orders for their crops |
| `GET` | `/orders/:id` | Get order by ID |
| `POST` | `/orders` | Place order *(buyer only)* |
| `PATCH` | `/orders/:id/status` | Update order status *(buyer)* |

### Shipments *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/shipments` | List shipments |
| `GET` | `/shipments/:id` | Get shipment details |
| `POST` | `/shipments` | Create shipment *(farmer)* |
| `PATCH` | `/shipments/:id/status` | Update status *(farmer)* |

### Weather *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/weather/current?lat=&lng=` | Current conditions + AI risk heuristic |
| `GET` | `/weather/latest` | Latest stored weather reading |

### Prices *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/prices?cropName=&limit=` | Price history with optional filters |
| `POST` | `/prices/simulate-tick` | Manually trigger a price update |

> 🔄 Automatic price stream ticks every **5 seconds** on server start. Stop it via `stopPriceStream()` in `src/services/priceStreamService.js` if needed.

### Disease Detection *(JWT — farmer only)*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/disease/detect` | Detect disease (cropId, imageUrl) |
| `GET` | `/disease/my` | Farmer's detection history |

### Chatbot *(JWT)*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chatbot/ask` | Send a message, receive a rule-based reply |

---

## 🔒 Role-Based Access

```
┌─────────────────────────────┬──────────────────────────────┐
│         🌾 Farmer           │          🛒 Buyer            │
├─────────────────────────────┼──────────────────────────────┤
│ Create / edit / delete crops│ Browse crop listings         │
│ View and manage orders      │ Place and manage orders      │
│ Create & update shipments   │ Track shipments              │
│ Run disease detection       │ View market prices           │
│ View weather + risk alerts  │ Use AI chatbot               │
└─────────────────────────────┴──────────────────────────────┘
```

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🌾 Farmer | farmer@agrismart.com | password123 |
| 🛒 Buyer | buyer@agrismart.com | password123 |

---

## 🎨 Design System

**Color Palette**

| Token | Value | Usage |
|---|---|---|
| Primary | `#16a34a` | Brand green |
| Secondary | `#84cc16` | Lime accents |
| Accent | `#dcfce7` | Light green backgrounds |
| Earth | Amber / Brown | Warmth, card tones |

**UI Principles**
- Glassmorphism card effects
- Smooth page transitions & staggered entrance animations via Motion
- Fully responsive: 320px → 1440px+
- Dark mode: system detection, manual toggle, persisted preference

**Mock Data Fallback**

`/src/app/services/mockData.ts` activates automatically when the backend is unavailable, keeping the full UI functional for demos without a running server.

---

## 🚀 Deployment

### Frontend

```bash
cd frontend && npm run build
# Deploy the generated /dist folder to Vercel, Netlify, or S3
```

### Backend

Deploy to any Node.js host (Railway, Render, Fly.io, EC2, etc.) and set all environment variables in the platform dashboard.

```bash
cd backend && npm start
```

Ensure `VITE_API_URL` on the frontend points to your deployed backend URL.

---

## 📝 License & Acknowledgements

This project is licensed under the **[MIT License](LICENSE)**.

**Built with thanks to:**

- [Radix UI](https://www.radix-ui.com) — accessible headless components
- [Lucide](https://lucide.dev) — icon library
- [Recharts](https://recharts.org) — composable chart library
- [Motion / Framer Motion](https://motion.dev) — animations
- [Unsplash](https://unsplash.com) — photography
- [OpenWeatherMap](https://openweathermap.org/api) — weather data API
- [Cloudinary](https://cloudinary.com) — media management & storage
- [MongoDB Atlas](https://www.mongodb.com/atlas) — cloud database

---

<div align="center">Built with ❤️ for farmers worldwide 🌾</div>
