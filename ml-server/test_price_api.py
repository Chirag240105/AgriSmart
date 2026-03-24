"""
Test script for price prediction API
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:5001/predict-price"

# Sample test data
test_data = {
    "commodity": "Potato",
    "state": "Gujarat",
    "market": "Damnagar",
    "temperature": 28.5,
    "rainfall": 13.6,
    "lag_1": 2500.0,
    "lag_2": 2400.0,
    "lag_3": 2300.0,
    "min_price": 2000.0,
    "max_price": 3000.0
}

print("=" * 60)
print("TESTING PRICE PREDICTION API")
print("=" * 60)

print("\n1. Test Data:")
print(json.dumps(test_data, indent=2))

print("\n2. Sending request to API...")
try:
    response = requests.post(API_URL, json=test_data, timeout=10)
    
    print(f"\n3. Response Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n4. Prediction Result:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print("\n" + "=" * 60)
            print("✓ API TEST SUCCESSFUL")
            print("=" * 60)
            print(f"\nPredicted Price: ₹{result['predicted_price']}")
            print(f"Commodity: {result['commodity']}")
            print(f"Confidence: {result['confidence']}%")
        else:
            print("\n✗ Prediction failed:", result.get('error'))
    else:
        print(f"\n✗ API Error: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n✗ ERROR: Could not connect to API")
    print("   Make sure the Flask server is running:")
    print("   python app.py")
except Exception as e:
    print(f"\n✗ ERROR: {str(e)}")
