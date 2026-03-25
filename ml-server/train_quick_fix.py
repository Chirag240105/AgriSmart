"""
Quick training using existing PlantVillage dataset
Uses the dataset already in plantvillage-dataset/plantvillage dataset/color/
"""
import os
import sys
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
import numpy as np
from PIL import Image

print("=" * 70)
print("QUICK MODEL TRAINING - USING EXISTING DATASET")
print("=" * 70)

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

# Dataset path
TRAIN_DIR = "plantvillage-dataset/plantvillage dataset/color"

if not os.path.exists(TRAIN_DIR):
    print(f"❌ Dataset not found at: {TRAIN_DIR}")
    sys.exit(1)

# Check classes
class_folders = [d for d in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, d))]
print(f"\n✅ Found dataset with {len(class_folders)} classes")

# Count images
total_images = 0
for cls in class_folders:
    cls_path = os.path.join(TRAIN_DIR, cls)
    images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    total_images += len(images)

print(f"✅ Total images: {total_images:,}")

# Create data generators
print("\nCreating data generators...")

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
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

num_classes = len(train_generator.class_indices)

print(f"\n✅ Data ready:")
print(f"   Training samples: {train_generator.samples:,}")
print(f"   Validation samples: {val_generator.samples:,}")
print(f"   Number of classes: {num_classes}")

# Save class names
class_names = list(train_generator.class_indices.keys())
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"✅ Saved {len(class_names)} class names")

# Build model
print("\nBuilding MobileNetV2 model...")

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

# Train
print("\n" + "=" * 70)
print("TRAINING MODEL")
print("=" * 70)
print("This will take 30-45 minutes")
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
    os.rename("plant_disease_model.h5", "plant_disease_model_broken_backup.h5")
    print("✅ Backed up old broken model")

model.save("plant_disease_model.h5")
print(f"✅ New model saved: plant_disease_model.h5")
print(f"   Size: {os.path.getsize('plant_disease_model.h5') / (1024*1024):.1f} MB")

# Test with multiple samples
print("\n" + "=" * 70)
print("TESTING NEW MODEL WITH MULTIPLE SAMPLES")
print("=" * 70)

test_results = []

for i, sample_class in enumerate(list(train_generator.class_indices.keys())[:5]):
    sample_dir = os.path.join(TRAIN_DIR, sample_class)
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
        
        result = {
            'expected': sample_class,
            'predicted': predicted_class,
            'confidence': confidence * 100,
            'correct': predicted_class == sample_class
        }
        test_results.append(result)
        
        print(f"\nTest {i+1}:")
        print(f"   Expected: {sample_class}")
        print(f"   Predicted: {predicted_class}")
        print(f"   Confidence: {confidence*100:.1f}%")
        print(f"   {'✅ CORRECT!' if result['correct'] else '❌ WRONG'}")

# Summary
correct = sum(1 for r in test_results if r['correct'])
print(f"\n" + "=" * 70)
print(f"Test Accuracy: {correct}/{len(test_results)} = {correct/len(test_results)*100:.1f}%")
print(f"Average Confidence: {np.mean([r['confidence'] for r in test_results]):.1f}%")

print("\n" + "=" * 70)
print("SUCCESS! MODEL TRAINED AND READY")
print("=" * 70)

print(f"\nFinal Validation Accuracy: {val_acc*100:.2f}%")
print(f"Model saved: plant_disease_model.h5")

print("\nNext steps:")
print("1. Restart ML server:")
print("   python app.py")
print("\n2. Test with different images")
print("3. Each image should give DIFFERENT results")
print("4. Confidence should be 85-95%")

print("\n✅ DONE! Your model is ready for the hackathon!")
