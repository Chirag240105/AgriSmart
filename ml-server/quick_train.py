"""
Quick training script using gdown to download from Google Drive
This is faster and more reliable than Kaggle
"""
import os
import sys
import subprocess

print("=" * 70)
print("QUICK MODEL TRAINING - GOOGLE DRIVE METHOD")
print("=" * 70)

# Install gdown
print("\n[1/5] Installing gdown...")
try:
    import gdown
    print("✅ gdown already installed")
except ImportError:
    print("Installing gdown...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
    import gdown
    print("✅ gdown installed")

# Download dataset from Google Drive
print("\n[2/5] Downloading PlantVillage dataset from Google Drive...")
print("Size: ~500MB, ETA: 5-10 minutes")

# Public Google Drive link for PlantVillage dataset
GDRIVE_ID = "1-PlantVillage-Dataset-ID"  # This is a placeholder
GDRIVE_URL = "https://drive.google.com/uc?id=1aKW7kZFHPzGZmnKpqMqVzE-VLbLQ3qYv"

dataset_zip = "plantvillage.zip"
dataset_dir = "plantvillage_data"

if not os.path.exists(dataset_dir):
    try:
        print("Downloading...")
        gdown.download(GDRIVE_URL, dataset_zip, quiet=False)
        
        print("Extracting...")
        import zipfile
        with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
            zip_ref.extractall(dataset_dir)
        
        os.remove(dataset_zip)
        print("✅ Dataset downloaded and extracted")
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("\nUsing alternative: Direct HTTP download...")
        
        # Alternative: Use requests
        import requests
        
        urls = [
            "https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/d5652a28-c1d8-4b76-97f3-72fb80f94efc/file_downloaded",
            "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
        ]
        
        for url in urls:
            try:
                print(f"Trying: {url}")
                response = requests.get(url, stream=True, timeout=30)
                response.raise_for_status()
                
                with open(dataset_zip, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print("Extracting...")
                with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
                    zip_ref.extractall(dataset_dir)
                
                os.remove(dataset_zip)
                print("✅ Dataset downloaded")
                break
            except Exception as e2:
                print(f"Failed: {e2}")
                continue
        else:
            print("\n❌ All download methods failed")
            print("\nMANUAL DOWNLOAD REQUIRED:")
            print("1. Download from: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
            print("2. Extract to: ml-server/plantvillage_data/")
            print("3. Ensure structure: plantvillage_data/train/[disease_folders]/")
            print("4. Run: python quick_train.py")
            sys.exit(1)
else:
    print("✅ Dataset already exists")

# Continue with training...
print("\n[3/5] Preparing data...")

# Rest of the training code here
print("✅ Ready to train")
print("\nIMPORTANT: Training will take 30-45 minutes")
print("Press Ctrl+C to cancel, or Enter to continue...")
input()

# Import TensorFlow
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2

# Find training directory
train_paths = [
    os.path.join(dataset_dir, "train"),
    os.path.join(dataset_dir, "New Plant Diseases Dataset(Augmented)", "train"),
    os.path.join(dataset_dir, "PlantVillage-Dataset-master", "raw", "color"),
]

train_dir = None
for path in train_paths:
    if os.path.exists(path):
        subdirs = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
        if len(subdirs) > 10:
            train_dir = path
            break

if not train_dir:
    print("❌ Training data not found")
    print("Please check dataset structure")
    sys.exit(1)

print(f"Using: {train_dir}")

# Training configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

# Data generators
print("\n[4/5] Creating data generators...")
datagen = keras.preprocessing.image.ImageDataGenerator(
    rescale=1./127.5,
    preprocessing_function=lambda x: x - 1.0,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

train_gen = datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_gen = datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

num_classes = len(train_gen.class_indices)
print(f"Classes: {num_classes}")
print(f"Training samples: {train_gen.samples}")
print(f"Validation samples: {val_gen.samples}")

# Save class names
with open("class_names.txt", "w") as f:
    for name in train_gen.class_indices.keys():
        f.write(name + "\n")

# Build model
print("\n[5/5] Training model...")
base = MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights='imagenet')
base.trainable = False

model = keras.Sequential([
    base,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2)
    ]
)

# Evaluate
val_loss, val_acc = model.evaluate(val_gen)
print(f"\n✅ Accuracy: {val_acc*100:.2f}%")

# Save
if os.path.exists("plant_disease_model.h5"):
    os.rename("plant_disease_model.h5", "plant_disease_model_old.h5")

model.save("plant_disease_model.h5")
print("✅ Model saved!")
print("\nRestart ML server: python app.py")
