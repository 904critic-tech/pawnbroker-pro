# OCR Text Extraction System Design
## For Pawnshop Item Recognition - NO MOCK DATA

### Overview
The OCR (Optical Character Recognition) system will extract text from product images to identify:
- Brand names from product labels
- Model numbers from serial plates
- Product names from packaging
- Specifications from product stickers

### Technical Architecture

#### 1. OCR Technology Selection
**Primary Choice: Google ML Kit Vision API**
- ✅ High accuracy for product text
- ✅ Offline capability after initial download
- ✅ Free tier available
- ✅ React Native support via @react-native-ml-kit/text-recognition

**Fallback: Tesseract.js**
- For cases where ML Kit fails
- Open source, no API limits
- Can be fine-tuned for specific fonts

#### 2. Camera Integration
```javascript
// Expo Camera with ML Kit
import { Camera } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Camera capture and OCR processing
};
```

#### 3. Text Processing Pipeline
```
Image Capture → OCR Extraction → Text Preprocessing → Brand/Model Extraction → Search
```

### Implementation Plan

#### Phase 1: Basic OCR Setup
1. **Install Dependencies**
   ```bash
   npm install expo-camera
   npm install @react-native-ml-kit/text-recognition
   ```

2. **Camera Permissions**
   ```javascript
   const requestCameraPermission = async () => {
     const { status } = await Camera.requestCameraPermissionsAsync();
     setHasPermission(status === 'granted');
   };
   ```

3. **Basic OCR Implementation**
   ```javascript
   const processImage = async (imageUri) => {
     try {
       const result = await TextRecognition.recognize(imageUri);
       return result.text;
     } catch (error) {
       console.error('OCR failed:', error);
       return null;
     }
   };
   ```

#### Phase 2: Text Preprocessing
```javascript
const preprocessText = (rawText) => {
  // Remove noise, normalize spacing
  const cleaned = rawText
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleaned;
};
```

#### Phase 3: Integration with LearningService
```javascript
const extractProductInfo = async (imageUri) => {
  // Step 1: OCR extraction
  const rawText = await processImage(imageUri);
  if (!rawText) return null;
  
  // Step 2: Text preprocessing
  const cleanText = preprocessText(rawText);
  
  // Step 3: Brand/model extraction using existing LearningService
  const learningService = LearningService.getInstance();
  const { brand, model } = learningService.extractBrandAndModelFromTitle(cleanText);
  
  // Step 4: Confidence scoring
  const confidence = calculateOCRConfidence(rawText, brand, model);
  
  return { brand, model, confidence, extractedText: cleanText };
};
```

### OCR Optimization Strategies

#### 1. Image Preprocessing
```javascript
const optimizeImageForOCR = (imageUri) => {
  // Enhance contrast, adjust brightness
  // Crop to focus area
  // Convert to grayscale if needed
  return processedImageUri;
};
```

#### 2. Multi-Region OCR
```javascript
const performRegionalOCR = async (imageUri) => {
  // Extract text from different regions:
  // - Top area (brand logos)
  // - Center (product name)
  // - Bottom (model numbers, specs)
  
  const regions = defineTextRegions(imageUri);
  const results = await Promise.all(
    regions.map(region => TextRecognition.recognize(region))
  );
  
  return combineRegionalResults(results);
};
```

#### 3. Confidence Scoring
```javascript
const calculateOCRConfidence = (rawText, brand, model) => {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on:
  // - Text clarity (less noise = higher confidence)
  // - Brand recognition success
  // - Model number patterns
  // - Known product name patterns
  
  if (brand && brand !== 'Unknown') confidence += 0.3;
  if (model && model !== 'Unknown') confidence += 0.2;
  
  return Math.min(confidence, 0.95);
};
```

### Real Data Integration

#### 1. Learning from OCR Results
```javascript
const learnFromOCRSuccess = async (extractedText, confirmedBrand, confirmedModel) => {
  // When user confirms OCR results are correct,
  // learn the text patterns for future recognition
  const learningService = LearningService.getInstance();
  
  // Create mock item array for learning
  const mockItems = [{
    title: extractedText,
    // Other required fields...
  }];
  
  await learningService.learnFromSearch(extractedText, mockItems);
};
```

