import tensorflow as tf
import os
import json
import matplotlib.pyplot as plt

# Directory of the models and training history saved
save_dir = 'models/trained_model'

try:
    # Load the initial model with custom loading configuration
    initial_model = tf.keras.models.load_model(
        os.path.join(save_dir, 'initial_model.keras'),
        compile=False  # Try loading without compilation first
    )
    print("Initial Model Summary:")
    initial_model.summary()
except Exception as e:
    print(f"Error loading initial model: {str(e)}")
    initial_model = None

try:
    # Load the fine-tuned model with custom loading configuration
    fine_tuned_model = tf.keras.models.load_model(
        os.path.join(save_dir, 'fine_tuned_model.keras'),
        compile=False
    )
    print("\nFine-Tuned Model Summary:")
    fine_tuned_model.summary()
except Exception as e:
    print(f"Error loading fine-tuned model: {str(e)}")
    fine_tuned_model = None

try:
    # Load the best model with custom loading configuration
    best_model = tf.keras.models.load_model(
        os.path.join(save_dir, 'best_model.keras'),
        compile=False
    )
    print("\nBest Model Summary:")
    best_model.summary()
except Exception as e:
    print(f"Error loading best model: {str(e)}")
    best_model = None

# Load the training history for the initial model
with open(os.path.join(save_dir, 'initial_model_history.json'), 'r') as f:
    history_initial = json.load(f)

# Load the training history for the fine-tuned model
with open(os.path.join(save_dir, 'fine_tuned_model_history.json'), 'r') as f:
    history_fine_tune = json.load(f)

# Load the training history for the best model (if available)
best_model_history_path = os.path.join(save_dir, 'best_model_history.json')
if os.path.exists(best_model_history_path):
    with open(best_model_history_path, 'r') as f:
        history_best_model = json.load(f)
else:
    history_best_model = None  # Handle case where history does not exist

# Plot training & validation accuracy values 
# for the initial model
plt.figure(figsize=(10, 6)) 
plt.plot(history_initial['accuracy'], label='Train Accuracy (Initial)')
plt.plot(history_initial['val_accuracy'], label='Validation Accuracy (Initial)')
plt.title('Initial Model Accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.xticks(range(len(history_initial['accuracy'])))
plt.legend(loc='lower right')
plt.grid()
plt.show() 

# for the fine-tuned model's
plt.figure(figsize=(10, 6))  # Create another new figure
plt.plot(history_fine_tune['accuracy'], label='Train Accuracy (Fine-Tuned)')
plt.plot(history_fine_tune['val_accuracy'], label='Validation Accuracy (Fine-Tuned)')
plt.title('Fine-Tuned Model Accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.xticks(range(len(history_fine_tune['accuracy'])))
plt.legend(loc='lower right')
plt.grid()
plt.show()

# If best model history exists, plot it
if history_best_model:
    plt.figure(figsize=(10, 6))  # Create a new figure
    plt.plot(history_best_model['accuracy'], label='Train Accuracy (Best Model)')
    plt.plot(history_best_model['val_accuracy'], label='Validation Accuracy (Best Model)')
    plt.title('Best Model Accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.xticks(range(len(history_best_model['accuracy'])))
    plt.legend(loc='lower right')
    plt.grid()
    plt.show()  # Display the third plot
else:
    print("Best model history not found.")
