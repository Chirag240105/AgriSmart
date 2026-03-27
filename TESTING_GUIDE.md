# Testing Guide for Final Merge

## Quick Start (3 Terminals)

### Terminal 1: ML Server
```bash
cd ml-server
python app.py
```
Expected output:
```
 * Running on http://127.0.0.1:5001
Disease detection model loaded successfully
Price prediction model loaded successfully
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```
Expected output:
```
Server is running on port 1212
MongoDB connected successfully
Price stream started
```

### Terminal 3: Frontend
```bash
cd agrismart-frontend
npm run dev
```
Expected output:
```
  VITE ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

## Feature Testing Checklist

### 1. Disease Detection ✅
1. Navigate to `/disease` page
2. Upload a plant leaf image
3. Click "Detect Disease"
4. Verify:
   - Image preview shows
   - Detection result displays
   - Confidence score shown
   - Treatment recommendations appear

### 2. Price Prediction ✅
1. Navigate to `/prices` page
2. Select a crop from dropdown
3. View price predictions
4. Verify:
   - Current price displays
   - Price trend chart shows
   - Historical data visible
   - Predictions update in real-time

### 3. Weather Data ✅
1. Navigate to `/weather` page
2. Allow location access (or enter manually)
3. Verify:
   - Current weather displays
   - Temperature shown
   - Humidity and wind speed visible
   - Weather icon matches conditions

### 4. Payment Integration ✅
1. Navigate to orders/checkout
2. Create a test order
3. Proceed to payment
4. Verify:
   - Razorpay modal opens
   - Payment options available
   - Order status updates after payment

### 5. Existing Features ✅
- Login/Signup works
- Profile page loads
- Crops listing displays
- Orders page functional
- Shipments tracking works
- Chatbot responds

## API Endpoint Testing

### Test ML Server Directly
```bash
# Health check
curl http://localhost:5001/health

# Disease detection (with image)
curl -X POST http://localhost:5001/api/disease/detect \
  -F "image=@path/to/plant_image.jpg"

# Price prediction
curl http://localhost:5001/api/prices/predict?crop=Tomato

# Weather data
curl "http://localhost:5001/api/weather?lat=28.6139&lng=77.2090"
```

### Test Backend Directly
```bash
# Health check
curl http://localhost:1212/api/health

# Get latest prices (requires auth)
curl http://localhost:1212/api/prices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get weather
curl "http://localhost:1212/api/weather/current?lat=28.6139&lng=77.2090"
```

## Common Issues & Solutions

### Issue: ML Server won't start
**Solution**:
```bash
cd ml-server
pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

### Issue: "Model file not found"
**Solution**:
- Verify `plant_disease_model.h5` exists in `ml-server/`
- Check file size is ~9 MB
- Re-download if corrupted

### Issue: Backend can't connect to ML server
**Solution**:
- Check ML server is running on port 5001
- Update `backend/.env`: `ML_SERVER_URL=http://localhost:5001`
- Restart backend

### Issue: Frontend shows CORS errors
**Solution**:
- Verify backend CORS settings allow `http://localhost:5173`
- Check `backend/app.js` has correct CORS origin
- Clear browser cache

### Issue: Disease detection fails
**Solution**:
- Check image format (JPG, PNG)
- Verify image size < 10 MB
- Ensure ML server is running
- Check browser console for errors

### Issue: Prices not updating
**Solution**:
- Verify price stream service started
- Check MongoDB connection
- Restart backend server

## Performance Benchmarks

### Expected Response Times
- Disease detection: 2-5 seconds
- Price prediction: < 1 second
- Weather data: < 2 seconds
- Page load: < 3 seconds

### Resource Usage
- ML Server: ~500 MB RAM
- Backend: ~200 MB RAM
- Frontend: ~100 MB RAM
- Total: ~800 MB RAM

## Browser Testing

### Recommended Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Mobile Testing
- Test on mobile browsers
- Verify responsive design
- Check image upload works
- Test touch interactions

## Database Verification

### Check MongoDB Collections
```javascript
// In MongoDB shell or Compass
use agrismart

// Check disease detections
db.diseasedetections.find().limit(5)

// Check price predictions
db.prices.find().sort({timestamp: -1}).limit(5)

// Check orders
db.orders.find().limit(5)
```

## Logs to Monitor

### ML Server Logs
- Model loading status
- Prediction requests
- Error messages
- Response times

### Backend Logs
- Server startup
- Database connections
- API requests
- Authentication events
- Price stream updates

### Frontend Console
- API call status
- Component rendering
- State updates
- Error messages

## Success Criteria

All tests pass when:
- ✅ All 3 servers start without errors
- ✅ Disease detection returns results
- ✅ Price predictions display
- ✅ Weather data loads
- ✅ Payment flow completes
- ✅ No console errors
- ✅ All pages load < 3 seconds
- ✅ Mobile responsive works

## Automated Testing (Optional)

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd agrismart-frontend
npm test
```

## Load Testing (Optional)

### Test ML Server Load
```bash
# Install Apache Bench
# Test disease detection endpoint
ab -n 100 -c 10 http://localhost:5001/health
```

## Deployment Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Model files uploaded
- [ ] CORS configured for production
- [ ] SSL certificates ready
- [ ] Monitoring setup
- [ ] Error tracking enabled

---

**Happy Testing!** 🧪
