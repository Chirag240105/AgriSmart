# AgriSmart Backend — Architecture Guide

This document explains the complete backend architecture of AgriSmart: what every layer does, why each technology was chosen, and how the pieces connect.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Entry Point — app.js](#entry-point--appjs)
4. [Configuration Layer](#configuration-layer)
5. [Database — MongoDB + Mongoose](#database--mongodb--mongoose)
6. [Data Models](#data-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Routes](#api-routes)
9. [Controllers](#controllers)
10. [Services Layer](#services-layer)
11. [Middleware](#middleware)
12. [External Integrations](#external-integrations)
13. [ML Server Communication](#ml-server-communication)
14. [Environment Variables](#environment-variables)
15. [Request Lifecycle](#request-lifecycle)

---

## Tech Stack

| Technology | Why we use it |
|---|---|
| **Node.js + Express** | Lightweight, non-blocking I/O — ideal for an API server that makes many external calls (ML server, Razorpay, OpenWeather, Cloudinary, Groq) concurrently |
| **MongoDB + Mongoose** | Flexible schema fits agricultural data (crops have varying attributes). GeoJSON support built-in for location-based queries on crops and shipments |
| **JWT (jsonwebtoken)** | Stateless auth — no session storage needed. Token carries user ID and role, verified on every protected request |
| **bcrypt** | Industry-standard password hashing with salt rounds. Passwords are never stored in plain text |
| **Razorpay** | Indian payment gateway with UPI, cards, net banking. Supports both payment collection from buyers and payouts to farmers |
| **Cloudinary** | Cloud image storage for crop photos and profile pictures. Returns a CDN URL so images load fast globally |
| **Groq SDK** | LLM inference for the AI chatbot (AgriBot) and weather farming advice. Uses `llama-3.3-70b-versatile` — fast and accurate for agricultural Q&A |
| **Multer** | Handles `multipart/form-data` for image uploads before passing the buffer to Cloudinary |
| **nodemon** | Auto-restarts server on file changes during development |
| **ES Modules (`type: module`)** | Modern `import/export` syntax throughout — consistent with the frontend codebase |

---

## Project Structure

```
backend/
├── app.js                    # Entry point — Express setup, middleware, route mounting
├── .env                      # Environment variables (never committed)
├── package.json
└── src/
    ├── config/               # Third-party service configuration
    │   ├── db.js             # MongoDB connection
    │   ├── cloudinary.js     # Cloudinary SDK init
    │   ├── razorpay.js       # Razorpay SDK init
    │   ├── constants.js      # Shared constants
    │   └── env.js            # Env variable validation
    ├── controllers/          # Request handlers — one file per domain
    ├── middlewares/          # Auth guard, file upload
    ├── models/               # Mongoose schemas
    ├── routes/               # Express routers — map URLs to controllers
    ├── services/             # Business logic that doesn't belong in controllers
    └── utils/                # Shared helpers (Cloudinary upload wrapper)
```

The separation of `controllers` and `services` is intentional:
- **Controllers** handle HTTP concerns: parse request, call service, send response.
- **Services** contain the actual business logic and external API calls. This makes services testable independently of Express.

---

## Entry Point — app.js

`app.js` is the single bootstrap file. It:

1. Loads environment variables via `dotenv`
2. Creates the Express app
3. Applies global middleware (`express.json`, `express.urlencoded`, CORS)
4. Mounts all route modules under `/api/*`
5. Adds a 404 catch-all handler
6. Connects to MongoDB
7. Starts the price stream background job
8. Starts listening on the configured port

**Why CORS is dynamic:**
```js
origin: (origin, callback) => {
  if (!origin) return callback(null, true);
  if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
  callback(new Error(`CORS blocked: ${origin}`));
}
```
Vite dev server picks a random available port (5173, 5174, 5175...). A hardcoded origin would break every time the port changes. The regex allows any localhost port in development while blocking all non-localhost origins.

---

## Configuration Layer

### `config/db.js`
Connects to MongoDB Atlas using the `MONGO_URI` from `.env`. Calls `process.exit(1)` on failure — if the database is unreachable, there's no point running the server.

### `config/cloudinary.js`
Initialises the Cloudinary SDK with credentials from `.env`. Used by `utils/cloudnary.js` for the actual upload logic.

### `config/razorpay.js`
Initialises the Razorpay SDK. The payment controller creates its own instance directly (with correct env var names), so this config file is a secondary reference.

---

## Database — MongoDB + Mongoose

**Why MongoDB over SQL:**
- Crop listings have variable attributes (some have `harvestDate`, some don't; some have `aiInsights`, some don't). A flexible document model avoids nullable columns everywhere.
- GeoJSON is a first-class citizen in MongoDB. Crops and shipments store coordinates as `{ type: "Point", coordinates: [lng, lat] }` which enables geospatial queries like "find crops within 50km".
- The price stream writes a new document every 30 seconds. MongoDB handles high write throughput well.

**Connection:** Mongoose ODM provides schema validation, middleware hooks (`pre('save')`), and model methods (`comparePassword`) on top of the raw MongoDB driver.

---

## Data Models

### User (`User.models.js`)
```
name, email, password (hashed), role (farmer|buyer),
profileImage (Cloudinary URL), phone, bio, locationText,
location (GeoJSON Point), farmDetails, preferences
```
- `role` is an enum — only `farmer` or `buyer` are valid. This drives all role-based UI and API logic.
- `password` is hashed in a `pre('save')` hook using bcrypt. The hook only runs when `password` is modified, so updates to other fields don't re-hash.
- `comparePassword` is an instance method — keeps password comparison logic on the model where it belongs.
- `locationText` is a plain string for display. `location` is GeoJSON for future geospatial queries.

### Crop (`Crop.models.js`)
```
farmerId (ref User), cropName, variety, quantity, unit,
pricePerUnit, quality, harvestDate, location (GeoJSON),
images [], status (available|sold|expired), aiInsights,
availableQuantity, isNegotiable
```
- `farmerId` links every crop to its owner. Buyers query all available crops; farmers query only their own.
- `location` with `2dsphere` index enables proximity-based crop discovery.
- `aiInsights` stores ML-predicted price trend and demand score — populated by the price stream service.
- `availableQuantity` is set to `quantity` on first save via a `pre('save')` hook. It decrements as orders are placed.

### Order (`Order.models.js`)
```
buyerId, cropId, shipmentId, quantity, pricePerUnit,
totalAmount, status (pending|paid|failed|refunded),
paymentId, razorpayOrderId, refundId, paidAt,
transportationMode, transportFee, shippingAddress
```
- Status transitions: `pending` → `paid` (after Razorpay verification) → `refunded` (if buyer requests).
- `razorpayOrderId` and `paymentId` are stored for refund processing — Razorpay needs the payment ID to initiate a refund.
- `transportationMode` is either `self` (farmer arranges) or `platform` (AgriSmart logistics).

### Shipment (`Shipment.models.js`)
```
orderId, buyerId, farmerId, cropId, status,
currentLocation, locationHistory [], destination,
trackingUpdates [], eta, temperatureHistory [],
riskScore, aiInsights, alerts []
```
- `locationHistory` is capped at 100 entries via a `pre('save')` hook to prevent unbounded document growth.
- `aiInsights.routeRiskScore` and `anomalyFlags` are designed for integration with a real-time route monitoring service (Pathway).
- `alerts` array stores warnings (e.g. temperature spike, route deviation) with severity levels.

### Price (`Price.models.js`)
Stores ML-predicted crop prices with historical price arrays, trend direction, confidence score, and insights text. Written by the price stream service every 30 seconds.

### Weather (`Weather.models.js`)
Stores weather snapshots with GeoJSON location, temperature, humidity, rainfall, wind speed, AI farming advice, and risk level. Written every time a user fetches weather for a city.

---

## Authentication & Authorization

### How it works

1. **Signup/Login** → `authController` validates credentials, returns a JWT signed with `JWT_SECRET_KEY`, expiring in 7 days.
2. **Frontend** stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request.
3. **`protect` middleware** (`authMiddleware.js`) verifies the token, fetches the user from DB, and attaches it to `req.user`.
4. **`authorize(...roles)` middleware** checks `req.user.role` against allowed roles for role-restricted routes.

### Public routes
Some routes are accessible without a token (weather, prices). The middleware checks a `publicPaths` array and skips token verification for those — but still attaches the user if a valid token is present (for personalised responses).

### Why JWT over sessions
- The backend is stateless — no session store needed.
- The ML server and frontend can independently verify tokens if needed.
- Scales horizontally without sticky sessions.

---

## API Routes

All routes are prefixed with `/api`.





| Prefix | File | Auth | Description |
|---|---|---|---|
| `/api/auth` | `authRoutes.js` | Public | Signup, login |
| `/api/users` | `userRoutes.js` | Protected | Profile CRUD, avatar upload, login history |
| `/api/crops` | `cropRoutes.js` | Protected | Crop listings CRUD |
| `/api/orders` | `orderRoutes.js` | Protected | Order management |
| `/api/payments` | `paymentRoutes.js` | Protected | Razorpay order creation, verification, refund, farmer payout |
| `/api/shipments` | `shipmentRoutes.js` | Protected | Shipment tracking |
| `/api/weather` | `weatherRoutes.js` | Protected | OpenWeather fetch + save to DB |
| `/api/weather` | `weatherAdvice.js` | Protected | Groq AI farming advice (same prefix, different handlers) |
| `/api/prices` | `priceRoutes.js` | Public | ML price predictions |
| `/api/disease` | `diseaseRoutes.js` | Protected | Crop disease detection via ML server |
| `/api/chatbot` | `chatbotRoutes.js` | Protected | AgriBot AI assistant |
| `/api/health` | inline in app.js | Public | Server health check |

**Why two weather route files on the same prefix:**
`weatherRoutes.js` handles OpenWeather data fetching and DB persistence. `weatherAdvice.js` handles Groq AI advice generation. They're split because they have different concerns — one is data, one is AI inference. Both are mounted on `/api/weather` and Express merges them.

---

## Controllers

Each controller file owns one domain. Controllers are thin — they:
1. Extract and validate input from `req`
2. Call the appropriate service or model
3. Return a JSON response

**Pattern used throughout:**
```js
export const doSomething = async (req, res) => {
  try {
    // validate → call service/model → respond
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

### `authController.js`
Handles signup and login. On signup, it uploads the profile image to Cloudinary before creating the user — if the upload fails, the user is not created (atomic-ish behaviour).

### `paymentController.js`
Four operations:
- **createPaymentOrder** — creates a Razorpay order with the amount in paise (×100). Returns the Razorpay order ID to the frontend.
- **verifyPayment** — validates the HMAC-SHA256 signature Razorpay sends after payment. This is the security check — without it, anyone could fake a payment success.
- **refundPayment** — calls Razorpay's refund API using the stored `paymentId`. Updates order status to `refunded`.
- **payoutToFarmer** — creates a Razorpay contact + fund account + payout to transfer money to a farmer's bank account via IMPS.

### `weatherController.js`
Fetches weather from OpenWeather using lat/lng, reverse-geocodes to get the city name, calls `deriveWeatherRiskSuggestion` for AI advice, saves the full record to MongoDB, and returns it. The `lang` query param is passed through to the AI service for localised advice.

### `priceController.js`
`getLatestPrices` always calls `fetchMlLatestPrices` which fires 6 parallel requests to the ML server's `/predict-price` endpoint — one per default crop. Each result gets 6 months of generated historical data for the chart. `predictPrice` proxies a custom prediction request to the ML server.

---

## Services Layer

### `priceStreamService.js`
A background job that runs every 30 seconds (configurable via `PRICE_STREAM_INTERVAL_MS`). It cycles through 9 crops from the `mandiDataset`, calls the ML server for a price prediction, and writes a new `PricePrediction` document to MongoDB.

**Why a stream instead of on-demand:**
Price data needs to feel live. Pre-computing and storing predictions means the `/api/prices` endpoint responds instantly from DB instead of waiting for ML inference on every page load.

**Fallback:** If the ML server is down, it falls back to an algorithmic price calculation using seasonal factors and inflation multipliers.

### `weatherService.js`
Two functions:
- `fetchCurrentWeather` — calls OpenWeather API. Falls back to a deterministic simulated value (seeded by lat/lng) if no API key is set.
- `deriveWeatherRiskSuggestion` — builds a detailed prompt with the actual weather values and contextual flags (`(HEAVY RAIN)`, `(HIGH - fungal risk)`) and calls Groq. The `lang` parameter makes the LLM respond in the user's language. Falls back to hardcoded advice strings if Groq is unavailable.

### `chatbotService.js`
Maintains conversation history across messages. Sends the full history to Groq so the LLM has context for follow-up questions. The system prompt defines AgriBot's persona, expertise areas, and rules (respond in Hindi if asked in Hindi, stay on agriculture topics). Falls back to keyword-matched rule-based replies if Groq fails.

### `diseaseDetectionService.js`
Accepts either a base64 data URL or a remote image URL, converts it to a buffer, and POSTs it to the ML server's `/predict-binary` endpoint with the crop type in a header. The ML server runs Gemini Vision or the PlantVillage model and returns disease name, confidence, severity, treatment steps, and prevention tips. Falls back to a random entry from a small disease catalog if the ML server is unreachable.

---

## Middleware

### `authMiddleware.js`
- `protect` (alias `verifyJWT`) — extracts JWT from `Authorization` header or cookie, verifies it, fetches the user, attaches to `req.user`.
- `authorize(...roles)` — checks `req.user.role` is in the allowed list. Used for farmer-only or buyer-only routes.

### `upload.js` (Multer)
Configured with `memoryStorage` — files are held in memory as `Buffer` objects rather than written to disk. This is correct for a cloud deployment where the filesystem is ephemeral. The buffer is passed directly to Cloudinary's upload stream.

---

## External Integrations

### Cloudinary
Used for all image storage. The `uploadPromise` utility wraps Cloudinary's stream-based upload in a Promise:
```js
const uploadPromise = (fileBuffer, folder) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  stream.end(fileBuffer);
});
```
Returns a `secure_url` (HTTPS CDN URL) stored in the database.

### Razorpay
Payment flow:
```
Frontend clicks Pay → POST /api/payments/create-order
  → Backend creates Razorpay order → returns razorpayOrderId
  → Frontend opens Razorpay checkout modal
  → User pays → Razorpay calls handler with signature
  → Frontend POSTs signature to /api/payments/verify
  → Backend validates HMAC signature → marks order as paid
```
The HMAC verification step is critical — it proves the payment response came from Razorpay and wasn't tampered with.

### OpenWeather API
Used in `weatherService.js` for current weather by lat/lng. The `units=metric` param returns Celsius. The backend also uses the Geocoding API (`/geo/1.0/reverse`) to convert coordinates back to a city name.

### Groq (LLM)
Used in two places:
- **AgriBot chatbot** — conversational AI with full history context
- **Weather advice** — single-turn prompt with weather data, responds in the user's language

Model used: `llama-3.3-70b-versatile` — chosen for its strong multilingual capability (Hindi, Punjabi, Tamil, Telugu, Marathi) and fast inference via Groq's LPU hardware.

---

## ML Server Communication

The backend communicates with the Python ML server (`http://localhost:5001`) for two features:

| Endpoint | Used by | Purpose |
|---|---|---|
| `POST /predict-price` | `priceController`, `priceStreamService` | XGBoost price prediction |
| `POST /predict-binary` | `diseaseDetectionService` | Plant disease detection (Gemini Vision / PlantVillage model) |

All ML calls have timeouts (5–60 seconds) and fallback logic so the backend stays functional if the ML server is down.

The ML server URL is configurable via `ML_SERVER_URL` in `.env` — making it easy to point to a deployed ML server in production.

---

## Environment Variables

```env
PORT=1212                          # Express server port
MONGO_URI=mongodb+srv://...        # MongoDB Atlas connection string
JWT_SECRET_KEY=...                 # JWT signing secret (keep long and random)
ACCESS_TOKEN_SECRET=...            # Alias for JWT secret

OPENWEATHER_API_KEY=...            # OpenWeather current weather
GROQ_API_KEY=...                   # Groq LLM (chatbot + weather advice)

RAZORPAY_KEY_ID=...                # Razorpay public key
RAZORPAY_KEY_SECRET=...            # Razorpay secret (never expose to frontend)

CLOUD_NAME=...                     # Cloudinary cloud name
CLOUD_API_KEY=...                  # Cloudinary API key
CLOUD_API_SECRET=...               # Cloudinary API secret

ML_SERVER_URL=http://localhost:5001  # Python ML server URL
PRICE_STREAM_INTERVAL_MS=30000       # How often price stream ticks (ms)
```

---

## Request Lifecycle

A typical authenticated request (e.g. buyer fetching their orders):

```
Browser
  │
  ├─ GET /api/orders
  │   Authorization: Bearer <jwt>
  │
Express app.js
  │
  ├─ express.json()          → parse body
  ├─ cors()                  → validate origin
  │
  ├─ /api/orders → orderRoutes.js
  │
  ├─ protect middleware
  │   ├─ extract token from header
  │   ├─ jwt.verify(token, JWT_SECRET_KEY)
  │   ├─ User.findById(decoded.id)
  │   └─ req.user = user → next()
  │
  ├─ orderController.getAllOrders
  │   ├─ Order.find({ buyerId: req.user.id })
  │   │   .populate('cropId', 'cropName')
  │   │   .populate('shipmentId')
  │   └─ res.json({ success: true, data: orders })
  │
Browser receives response
```

For a payment request, the lifecycle also includes a Razorpay API call. For weather, it includes OpenWeather + Groq calls. For disease detection, it includes a Cloudinary upload + ML server call. Each external call has a timeout and fallback so one slow service doesn't hang the entire request.
