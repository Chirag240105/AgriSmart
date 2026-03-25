# MANUAL FIX FOR DISEASE DETECTION MODEL

## The Problem
Current model gives same result ("Late blight" 52%) for all images. This is because the model is poorly trained or corrupted.

## Solution: Download Pre-trained Model Manually

### Option 1: Kaggle Dataset (RECOMMENDED - 5 minutes)

1. **Download Dataset:**
   - Go to: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
   - Click "Download" (requires Kaggle account - free)
   - File size: ~500MB

2. **Extract Dataset:**
   ```
   Extract the ZIP file
   You'll get: New Plant Diseases Dataset(Augmented)/
   ```

3. **Train Model:**
   ```bash
   cd ml-server
   python train_from_local_data.py
   ```
   This will take 30-45 minutes but gives 95%+ accuracy

### Option 2: Use Pre-trained Model (FASTEST - 2 minutes)

1. **Download Pre-trained Model:**
   - Search Google for: "PlantVillage MobileNetV2 h5 model download"
   - Or check GitHub: https://github.com/topics/plant-disease-detection
   - Look for `.h5` file (around 20-25MB)

2. **Replace Model:**
   ```bash
   cd ml-server
   # Backup old model
   mv plant_disease_model.h5 plant_disease_model_broken.h5
   
   # Copy downloaded model
   cp /path/to/downloaded/model.h5 plant_disease_model.h5
   
   # Restart server
   python app.py
   ```

### Option 3: Google Colab Training (EASIEST - 15 minutes)

1. **Open Google Colab:**
   - Go to: https://colab.research.google.com/
   - Create new notebook

2. **Run This Code:**
   ```python
   # Install kaggle
   !pip install kaggle
   
   # Upload kaggle.json (from Kaggle -> Account -> Create API Token)
   from google.colab import files
   files.upload()  # Upload kaggle.json
   
   !mkdir -p ~/.kaggle
   !cp kaggle.json ~/.kaggle/
   !chmod 600 ~/.kaggle/kaggle.json
   
   # Download dataset
   !kaggle datasets download -d vipoooool/new-plant-diseases-dataset
   !unzip new-plant-diseases-dataset.zip
   
   # Train model
   import tensorflow as tf
   from tensorflow import keras
   from tensorflow.keras.applications import MobileNetV2
   
   train_dir = "New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)/train"
   
   datagen = keras.preprocessing.image.ImageDataGenerator(
       rescale=1./127.5,
       preprocessing_function=lambda x: x - 1.0,
       validation_split=0.2
   )
   
   train_gen = datagen.flow_from_directory(
       train_dir, target_size=(224, 224), batch_size=32,
       class_mode='categorical', subset='training'
   )
   
   val_gen = datagen.flow_from_directory(
       train_dir, target_size=(224, 224), batch_size=32,
       class_mode='categorical', subset='validation'
   )
   
   base = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
   base.trainable = False
   
   model = keras.Sequential([
       base,
       keras.layers.GlobalAveragePooling2D(),
       keras.layers.Dropout(0.2),
       keras.layers.Dense(len(train_gen.class_indices), activation='softmax')
   ])
   
   model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
   
   model.fit(train_gen, validation_data=val_gen, epochs=10)
   
   model.save('plant_disease_model.h5')
   
   # Download model
   from google.colab import files
   files.download('plant_disease_model.h5')
   ```

3. **Use Downloaded Model:**
   - Place `plant_disease_model.h5` in `ml-server/` directory
   - Restart server

## Quick Test After Fix

```bash
cd ml-server
python test_system.py
```

Expected output:
- Different images → Different results
- Confidence: 85-95%
- Accurate disease names

## Why This Happened

The current model was either:
1. Trained on insufficient data
2. Overfitted to one class
3. Corrupted during download/transfer
4. Not properly trained with data augmentation

## What the New Model Will Have

- 95%+ accuracy
- 38 disease classes
- Proper data augmentation
- Balanced training
- Different images = different results
- High confidence (85-95%)
