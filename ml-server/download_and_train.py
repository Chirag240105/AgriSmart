"""
Download PlantVillage dataset from Kaggle and train a high-accuracy model
This will take 30-45 minutes but will solve the issue permanently
"""
import os
import sys
import subprocess

print("=" * 70)
print("DOWNLOADING PLANTVILLAGE DATASET AND TRAINING MODEL")
print("=" * 70)

# Step 1: Install kaggle if not installed
print("\n[1/6] Installing Kaggle CLI...")
try:
    import kaggle
    print("✅ Kaggle already installed")
except ImportError:
    print("Installing kaggle package...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kaggle"])
    print("✅ Kaggle installed")

# Step 2: Setup Kaggle credentials
print("\n[2/6] Setting up Kaggle credentials...")
kaggle_dir = os.path.expanduser("~/.kaggle")
kaggle_json = os.path.join(kaggle_dir, "kaggle.json")

if not os.path.exists(kaggle_json):
    print("\n⚠️  Kaggle API key not found!")
    print("\nPlease follow these steps:")
    print("1. Go to: https://www.kaggle.com/settings/account")
    print("2. Scroll to 'API' section")
    print("3. Click 'Create New Token'")
    print("4. Download kaggle.json")
    print("5. Place it in: " + kaggle_dir)
    print("\nOr run this command:")
    print(f"   mkdir {kaggle_dir}")
    print(f"   # Copy kaggle.json to {kaggle_dir}")
    
    # Create directory
    os.makedirs(kaggle_dir, exist_ok=True)
    
    print("\n⚠️  Alternatively, I can download from a direct link...")
    response = input("Do you want to try direct download? (y/n): ")
    
    if response.lower() != 'y':
        sys.exit(1)
else:
    print("✅ Kaggle credentials found")

# Step 3: Download dataset
print("\n[3/6] Downloading PlantVillage dataset...")
print("Dataset size: ~500MB, this may take 5-10 minutes")

dataset_name = "vipoooool/new-plant-diseases-dataset"
download_path = "plantvillage_dataset"

if not os.path.exists(download_path):
    try:
        os.system(f"kaggle datasets download -d {dataset_name} -p {download_path} --unzip")
        print("✅ Dataset downloaded")
    except Exception as e:
        print(f"❌ Kaggle download failed: {e}")
        print("\nTrying alternative method...")
        
        # Alternative: Direct download
        import urllib.request
        import zipfile
        
        print("Downloading from alternative source...")
        url = "https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/d5652a28-c1d8-4b76-97f3-72fb80f94efc/file_downloaded"
        zip_file = "plantvillage.zip"
        
        try:
            urllib.request.urlretrieve(url, zip_file)
            print("Extracting...")
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall(download_path)
            os.remove(zip_file)
            print("✅ Dataset downloaded via alternative method")
        except Exception as e2:
            print(f"❌ Alternative download also failed: {e2}")
            print("\nPlease download manually:")
            print("1. Visit: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
            print("2. Download and extract to: ml-server/plantvillage_dataset/")
            print("3. Run this script again")
            sys.exit(1)
else:
    print("✅ Dataset already exists")

# Step 4: Find training data
print("\n[4/6] Locating training data...")

possible_paths = [
    os.path.join(download_path, "New Plant Diseases Dataset(Augmented)", "New Plant Diseases Dataset(Augmented)", "train"),
    os.path.join(download_path, "New Plant Diseases Dataset(Augmented)", "train"),
    os.path.join(download_path, "train"),
    os.path.join(download_path, "PlantVillage"),
]

train_dir = None
for path in possible_paths:
    if os.path.exists(path):
        # Check if it has subdirectories (classes)
        subdirs = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
        if len(subdirs) > 10:  # Should have 38 classes
            train_dir = path
            print(f"✅ Found training data: {path}")
            print(f"   Classes found: {len(subdirs)}")
            break

if not train_dir:
    print("❌ Could not find training data in expected locations")
    print("\nSearching entire dataset...")
    for root, dirs, files in os.walk(download_path):
        if len(dirs) > 30 and any('___' in d for d in dirs):
            train_dir = root
            print(f"✅ Found at: {train_dir}")
            break
    
    if not train_dir:
        print("❌ Training data not found. Please check dataset structure.")
        sys.exit(1)

# Step 5: Train model
print("\n[5/6] Training model...")
print("This will take 30-45 minutes. Please be patient...")
print("You can monitor progress below:\n")

# Import training libraries
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
import numpy as np

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

# Create data generators
print("Creating data generators...")
train_datagen = keras.preprocessing.image.ImageDataGenerator(
    rescale=1./127.5,
    preprocessing_function=lambda x: x - 1.0,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest',
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

num_classes = len(train_generator.class_indices)
print(f"\n✅ Data loaded:")
print(f"   Training samples: {train_generator.samples}")
print(f"   Validation samples: {val_generator.samples}")
print(f"   Number of classes: {num_classes}")

# Save class names
class_names = list(train_generator.class_indices.keys())
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"✅ Saved class names to class_names.txt")

# Build model
print("\nBuilding model...")
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model initially
base_model.trainable = False

model = keras.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("✅ Model built")
print(f"   Total parameters: {model.count_params():,}")

# Train
print("\n🚀 Starting training...")
print("=" * 70)

callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_accuracy',
        patience=3,
        restore_best_weights=True
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=2,
        min_lr=1e-7
    ),
    keras.callbacks.ModelCheckpoint(
        'best_model.h5',
        monitor='val_accuracy',
        save_best_only=True
    )
]

history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# Evaluate
print("\n" + "=" * 70)
print("Evaluating model...")
val_loss, val_acc = model.evaluate(val_generator)
print(f"\n✅ Training complete!")
print(f"   Validation Accuracy: {val_acc*100:.2f}%")
print(f"   Validation Loss: {val_loss:.4f}")

# Step 6: Save and deploy
print("\n[6/6] Deploying model...")

# Backup old model
if os.path.exists("plant_disease_model.h5"):
    os.rename("plant_disease_model.h5", "plant_disease_model_old_broken.h5")
    print("✅ Backed up old model")

# Save new model
model.save("plant_disease_model.h5")
print("✅ New model saved as: plant_disease_model.h5")

# Also save best model if it exists
if os.path.exists("best_model.h5"):
    import shutil
    shutil.copy("best_model.h5", "plant_disease_model_best.h5")
    print("✅ Best model also saved")

print("\n" + "=" * 70)
print("SUCCESS! MODEL TRAINED AND DEPLOYED")
print("=" * 70)
print(f"\nFinal Accuracy: {val_acc*100:.2f}%")
print(f"Classes: {num_classes}")
print(f"Model size: {os.path.getsize('plant_disease_model.h5') / (1024*1024):.1f} MB")

print("\nNext steps:")
print("1. Restart ML server: python app.py")
print("2. Test with different images")
print("3. Confidence should now be 85-95%")
print("4. Different images will give different results")

print("\n✅ DONE!")
