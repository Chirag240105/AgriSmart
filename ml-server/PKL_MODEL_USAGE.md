# Using the PKL Disease Detection Model

## ✅ Model Converted Successfully!

Your disease detection model is now available in `.pkl` format:
- **File:** `plant_disease_model.pkl`
- **Size:** 8.86 MB
- **Format:** Python Pickle (easier to share)

---

## 📤 Sharing the Model

### Option 1: Git (Recommended)
The `.pkl` file is already in your repository. Your teammate can pull it:

```bash
git checkout ml-features
git pull origin ml-features
```

### Option 2: Direct File Sharing
Share `plant_disease_model.pkl` via:
- Google Drive
- Dropbox
- WeTransfer
- Email (if < 25 MB)

---

## 📥 Loading the PKL Model

### Method 1: Using the Helper Script

```python
from load_pkl_model import load_model_from_pkl, predict_disease

# Load model (do this once at startup)
model, class_names = load_model_from_pkl("plant_disease_model.pkl")

# Make predictions
result = predict_disease(model, class_names, "test_image.jpg")
print(result)
```

### Method 2: Manual Loading

```python
import pickle
import tensorflow as tf
from tensorflow import keras

# Load the pickle file
with open("plant_disease_model.pkl", "rb") as f:
    model_package = pickle.load(f)

# Reconstruct the model
model = keras.Model.from_config(model_package['config'])
model.set_weights(model_package['weights'])

# Get class names
class_names = model_package['class_names']

# Now use the model for predictions
```

---

## 🔄 Updating app.py to Use PKL

The current `app.py` loads from `.h5` file. To use `.pkl` instead:

### Option 1: Replace the load function

```python
import pickle

def load_disease_model():
    global disease_model, CLASS_NAMES
    
    pkl_path = "plant_disease_model.pkl"
    h5_path = "plant_disease_model.h5"
    
    # Try loading from PKL first
    if os.path.exists(pkl_path):
        print("Loading disease detection model from PKL...")
        with open(pkl_path, "rb") as f:
            model_package = pickle.load(f)
        
        disease_model = tf.keras.Model.from_config(model_package['config'])
        disease_model.set_weights(model_package['weights'])
        CLASS_NAMES = model_package['class_names']
        print("[OK] Disease detection model loaded from PKL!")
    
    # Fallback to H5
    elif os.path.exists(h5_path):
        print("Loading disease detection model from H5...")
        disease_model = tf.keras.models.load_model(h5_path)
        
        if os.path.exists("class_names.txt"):
            with open("class_names.txt") as f:
                CLASS_NAMES = [line.strip() for line in f.readlines()]
        print("[OK] Disease detection model loaded from H5!")
    
    else:
        print("[WARNING] No disease detection model found.")
```

### Option 2: Keep using .h5 (Current)

The `.h5` file works fine. The `.pkl` is just an alternative format.

---

## 📊 Model Package Contents

The `.pkl` file contains:

```python
{
    'weights': [...],           # Model weights (262 arrays)
    'config': {...},            # Model architecture config
    'class_names': [...],       # 38 disease class names
    'input_shape': (None, 224, 224, 3),
    'output_shape': (None, 38),
    'model_type': 'MobileNetV2',
    'preprocessing': 'mobilenet_v2',
    'image_size': (224, 224),
    'version': '1.0'
}
```

---

## 🧪 Testing the PKL Model

Run the test script:

```bash
cd ml-server
python load_pkl_model.py
```

Expected output:
```
======================================================================
DISEASE DETECTION MODEL - PKL LOADER
======================================================================
Loading model from plant_disease_model.pkl...
✅ Loaded model package
   Version: 1.0
   Classes: 38
✅ Model reconstructed successfully!

✅ Model ready for predictions!
   Total classes: 38
   Input shape: (None, 224, 224, 3)
   Output shape: (None, 38)
```

---

## 🔧 Troubleshooting

### Error: "No module named 'tensorflow'"
```bash
pip install tensorflow
```

### Error: "Can't load pickle file"
Make sure you're using Python 3.9+:
```bash
python --version
```

### Error: "Model reconstruction failed"
The pickle file might be corrupted. Re-download or regenerate:
```bash
python convert_model_to_pkl.py
```

---

## 📝 Advantages of PKL Format

1. ✅ **Single file** - No need for separate `class_names.txt`
2. ✅ **Metadata included** - Version, preprocessing info, etc.
3. ✅ **Slightly smaller** - 8.86 MB vs 9 MB for .h5
4. ✅ **Python native** - Easy to load with pickle
5. ✅ **Portable** - Works across different systems

---

## 🚀 Quick Start for Teammates

1. **Get the file:**
   ```bash
   git pull origin ml-features
   ```

2. **Install dependencies:**
   ```bash
   pip install tensorflow pillow numpy
   ```

3. **Test it:**
   ```bash
   python load_pkl_model.py
   ```

4. **Use in your code:**
   ```python
   from load_pkl_model import load_model_from_pkl, predict_disease
   
   model, class_names = load_model_from_pkl("plant_disease_model.pkl")
   result = predict_disease(model, class_names, "image.jpg")
   ```

---

## 📦 Files Generated

- ✅ `plant_disease_model.pkl` (8.86 MB) - The model
- ✅ `convert_model_to_pkl.py` - Conversion script
- ✅ `load_pkl_model.py` - Helper functions
- ✅ `PKL_MODEL_USAGE.md` - This guide

---

**Note:** Both `.h5` and `.pkl` formats work equally well. Use whichever is easier for your team!