#### 2. OCR Pattern Storage
```javascript
interface OCRPattern {
  extractedText: string;
  confirmedBrand: string;
  confirmedModel: string;
  confidence: number;
  timestamp: number;
}

class OCRLearningService {
  private patterns: OCRPattern[] = [];
  
  addPattern(pattern: OCRPattern) {
    this.patterns.push(pattern);
    this.saveToStorage();
  }
  
  findSimilarPatterns(text: string): OCRPattern[] {
    // Find patterns with similar text for confidence boosting
    return this.patterns.filter(p => 
      this.calculateTextSimilarity(p.extractedText, text) > 0.7
    );
  }
}
```

### Error Handling & Fallbacks

#### 1. OCR Failure Handling
```javascript
const handleOCRWithFallbacks = async (imageUri) => {
  // Primary: ML Kit
  try {
    const mlKitResult = await TextRecognition.recognize(imageUri);
    if (mlKitResult.text.length > 5) return mlKitResult.text;
  } catch (error) {
    console.log('ML Kit failed, trying fallback...');
  }
  
  // Fallback: Tesseract
  try {
    const tesseractResult = await performTesseractOCR(imageUri);
    return tesseractResult;
  } catch (error) {
    console.log('All OCR methods failed');
    return null;
  }
};
```

#### 2. User Correction Interface
```javascript
const OCRResultScreen = ({ extractedText, suggestedBrand, suggestedModel }) => {
  const [userBrand, setUserBrand] = useState(suggestedBrand);
  const [userModel, setUserModel] = useState(suggestedModel);
  
  const handleConfirm = () => {
    // Learn from user corrections
    learnFromOCRSuccess(extractedText, userBrand, userModel);
    
    // Continue to search with corrected info
    proceedToSearch(userBrand, userModel);
  };
  
  return (
    <View>
      <Text>Extracted: {extractedText}</Text>
      <TextInput value={userBrand} onChangeText={setUserBrand} placeholder="Brand" />
      <TextInput value={userModel} onChangeText={setUserModel} placeholder="Model" />
      <Button onPress={handleConfirm}>Confirm & Search</Button>
    </View>
  );
};
```

### Performance Considerations

#### 1. Offline Operation
- Download ML Kit models on app install
- Cache OCR patterns locally
- No internet required for basic OCR

#### 2. Memory Management
- Process images at optimal resolution (not full camera resolution)
- Release image resources after processing
- Limit pattern storage to prevent memory issues

#### 3. Battery Optimization
- Use camera efficiently (quick capture, immediate processing)
- Process images in background thread
- Minimize continuous camera usage

### Success Metrics

#### 1. OCR Accuracy
- Target: 80%+ brand recognition accuracy
- Target: 70%+ model recognition accuracy
- Measured against user confirmations

#### 2. Performance
- Target: <3 seconds from capture to result
- Target: <100MB memory usage during processing
- Target: Works in various lighting conditions

#### 3. User Experience
- Clear guidance for optimal photo angles
- Quick feedback on image quality
- Easy correction interface for mistakes

### Next Steps for Implementation

1. ✅ **Design Complete** - This document
2. ⏳ **Install Camera & OCR packages**
3. ⏳ **Create basic CameraScreen**
4. ⏳ **Implement text extraction**
5. ⏳ **Integrate with LearningService**
6. ⏳ **Add error handling & fallbacks**
7. ⏳ **Test with real product images**
8. ⏳ **Optimize for accuracy and performance**

### Critical Requirements
- ❗ **NO MOCK DATA**: All OCR patterns learned from real user interactions
- ❗ **OFFLINE CAPABLE**: Must work without internet after initial setup
- ❗ **REAL-TIME LEARNING**: Improve accuracy based on user corrections
- ❗ **MOBILE OPTIMIZED**: Fast processing on mobile devices
