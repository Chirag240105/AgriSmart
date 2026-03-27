# Disease Detection Model Files - Summary

## ✅ Available Model Formats

You now have the disease detection model in TWO formats:

### 1. HDF5 Format (.h5)
- **File:** `ml-server/plant_disease_model.h5`
- **Size:** ~9 MB
- **Format:** Keras/TensorFlow native format
- **Usage:** `tf.keras.models.load_model("plant_disease_model.h5")`
- **Status:** ✅ Already in repository

### 2. Pickle Format (.pkl) - NEW!
- **File:** `ml-server/plant_disease_model.pkl`
- **Size:** 8.86 MB
- **Format:** Python pickle (includes weights + config + class names)
- **Usage:** See `load_pkl_model.py`
- **Status:** ✅ Just added to repository

---

## 📤 Sharing Options

### Option 1: Git Repository (Recommended)
Both model files are now in the `ml-features` branch:

```bash
git checkout ml-features
git pull origin ml-features
```

Files will be in: `ml-server/`

### Option 2: Direct File Sharing
Share either file via:
- **Google Drive** - Upload and share link
- **Dropbox** - Upload and share link
- **WeTransfer** - Free for files up to 2GB
- **Email** - If your email supports 10+ MB attachments

---

## 📥 For Your Teammate

### Quick Setup:

1. **Pull the code:**
```bash
git checkout ml-features
git pull origin ml-features
cd ml-server
```

2. **Verify files exist:**
```bash
ls plant_disease_model.h5    # Should show ~9 MB
ls plant_disease_model.pkl   # Should show ~8.86 MB
ls class_names.txt           # Should exist
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run ML server:**
```bash
python app.py
```

Expected output:
```
Loading disease detection model...
[OK] Disease detection model loaded successfully!
ML server running on port 5001
```

---

## 🔧 Using the Models

### Using .h5 (Current app.py)
```python
import tensorflow as tf

model = tf.keras.models.load_model("plant_disease_model.h5")
```

### Using .pkl (Alternative)
```python
from load_pkl_model import load_model_from_pkl

model, class_names = load_model_from_pkl("plant_disease_model.pkl")
```

---

## 📊 Model Details

- **Architecture:** MobileNetV2 (transfer learning)
- **Input:** 224x224x3 RGB images
- **Output:** 38 disease classes
- **Preprocessing:** Scale to [-1, 1]
- **Accuracy:** 85-95%
- **Dataset:** PlantVillage (54,000+ images)

### Supported Crops:
Apple, Tomato, Potato, Corn, Grape, Pepper, Peach, Orange, Strawberry, Cherry, Blueberry, Raspberry, Soybean, Squash

---

## 📁 All Model-Related Files

```
ml-server/
├── plant_disease_model.h5          # Keras model (9 MB)
├── plant_disease_model.pkl         # Pickle model (8.86 MB)
├── class_names.txt                 # 38 disease classes
├── convert_model_to_pkl.py         # Conversion script
├── load_pkl_model.py               # PKL loader helper
├── PKL_MODEL_USAGE.md              # PKL usage guide
├── SETUP_GUIDE.md                  # Complete setup guide
├── DATASET_INFO.md                 # Dataset information
├── requirements.txt                # Python dependencies
└── app.py                          # ML server (uses .h5)
```

---

## 🚀 Which Format to Use?

### Use .h5 if:
- ✅ You're already using TensorFlow/Keras
- ✅ You want the standard format
- ✅ Current app.py works fine

### Use .pkl if:
- ✅ You want a single file (includes class names)
- ✅ You want slightly smaller size
- ✅ You prefer Python pickle format
- ✅ You want metadata included

**Both formats work equally well!**

---

## 🔍 Verification

### Check .h5 model:
```bash
python -c "import tensorflow as tf; m = tf.keras.models.load_model('plant_disease_model.h5'); print('✅ H5 model OK')"
```

### Check .pkl model:
```bash
python load_pkl_model.py
```

---

## 📝 Git Status

```bash
# Current branch
git branch
# Should show: * ml-features

# Check if models are tracked
git ls-files | grep "plant_disease_model"
# Should show both .h5 and .pkl

# File sizes in repo
git ls-files -s | grep "plant_disease_model"
```

---

## 🆘 Troubleshooting

### Model not found:
```bash
git checkout ml-features
git pull origin ml-features
ls ml-server/plant_disease_model.*
```

### Can't load model:
```bash
pip install tensorflow pillow numpy
python -c "import tensorflow; print(tensorflow.__version__)"
```

### File too large for Git:
Models are already in the repo. If you need to re-add:
```bash
git lfs track "*.h5"
git lfs track "*.pkl"
```

---

## ✨ Summary

✅ Disease detection model available in 2 formats
✅ Both files pushed to `ml-features` branch
✅ Complete documentation provided
✅ Helper scripts included
✅ Ready for team collaboration

**Your teammate can now pull and use the model immediately!**
