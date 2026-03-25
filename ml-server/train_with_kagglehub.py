"""
Train model using kagglehub - Fast and efficient
No manual download needed!
"""
import os
import sys
import subprocess

print("=" * 70)
print("TRAINING MODEL WITH KAGGLEHUB")
print("=" * 70)

# Step 1: Install kagglehub
print("\n[1/5] Installing kagglehub...")
try:
    import kagglehub
    print("✅ kagglehub already installed")
except ImportError:
    print("Installing kagglehub...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
    import kagglehub
    print("✅ kagglehub installed")

# Step 2: Download dataset using kagglehub
print("\n[2/5] Downloading dataset with kagglehub...")
print("This is much faster than manual download!")

try:
    # Download latest version
    path = kagglehub.dataset_download("vipoooool/new-plant-diseases-dataset")
    print(f"✅ Dataset downloaded to: {path}")
except Exception as e:
    print(f"❌ Download failed: {e}")
    print("\nTrying alternative method...")
    
    # Alternative: Use opendatasets
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opendatasets"])
        import opendatasets as od
        
        print("Downloading with opendatasets...")
        od.download("https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
        path = "new-plant-diseases-dataset"
        print(f"✅ Dataset downloaded to: {path}")
    except Exception as e2:
        print(f"❌ Alternative also failed: {e2}")
        sys.exit(1)

# Step 3: Find training directory
print("\n[3/5] Locating training data...")

possible_subdirs = [
    "New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)/train",
    "New Plant Diseases Dataset(Augmented)/train",
    "train",
    "color",
]

train_dir = None
for subdir in possible_subdirs:
    full_path = os.path.join(path, subdir)
    if os.path.exists(full_path):
        # Check if it has class folders
        items = os.listdir(full_path)
        class_folders = [d for d in items if os.path.isdir(os.path.join(full_path, d))]
        if len(class_folders) > 10:
            train_dir = full_path
            print(f"✅ Found training data: {train_dir}")
            print(f"   Classes: {len(class_folders)}")
            break

if not train_dir:
    # Search recursively
    print("Searching recursively...")
    for root, dirs, files in os.walk(path):
        if len(dirs) > 30 and any('___' in d for d in dirs):
            train_dir = root
            print(f"✅ Found at: {train_dir}")
            break

if not train_dir:
    print("❌ Could not find training data")
    print(f"Downloaded to: {path}")
    print("Please check the structure manually")
    sys.exit(1)

# Step 4: Prepare for training
print("\n[4/5] Preparing to train...")
print("Importing TensorFlow (this may take a moment)...")

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
import numpy as np

print("✅ TensorFlow loaded")

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

print(f"\n✅ Data ready:")
print(f"   Training samples: {train_generator.samples}")
print(f"   Validation samples: {val_generator.samples}")
print(f"   Number of classes: {num_classes}")

# Save class names
class_names = list(train_generator.class_indices.keys())
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"✅ Saved {len(class_names)} class names")

# Build model
print("\nBuilding model...")

base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

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

print(f"✅ Model built")
print(f"   Total parameters: {model.count_params():,}")

# Step 5: Train
print("\n[5/5] Training model...")
print("=" * 70)
print("This will take 30-45 minutes")
print("Progress will be shown below:")
print("=" * 70)

callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_accuracy',
        patience=3,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=2,
        min_lr=1e-7,
        verbose=1
    ),
    keras.callbacks.ModelCheckpoint(
        'best_model.h5',
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
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
print("EVALUATION")
print("=" * 70)

val_loss, val_acc = model.evaluate(val_generator, verbose=0)

print(f"\n✅ Training Complete!")
print(f"   Validation Accuracy: {val_acc*100:.2f}%")
print(f"   Validation Loss: {val_loss:.4f}")

# Save model
print("\nSaving model...")

if os.path.exists("plant_disease_model.h5"):
    os.rename("plant_disease_model.h5", "plant_disease_model_old_broken.h5")
    print("✅ Backed up old model")

model.save("plant_disease_model.h5")
print(f"✅ New model saved: plant_disease_model.h5")
print(f"   Size: {os.path.getsize('plant_disease_model.h5') / (1024*1024):.1f} MB")

# Quick test
print("\n" + "=" * 70)
print("TESTING NEW MODEL")
print("=" * 70)

from PIL import Image

# Get a sample image
sample_class = list(train_generator.class_indices.keys())[0]
sample_dir = os.path.join(train_dir, sample_class)
sample_images = [f for f in os.listdir(sample_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]

if sample_images:
    sample_path = os.path.join(sample_dir, sample_images[0])
    
    # Load and preprocess
    img = Image.open(sample_path).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32)
    img_array = img_array / 127.5 - 1.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Predict
    predictions = model.predict(img_array, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    confidence = np.max(predictions[0])
    predicted_class = class_names[predicted_idx]
    
    print(f"\nTest Prediction:")
    print(f"   Sample: {os.path.basename(sample_path)}")
    print(f"   Predicted: {predicted_class}")
    print(f"   Confidence: {confidence*100:.1f}%")
    print(f"   Expected: {sample_class}")
    
    if predicted_class == sample_class:
        print("   ✅ CORRECT!")
    else:
        print("   ⚠️  Different (but this is just one test sample)")

print("\n" + "=" * 70)
print("SUCCESS! MODEL TRAINED AND READY")
print("=" * 70)

print(f"\nFinal Accuracy: {val_acc*100:.2f}%")
print(f"Model saved: plant_disease_model.h5")

print("\nNext steps:")
print("1. Restart ML server:")
print("   python app.py")
print("\n2. Test with different images")
print("3. Each image should give different results")
print("4. Confidence should be 85-95%")

print("\n✅ DONE! Your model is ready for production!")
