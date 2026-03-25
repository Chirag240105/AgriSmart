"""
Test disease detection API directly
"""
import requests
import base64

# Test with a simple test
print("Testing ML Server Disease Detection...")
print("=" * 60)

# Test 1: Health check
print("\n1. Testing health endpoint...")
try:
    response = requests.get("http://localhost:5001/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Disease detection with a test image URL
print("\n2. Testing disease detection endpoint...")
test_data = {
    "imageUrl": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400"
}

try:
    response = requests.post(
        "http://localhost:5001/predict",
        json=test_data,
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Success: {result.get('success')}")
        if result.get('success'):
            print(f"   Disease: {result.get('diseaseName')}")
            print(f"   Crop: {result.get('affectedCrop')}")
            print(f"   Confidence: {result.get('confidence')}%")
        else:
            print(f"   Error: {result.get('error')}")
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
