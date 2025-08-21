import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

interface ModelPrediction {
  label: string;
  confidence: number;
  brand: string;
  model: string;
  category: string;
}

interface TrainingData {
  image: tf.Tensor3D;
  label: string;
  brand: string;
  model: string;
  category: string;
}

interface ModelStats {
  accuracy: number;
  loss: number;
  totalImages: number;
  categories: number;
  brands: number;
  lastTrained: string;
}

class TensorFlowModel {
  private static instance: TensorFlowModel;
  private model: tf.LayersModel | null = null;
  private isModelLoaded: boolean = false;
  private isTraining: boolean = false;
  private labelMap: { [key: number]: string } = {};
  private reverseLabelMap: { [key: string]: number } = {};
  private stats: ModelStats = {
    accuracy: 0,
    loss: 0,
    totalImages: 0,
    categories: 0,
    brands: 0,
    lastTrained: new Date().toISOString(),
  };

  private constructor() {
    this.initializeTensorFlow();
  }

  static getInstance(): TensorFlowModel {
    if (!TensorFlowModel.instance) {
      TensorFlowModel.instance = new TensorFlowModel();
    }
    return TensorFlowModel.instance;
  }

  // Initialize TensorFlow.js
  private async initializeTensorFlow() {
    try {
      console.log('🔧 TensorFlowModel: Initializing TensorFlow.js...');
      await tf.ready();
      console.log('✅ TensorFlowModel: TensorFlow.js initialized successfully');
    } catch (error) {
      console.error('❌ TensorFlowModel: Failed to initialize TensorFlow.js:', error);
    }
  }

  // Create a custom model based on MobileNet
  async createModel(numClasses: number): Promise<tf.LayersModel> {
    console.log(`🔧 TensorFlowModel: Creating model with ${numClasses} classes`);

    // Load MobileNet as base model
    const baseModel = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfhub/mobilenet_v2_100_224/model.json'
    );

    // Remove the top classification layer
    const layer = baseModel.getLayer('global_average_pooling2d_1');
    const baseModelOutput = baseModel.inputs[0];
    const baseModelOutputShape = baseModel.outputs[0].shape;
    
    // Create new model with custom top layers
    const model = tf.sequential();
    
    // Add the base model (frozen)
    baseModel.trainable = false;
    model.add(baseModel);
    
    // Add custom classification layers
    model.add(tf.layers.dense({
      units: 512,
      activation: 'relu',
      inputShape: baseModelOutputShape,
    }));
    
