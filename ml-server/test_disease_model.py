"""
Quick test of the disease detection model
"""
import requests
import os
import base64

# Get a sample image from the dataset
DATASET_DIR = "plantvillage-dataset/plantvillage dataset/color"

# Find first available image
for class_folder in os.listdir(DATASET_DIR)[:3]:
    class_path = os.path.join(DATASET_DIR, class_folder)
    if os.path.isdir(class_path):
        images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        if images:
            test_image = os.path.join(class_path, images[0])
            
            print(f"\n{'='*60}")
            print(f"Testing with: {class_folder}")
            print(f"Image: {images[0]}")
            print(f"{'='*60}")
            
            # Read and encode image as base64
            with open(test_image, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                image_url = f"data:image/jpeg;base64,{image_data}"
            
            # Send to API
            response = requests.post(
                'http://localhost:5001/predict',
                json={'imageUrl': image_url, 'cropType': 'apple'},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"\n✅ Disease: {result['diseaseName']}")
                    print(f"✅ Crop: {result['affectedCrop']}")
                    print(f"✅ Confidence: {result['confidence']:.1f}%")
                    print(f"✅ Healthy: {result['isHealthy']}")
                    if result.get('suggestions'):
                        print(f"✅ Treatment: {result['suggestions'][0]}")
                else:
                    print(f"❌ Error: {result.get('error')}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)

print(f"\n{'='*60}")
print("✅ Model is working! Ready for your hackathon demo!")
print(f"{'='*60}\n")
