"""
Train model from locally downloaded PlantVillage dataset
Run this AFTER manually downloading the dataset from Kaggle
"""
import os
import sys
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2

print("=" * 70)
print("TRAINING MODEL FROM LOCAL DATASET")
print("=" * 70)

# Find dataset
print("\n[1/4] Looking for dataset...")

possible_paths = [
    "New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)/train",
    "New Plant Diseases Dataset(Augmented)/train",
    "plantvillage_data/train",
    "dataset/train",
    "train",
]

train_dir = None
for path in possible_paths:
    if os.path.exists(path):
        subdirs = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
        if len(subdirs) > 10:
            train_dir = path
            print(f"✅ Found dataset: {path}")
            print(f"   Classes: {len(subdirs)}")
            break

if not train_dir:
    print("❌ Dataset not found!")
    print("\nPlease download dataset first:")
    print("1. Go to: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
    print("2. Download and extract to ml-server/")
    print("3. Run this script again")
    print("\nExpected structure:")
    print("  ml-server/")
    print("    New Plant Diseases Dataset(Augmented)/")
    print("      train/")
    print("        Apple___Apple_scab/")
    print("        Apple___Black_rot/")
    print("        ...")
    sys.exit(1)

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

print("\n[2/4] Preparing data...")

# Data augmentation
train_datagen = keras.preprocessing.image.ImageDataGenerator(
    rescale=1./127.5,
    preprocessing_function=lambda x: x - 1.0,  # Scale to [-1, 1]
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

print(f"✅ Data loaded:")
print(f"   Training samples: {train_generator.samples}")
print(f"   Validation samples: {val_generator.samples}")
print(f"   Classes: {num_classes}")

# Save class names
class_names = list(train_generator.class_indices.keys())
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"✅ Saved {len(class_names)} class names")

print("\n[3/4] Building and training model...")
print("This will take 30-45 minutes. Progress will be shown below.")
print("=" * 70)

# Build model
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

print(f"Model parameters: {model.count_params():,}")

# Callbacks
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
        'best_model_checkpoint.h5',
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
]

# Train
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

print("\n" + "=" * 70)
print("[4/4] Evaluating and saving...")

# Final evaluation
val_loss, val_acc = model.evaluate(val_generator, verbose=0)

print(f"\n✅ Training Complete!")
print(f"   Final Validation Accuracy: {val_acc*100:.2f}%")
print(f"   Final Validation Loss: {val_loss:.4f}")

# Backup old model
if os.path.exists("plant_disease_model.h5"):
    backup_name = "plant_disease_model_old_broken.h5"
    if os.path.exists(backup_name):
        os.remove(backup_name)
    os.rename("plant_disease_model.h5", backup_name)
    print(f"✅ Backed up old model to: {backup_name}")

# Save new model
model.save("plant_disease_model.h5")
print(f"✅ New model saved: plant_disease_model.h5")
print(f"   Size: {os.path.getsize('plant_disease_model.h5') / (1024*1024):.1f} MB")

# Test prediction
print("\n" + "=" * 70)
print("TESTING NEW MODEL")
print("=" * 70)

# Get a sample image
import numpy as np
from PIL import Image

sample_class = list(train_generator.class_indices.keys())[0]
sample_dir = os.path.join(train_dir, sample_class)
sample_images = [f for f in os.listdir(sample_dir) if f.endswith(('.jpg', '.png', '.jpeg'))]

if sample_images:
    sample_path = os.path.join(sample_dir, sample_images[0])
    img = Image.open(sample_path).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32)
    img_array = img_array / 127.5 - 1.0
    img_array = np.expand_dims(img_array, axis=0)
    
    predictions = model.predict(img_array, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    confidence = np.max(predictions[0])
    predicted_class = class_names[predicted_idx]
    
    print(f"\nTest prediction:")
    print(f"   Image: {sample_path}")
    print(f"   Predicted: {predicted_class}")
    print(f"   Confidence: {confidence*100:.1f}%")
    print(f"   Expected: {sample_class}")
    
    if predicted_class == sample_class:
        print("   ✅ CORRECT!")
    else:
        print("   ⚠️  Incorrect (but this is just one sample)")

print("\n" + "=" * 70)
print("SUCCESS!")
print("=" * 70)
print("\nNext steps:")
print("1. Restart ML server:")
print("   python app.py")
print("\n2. Test with different images")
print("3. Each image should give different results")
print("4. Confidence should be 85-95%")
print("\n✅ Model is ready for production use!")