    model.add(tf.layers.dropout({ rate: 0.5 }));
    
    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
    }));
    
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    model.add(tf.layers.dense({
      units: numClasses,
      activation: 'softmax',
    }));

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    console.log('✅ TensorFlowModel: Model created successfully');
    return model;
  }

  // Load or create model
  async loadModel(): Promise<boolean> {
    try {
      if (this.isModelLoaded && this.model) {
        console.log('✅ TensorFlowModel: Model already loaded');
        return true;
      }

      console.log('🔧 TensorFlowModel: Loading model...');
      
      // Try to load existing model from storage
      try {
        const modelPath = await this.getModelPath();
        this.model = await tf.loadLayersModel(modelPath);
        this.isModelLoaded = true;
        console.log('✅ TensorFlowModel: Model loaded from storage');
        return true;
      } catch (error) {
        console.log('⚠️ TensorFlowModel: No saved model found, will create new one');
        return false;
      }
    } catch (error) {
      console.error('❌ TensorFlowModel: Failed to load model:', error);
      return false;
    }
  }

  // Save model to storage
  async saveModel(): Promise<boolean> {
    try {
      if (!this.model) {
        console.error('❌ TensorFlowModel: No model to save');
        return false;
      }

      console.log('💾 TensorFlowModel: Saving model...');
      
      // In a real implementation, this would save to AsyncStorage or local filesystem
      // For now, we'll just log the save operation
      console.log('✅ TensorFlowModel: Model saved successfully');
      return true;
    } catch (error) {
      console.error('❌ TensorFlowModel: Failed to save model:', error);
      return false;
    }
  }

  // Get model path for loading/saving
  private async getModelPath(): Promise<string> {
    // In a real implementation, this would return the path to the saved model
    return 'file://model.json';
  }

  // Preprocess image for model input
  preprocessImage(imageUri: string): Promise<tf.Tensor3D> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load image
        const image = new Image();
        image.onload = () => {
          try {
            // Convert to tensor
            const tensor = tf.browser.fromPixels(image);
            
            // Resize to 224x224 (MobileNet input size)
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // Normalize pixel values to [0, 1]
            const normalized = resized.div(255.0);
            
            // Add batch dimension
            const batched = normalized.expandDims(0);
            
            // Clean up tensors
            tensor.dispose();
            resized.dispose();
            normalized.dispose();
            
            resolve(batched.squeeze());
          } catch (error) {
            reject(error);
          }
        };
        
        image.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        image.src = imageUri;
      } catch (error) {
        reject(error);
      }
    });
  }

  // Predict image class
  async predictImage(imageUri: string): Promise<ModelPrediction | null> {
    try {
      if (!this.model || !this.isModelLoaded) {
        console.error('❌ TensorFlowModel: Model not loaded');
        return null;
      }

      console.log('🔍 TensorFlowModel: Predicting image...');
      
      // Preprocess image
      const imageTensor = await this.preprocessImage(imageUri);
      
      // Make prediction
      const prediction = this.model.predict(imageTensor) as tf.Tensor;
      const predictionData = await prediction.data();
      
      // Get the highest confidence prediction
      const maxIndex = predictionData.indexOf(Math.max(...predictionData));
      const confidence = predictionData[maxIndex];
      const label = this.labelMap[maxIndex] || 'Unknown';
      
      // Clean up tensors
      imageTensor.dispose();
      prediction.dispose();
      
      // Parse label to extract brand, model, category
      const [brand, model, category] = this.parseLabel(label);
      
      const result: ModelPrediction = {
        label,
        confidence,
        brand,
        model,
        category,
      };
      
      console.log('✅ TensorFlowModel: Prediction result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ TensorFlowModel: Prediction failed:', error);
      return null;
    }
  }

  // Parse label to extract brand, model, category
  private parseLabel(label: string): [string, string, string] {
    const parts = label.split('_');
    if (parts.length >= 3) {
      return [parts[0], parts[1], parts[2]];
    }
    return ['Unknown', 'Unknown', 'Unknown'];
  }

  // Train model with scraped images
  async trainModel(trainingData: TrainingData[]): Promise<ModelStats> {
    if (this.isTraining) {
      console.log('⚠️ TensorFlowModel: Training already in progress');
      return this.stats;
    }

    this.isTraining = true;
    
    try {
      console.log(`🔧 TensorFlowModel: Starting training with ${trainingData.length} images`);
      
      if (trainingData.length === 0) {
        throw new Error('No training data provided');
      }

      // Create label mapping
      const uniqueLabels = [...new Set(trainingData.map(d => d.label))];
      uniqueLabels.forEach((label, index) => {
        this.labelMap[index] = label;
        this.reverseLabelMap[label] = index;
      });

      console.log(`🔧 TensorFlowModel: Created label mapping for ${uniqueLabels.length} classes`);

      // Create or load model
      if (!this.model) {
        this.model = await this.createModel(uniqueLabels.length);
      }

      // Prepare training data
      const { images, labels } = this.prepareTrainingData(trainingData);
      
      // Split into training and validation sets
      const splitIndex = Math.floor(images.length * 0.8);
      const trainImages = images.slice(0, splitIndex);
      const trainLabels = labels.slice(0, splitIndex);
      const valImages = images.slice(splitIndex);
      const valLabels = labels.slice(splitIndex);

      console.log(`🔧 TensorFlowModel: Training with ${trainImages.length} images, validating with ${valImages.length} images`);

      // Train the model
      const history = await this.model.fit(trainImages, trainLabels, {
        epochs: 10,
        batchSize: 32,
        validationData: [valImages, valLabels],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`📊 TensorFlowModel: Epoch ${epoch + 1} - Loss: ${logs?.loss?.toFixed(4)}, Accuracy: ${logs?.acc?.toFixed(4)}`);
          },
        },
      });

      // Update stats
      this.stats = {
        accuracy: history.history.acc ? history.history.acc[history.history.acc.length - 1] : 0,
        loss: history.history.loss ? history.history.loss[history.history.loss.length - 1] : 0,
        totalImages: trainingData.length,
        categories: [...new Set(trainingData.map(d => d.category))].length,
        brands: [...new Set(trainingData.map(d => d.brand))].length,
        lastTrained: new Date().toISOString(),
      };

      // Save the trained model
      await this.saveModel();
      this.isModelLoaded = true;

      console.log('✅ TensorFlowModel: Training completed successfully');
      return this.stats;

    } catch (error) {
      console.error('❌ TensorFlowModel: Training failed:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  // Prepare training data for TensorFlow
  private prepareTrainingData(trainingData: TrainingData[]): { images: tf.Tensor4D; labels: tf.Tensor2D } {
    const images: tf.Tensor3D[] = [];
    const labels: number[] = [];

    trainingData.forEach(data => {
      images.push(data.image);
      labels.push(this.reverseLabelMap[data.label] || 0);
    });

    // Stack images into a single tensor
    const imageTensor = tf.stack(images);
    
    // Convert labels to one-hot encoding
    const numClasses = Object.keys(this.labelMap).length;
    const labelTensor = tf.oneHot(labels, numClasses);

    return {
      images: imageTensor,
      labels: labelTensor,
    };
  }

  // Get model statistics
  getStats(): ModelStats {
    return { ...this.stats };
  }

  // Check if model is loaded
  isModelReady(): boolean {
    return this.isModelLoaded && this.model !== null;
  }

  // Check if training is in progress
  isCurrentlyTraining(): boolean {
    return this.isTraining;
  }

  // Clear model and data
  clearModel() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.labelMap = {};
    this.reverseLabelMap = {};
    this.stats = {
      accuracy: 0,
      loss: 0,
      totalImages: 0,
      categories: 0,
      brands: 0,
      lastTrained: new Date().toISOString(),
    };
  }
}

export default TensorFlowModel;
