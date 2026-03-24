import os

# Set Kaggle credentials directly — no prompt needed
os.environ['KAGGLE_USERNAME'] = 'jackstealer'
os.environ['KAGGLE_KEY'] = 'e7296d20bc4c86f04ec4d9abc7588724'

import tensorflow as tf
import numpy as np
import pathlib

MODEL_PATH = "plant_disease_model.h5"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_FROZEN = 5
EPOCHS_FINE_TUNE = 5
NUM_CLASSES = 38
DATASET_DIR = "plantvillage-dataset"

def download_dataset():
    if os.path.exists(DATASET_DIR):
        print("Dataset already exists, skipping download...")
        return
    print("Downloading PlantVillage dataset from Kaggle...")
    import opendatasets as od
    od.download("https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset")
    print("Download complete!")

def get_datasets():
    # Find the image directory
    for root, dirs, files in os.walk(DATASET_DIR):
        for d in dirs:
            test_path = os.path.join(root, d)
            subdirs = [x for x in os.listdir(test_path) if os.path.isdir(os.path.join(test_path, x))]
            if len(subdirs) >= 30:
                print(f"Found dataset at: {test_path}")
                return test_path
    return DATASET_DIR

def build_model(num_classes):
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    return tf.keras.Model(inputs, outputs), base_model

print("Setting up dataset...")
download_dataset()
data_dir = get_datasets()
print(f"Using data from: {data_dir}")

# Load dataset using image_dataset_from_directory
full_ds = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="int",
    shuffle=True,
    seed=42
)

class_names = full_ds.class_names
num_classes = len(class_names)
print(f"Found {num_classes} classes: {class_names[:5]}...")

# Save class names for app.py to use
with open("class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")
print("Saved class names to class_names.txt")

# Split into train/val
total = tf.data.experimental.cardinality(full_ds).numpy()
train_size = int(total * 0.8)
val_size = total - train_size

AUTOTUNE = tf.data.AUTOTUNE

def augment(image, label):
    image = tf.image.random_flip_left_right(image)
    image = tf.image.random_brightness(image, 0.2)
    image = tf.image.random_contrast(image, 0.8, 1.2)
    return image, label

train_ds = full_ds.take(train_size).map(augment).prefetch(AUTOTUNE)
val_ds = full_ds.skip(train_size).prefetch(AUTOTUNE)

print(f"Train batches: {train_size}, Val batches: {val_size}")

# Build model
model, base_model = build_model(num_classes)
model.summary()

# Phase 1 — train top layers
print(f"\nPhase 1: Training top layers for {EPOCHS_FROZEN} epochs...")
model.compile(
    optimizer=tf.keras.optimizers.Adam(0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FROZEN)

# Phase 2 — fine-tune last 30 layers
print(f"\nPhase 2: Fine-tuning last 30 base layers for {EPOCHS_FINE_TUNE} epochs...")
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(0.0001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FINE_TUNE)

model.save(MODEL_PATH)
print(f"\nModel saved to {MODEL_PATH}")
print("Training complete!")