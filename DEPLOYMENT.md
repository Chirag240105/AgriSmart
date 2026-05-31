# AgriSmart Deployment Guide

This guide covers deploying:
- **Frontend** → Vercel
- **Backend** → Render
- **ML Server** → Render (separate service)

---

## Prerequisites

- GitHub repo with all three folders: `agrismart-frontend/`, `backend/`, `ml-server/`
- Accounts on [Vercel](https://vercel.com) and [Render](https://render.com)
- MongoDB Atlas cluster (free tier works)
- Cloudinary account (free tier works)
- Razorpay account (test mode)
- Groq API key (free at console.groq.com)
- OpenWeather API key (free tier works)

---

## Step 1 — Deploy Backend on Render

### 1.1 Create a new Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Set the **Root Directory** to `backend`
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `agrismart-backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter for production) |

### 1.2 Add Environment Variables

In Render dashboard → **Environment** tab, add every variable from `backend/.env.example`:

```
PORT                    = 1212
MONGO_URI               = mongodb+srv://...
JWT_SECRET_KEY          = (generate: openssl rand -hex 32)
ACCESS_TOKEN_SECRET     = (same as JWT_SECRET_KEY)
OPENWEATHER_API_KEY     = ...
GROQ_API_KEY            = ...
RAZORPAY_KEY_ID         = ...
RAZORPAY_KEY_SECRET     = ...
CLOUD_NAME              = ...
CLOUD_API_KEY           = ...
CLOUD_API_SECRET        = ...
ML_SERVER_URL           = https://agrismart-ml.onrender.com  (set after Step 2)
FRONTEND_URL            = https://agrismart.vercel.app       (set after Step 3)
PRICE_STREAM_INTERVAL_MS = 30000
```

> **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to Starter ($7/mo) to avoid this.

### 1.3 Deploy

Click **Deploy**. Wait for build to complete. Your backend URL will be:
`https://agrismart-backend.onrender.com`

Test it: `https://agrismart-backend.onrender.com/api/health` should return `{"success":true}`

---

## Step 2 — Deploy ML Server on Render

### 2.1 Create a new Web Service

1. **New** → **Web Service**
2. Same GitHub repo, set **Root Directory** to `ml-server`
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `agrismart-ml` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python app.py` |
| **Instance Type** | Starter (ML needs more RAM than free tier) |

### 2.2 Add Environment Variables

```
PORT          = 5001
GROQ_API_KEY  = ...
GEMINI_API_KEY = ...
```

### 2.3 Important — Model Files

The `.pkl` model files and `plant_disease_model.h5` must be in the repo or downloaded at build time. Since they're binary files:

**Option A (recommended):** Keep them in the repo. Make sure `.gitignore` does NOT exclude `.pkl` and `.h5` files.

**Option B:** Add a build step to download from cloud storage:
```bash
# In build command:
pip install -r requirements.txt && python scripts/download_models.py
```

### 2.4 Update Backend

After ML server deploys, go back to your backend Render service → **Environment** → update:
```
ML_SERVER_URL = https://agrismart-ml.onrender.com
```

---

## Step 3 — Deploy Frontend on Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo
3. Set **Root Directory** to `agrismart-frontend`
4. Framework preset: **Vite** (auto-detected)

### 3.2 Add Environment Variables

In Vercel → **Settings** → **Environment Variables**:

```
VITE_API_URL              = https://agrismart-backend.onrender.com
VITE_OPENWEATHER_API_KEY  = your_key_here
VITE_RAZORPAY_KEY_ID      = rzp_test_xxxx
```

> **Critical:** All frontend env vars must start with `VITE_` to be exposed to the browser by Vite.

### 3.3 Deploy

Click **Deploy**. Vercel builds with `npm run build` and serves the `dist/` folder.

Your frontend URL: `https://agrismart.vercel.app`

### 3.4 Update Backend CORS

Go back to Render backend → **Environment** → update:
```
FRONTEND_URL = https://agrismart.vercel.app
```
Trigger a redeploy.

---

## Step 4 — Verify Everything Works

Run these checks in order:

```
1. https://agrismart-backend.onrender.com/api/health
   → { "success": true, "message": "AgriSmart backend is running" }

2. https://agrismart-ml.onrender.com/health
   → { "status": "ok", "price_model_loaded": true }

3. https://agrismart.vercel.app
   → App loads, login works, dashboard loads
```

---

## Environment Variables Summary

### What goes where

| Variable | Backend (Render) | Frontend (Vercel) | Never expose |
|---|---|---|---|
| `MONGO_URI` | ✅ | ❌ | ✅ |
| `JWT_SECRET_KEY` | ✅ | ❌ | ✅ |
| `RAZORPAY_KEY_SECRET` | ✅ | ❌ | ✅ |
| `RAZORPAY_KEY_ID` | ✅ | ✅ (VITE_) | ❌ |
| `GROQ_API_KEY` | ✅ | ❌ | ✅ |
| `CLOUD_API_SECRET` | ✅ | ❌ | ✅ |
| `OPENWEATHER_API_KEY` | ✅ | ✅ (VITE_) | ❌ |
| `VITE_API_URL` | ❌ | ✅ | ❌ |

---

## Common Issues

**CORS errors after deployment**
- Make sure `FRONTEND_URL` in Render matches your exact Vercel URL (no trailing slash)
- Vercel preview deployments get URLs like `agrismart-git-main-xxx.vercel.app` — these are covered by the `*.vercel.app` regex in `app.js`

**Backend sleeping on Render free tier**
- First request after inactivity takes ~30s. Upgrade to Starter or use a cron job to ping `/api/health` every 10 minutes.

**ML server out of memory**
- TensorFlow + scikit-learn need at least 512MB RAM. Free tier (256MB) will crash. Use Starter instance.

**Price stream not running**
- The price stream starts automatically when the backend boots. Check Render logs for `Starting ML-powered price stream...`

**Images not uploading**
- Verify `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` are set correctly in Render
- Multer uses memory storage — files are held in RAM and streamed to Cloudinary. No disk writes needed.

**Vite build fails on Vercel**
- Make sure `agrismart-frontend` is set as the root directory in Vercel project settings
- Check that all `VITE_` env vars are added in Vercel dashboard before deploying
