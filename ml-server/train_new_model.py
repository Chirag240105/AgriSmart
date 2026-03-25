"""
Train a high-accuracy plant disease detection model
Downloads PlantVillage dataset and trains EfficientNetB0
"""
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import EfficientNetB0
import numpy as np
import os
import urllib.request
import zipfile
import shutil

print("=" * 70)
print("TRAINING HIGH-ACCURACY PLANT DISEASE MODEL")
print("=" * 70)

# Step 1: Download PlantVillage dataset
DATASET_URL = "https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/d5652a28-c1d8-4b76-97f3-72fb80f94efc/file_downloaded"
DATASET_ZIP = "plantvillage_dataset.zip"
DATASET_DIR = "plantvillage_data"

print("\n[1/5] Downloading PlantVillage dataset...")
print("This may take 5-10 minutes (dataset is ~500MB)")

if not os.path.exists(DATASET_DIR):
    try:
        # Download dataset
        print("Downloading from Mendeley...")
        urllib.request.urlretrieve(DATASET_URL, DATASET_ZIP)
        
        # Extract
        print("Extracting dataset...")
        with zipfile.ZipFile(DATASET_ZIP, 'r') as zip_ref:
            zip_ref.extractall(DATASET_DIR)
        
        print("✅ Dataset downloaded and extracted")
        os.remove(DATASET_ZIP)
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("\nAlternative: Manual download")
        print("1. Download from: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
        print("2. Extract to: ml-server/plantvillage_data/")
        print("3. Run this script again")
        exit(1)
else:
    print("✅ Dataset already exists")

# Step 2: Prepare data
print("\n[2/5] Preparing data...")

# Find the correct data directory
data_paths = [
    os.path.join(DATASET_DIR, "PlantVillage"),
    os.path.join(DATASET_DIR, "New Plant Diseases Dataset(Augmented)", "train"),
    os.path.join(DATASET_DIR, "train"),
]

train_dir = None
for path in data_paths:
    if os.path.exists(path):
        train_dir = path
        break

if not train_dir:
    print("❌ Could not find training data")
    print("Please download manually from Kaggle")
    exit(1)

print(f"Using data from: {train_dir}")

# Count classes
classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
num_classes = len(classes)
print(f"Found {num_classes} disease classes")

# Step 3: Create data generators
print("\n[3/5] Creating data generators...")

IMG_SIZE = 224
BATCH_SIZE = 32

train_datagen = keras.preprocessing.image.ImageDataGenerator(
    rescale=1./127.5,
    preprocessing_function=lambda x: x - 1.0,  # Scale to [-1, 1]
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

print(f"Training samples: {train_generator.samples}")
print(f"Validation samples: {val_generator.samples}")

# Save class names
class_names = list(train_generator.class_indices.keys())
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"✅ Saved {len(class_names)} class names")

# Step 4: Build model
print("\n[4/5] Building EfficientNetB0 model...")

base_model = EfficientNetB0(
    include_top=False,
    weights='imagenet',
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Freeze base model
base_model.trainable = False

model = keras.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("✅ Model built")
model.summary()

# Step 5: Train model
print("\n[5/5] Training model...")
print("This will take 30-60 minutes depending on your hardware")

callbacks = [
    keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3)
]

history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=20,
    callbacks=callbacks
)

# Evaluate
val_loss, val_acc = model.evaluate(val_generator)
print(f"\n✅ Training complete!")
print(f"Validation Accuracy: {val_acc*100:.2f}%")

# Save model
model.save("plant_disease_model_new.h5")
print("✅ Model saved as: plant_disease_model_new.h5")

print("\n" + "=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print("1. Backup old model: mv plant_disease_model.h5 plant_disease_model_backup.h5")
print("2. Use new model: mv plant_disease_model_new.h5 plant_disease_model.h5")
print("3. Restart ML server: python app.py")
print(f"\nExpected accuracy: {val_acc*100:.2f}%")
