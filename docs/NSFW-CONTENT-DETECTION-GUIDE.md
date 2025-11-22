# NSFW Content Detection Implementation Guide

## Overview

This guide documents the integration of **NSFW.js** for client-side inappropriate content detection in profile picture uploads. The system uses TensorFlow.js to analyze images locally in the browser before upload, providing real-time content moderation.

## Features

✅ **Client-side detection** - No images sent to external servers (privacy-focused)
✅ **Real-time analysis** - Instant feedback during image upload
✅ **Multiple content categories** - Detects porn, hentai, and suggestive content
✅ **Customizable thresholds** - Adjust sensitivity levels
✅ **User-friendly warnings** - Clear modal with community guidelines
✅ **Bypass option** - Users can acknowledge and proceed (for false positives)
✅ **Dark theme support** - Consistent UI across themes

## Technologies Used

- **NSFW.js** v4.0+ - Content classification library
- **TensorFlow.js** - Machine learning framework
- **MobileNetV2** - Lightweight neural network model
- **React/TypeScript** - Frontend framework

## Architecture

### Detection Categories & Thresholds

```typescript
{
  porn: 0.3,      // 30% confidence - Explicit sexual content
  sexy: 0.5,      // 50% confidence - Suggestive/provocative content  
  hentai: 0.4,    // 40% confidence - Animated explicit content
}
```

### Detection Flow

```
1. User selects image
   ↓
2. Image cropping interface
   ↓
3. User crops/positions image
   ↓
4. NSFW detection analysis (client-side)
   ↓
5a. Safe content → Upload proceeds
5b. Inappropriate content → Warning modal displayed
   ↓
6. User acknowledges or cancels
   ↓
7. Final upload or re-selection
```

## Installation

### 1. Install Dependencies

```bash
cd client
npm install nsfwjs @tensorflow/tfjs
```

### 2. Download Model Files

The NSFW.js model files need to be placed in `client/public/models/` directory:

**Option A: Download from CDN**

```bash
# Create models directory
mkdir -p client/public/models

# Download model files
cd client/public/models

# Download model.json
curl -O https://nsfwjs.com/model/model.json

# Download weight files (group1-shard files)
curl -O https://nsfwjs.com/model/group1-shard1of2
curl -O https://nsfwjs.com/model/group1-shard2of2
```

**Option B: Manual Download**

1. Visit: https://github.com/infinitered/nsfwjs/tree/master/example/nsfw_demo/public/model
2. Download all files from the model directory
3. Place them in `client/public/models/`

**Required files:**
- `model.json` - Model architecture
- `group1-shard1of2` - Model weights (part 1)
- `group1-shard2of2` - Model weights (part 2)

### 3. Verify Installation

Your directory structure should look like:

```
client/
├── public/
│   ├── models/
│   │   ├── model.json
│   │   ├── group1-shard1of2
│   │   └── group1-shard2of2
│   └── ...
├── src/
│   ├── components/
│   │   └── Auth/
│   │       ├── Register.tsx (updated)
│   │       ├── ImageCropper.tsx
│   │       ├── NSFWWarningModal.tsx (new)
│   │       └── NSFWWarningModal.css (new)
│   └── utils/
│       └── nsfwDetector.ts (new)
└── package.json
```

## File Descriptions

### Core Files

#### `client/src/utils/nsfwDetector.ts`
- **Purpose**: Singleton NSFW detection service
- **Features**:
  - Lazy-loads TensorFlow.js model
  - Analyzes images for inappropriate content
  - Returns detailed predictions with confidence scores
  - Handles File, Blob, and HTMLImageElement inputs

#### `client/src/components/Auth/NSFWWarningModal.tsx`
- **Purpose**: Warning modal for inappropriate content
- **Features**:
  - Displays detected issues with confidence scores
  - Shows community guidelines
  - Requires user acknowledgment
  - Allows bypass for false positives

#### `client/src/components/Auth/NSFWWarningModal.css`
- **Purpose**: Styling for warning modal
- **Features**:
  - Responsive design
  - Dark theme support
  - Animated entrance
  - Accessible UI

#### `client/src/components/Auth/Register.tsx` (Modified)
- **Changes**:
  - Integrated NSFW detection in image upload flow
  - Added analyzing state with loading spinner
  - Connected warning modal to upload process
  - Error handling for detection failures

## Usage

### Basic Integration

```typescript
import { nsfwDetector } from '../../utils/nsfwDetector';

// Analyze an image
const result = await nsfwDetector.analyzeImage(imageBlob);

if (result.isNSFW) {
  console.log('Inappropriate content detected!');
  console.log('Warnings:', result.warnings);
  console.log('Highest risk:', result.highestRisk);
} else {
  console.log('Image is safe');
}
```

### Detection Result Structure

```typescript
interface DetectionResult {
  isNSFW: boolean;           // Overall safety flag
  predictions: Array<{       // All category predictions
    className: string;       // 'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy'
    probability: number;     // Confidence score (0-1)
  }>;
  highestRisk: {            // Highest scoring category
    category: string;
    probability: number;
  };
  warnings: string[];       // User-friendly warning messages
}
```

## Configuration

### Adjusting Thresholds

Edit `client/src/utils/nsfwDetector.ts`:

```typescript
private readonly THRESHOLDS = {
  porn: 0.3,      // Increase for less strict detection
  sexy: 0.5,      // Decrease for more strict detection
  hentai: 0.4,
};
```

**Recommended ranges:**
- **Strict**: 0.2 - 0.3
- **Moderate**: 0.3 - 0.5 (default)
- **Lenient**: 0.5 - 0.7

### Model Loading Options

The detector uses the MobileNetV2 model by default for better performance:

```typescript
this.model = await nsfwjs.load('/models/', { type: 'graph' });
```

**Alternative models:**
- `{ type: 'graph' }` - MobileNetV2 (faster, smaller)
- Without options - InceptionV3 (more accurate, larger)

## Performance

### Model Size
- **MobileNetV2**: ~4.5 MB
- **InceptionV3**: ~17 MB

### Detection Speed
- **First detection**: 2-5 seconds (model loading)
- **Subsequent detections**: <1 second

### Best Practices
- Preload model on app initialization for faster first use
- Model is cached after first load
- Detection runs entirely in browser (no server calls)

## Testing

### Test Different Image Types

```typescript
// Test with safe image
const safeResult = await nsfwDetector.analyzeImage(safeImageBlob);
console.assert(!safeResult.isNSFW, 'Safe image should pass');

// Test with inappropriate image
const nsfwResult = await nsfwDetector.analyzeImage(nsfwImageBlob);
console.assert(nsfwResult.isNSFW, 'NSFW image should be detected');
```

### Manual Testing Checklist

- [ ] Upload safe profile picture → Should allow upload
- [ ] Upload inappropriate image → Should show warning modal
- [ ] Click "Choose Different Image" → Should reset upload
- [ ] Acknowledge and continue → Should allow upload with warning
- [ ] Test with various image formats (JPEG, PNG, WebP)
- [ ] Test dark theme compatibility
- [ ] Test mobile responsiveness
- [ ] Test slow network (model loading)

## Troubleshooting

### Model Not Loading

**Error**: `Failed to load NSFW detection model`

**Solutions**:
1. Verify model files are in `client/public/models/`
2. Check browser console for 404 errors
3. Ensure model files are served correctly (check build output)
4. Clear browser cache and reload

### Detection Always Passing/Failing

**Issue**: All images marked as safe/unsafe

**Solutions**:
1. Check threshold values in `nsfwDetector.ts`
2. Verify model files are not corrupted
3. Test with known images
4. Check browser console for errors

### Slow Performance

**Issue**: Detection takes too long

**Solutions**:
1. Ensure MobileNetV2 model is being used
2. Preload model on app initialization
3. Check if images are too large (resize before detection)
4. Verify TensorFlow.js is using WebGL backend

## Security Considerations

### Client-Side Only
- ✅ Images never leave user's browser during detection
- ✅ No third-party API calls for content analysis
- ⚠️ Users can bypass warnings (requires acknowledgment)
- ⚠️ Server-side validation still recommended

### Server-Side Validation (Recommended)

For production, consider adding server-side detection:

```javascript
// server/routes/authRoutes.js
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');

// Load model once on server startup
let model;
(async () => {
  model = await nsfw.load();
})();

// In upload handler
const predictions = await model.classify(imageBuffer);
// Check predictions and reject if needed
```

## Future Improvements

### Potential Enhancements

1. **Additional Detection**
   - Violence detection
   - Gore/disturbing content
   - Hate symbols
   - Drug-related imagery

2. **Enhanced UX**
   - Progressive model loading with progress bar
   - More detailed feedback on detection results
   - Blur preview of detected content
   - Appeal process for false positives

3. **Performance**
   - WebWorker for background processing
   - Image pre-processing optimization
   - Model quantization for smaller size
   - Cache predictions for recently analyzed images

4. **Analytics**
   - Track detection accuracy
   - Monitor false positive rate
   - Log user bypass patterns
   - Performance metrics

## API Reference

### nsfwDetector

#### Methods

**`loadModel(): Promise<void>`**
- Loads the NSFW detection model
- Called automatically on first use
- Cached after first load

**`analyzeImage(image: HTMLImageElement | File | Blob): Promise<DetectionResult>`**
- Analyzes image for inappropriate content
- Automatically loads model if not loaded
- Returns detailed detection results

**`preload(): Promise<void>`**
- Preloads model for faster first detection
- Optional - called in app initialization
- Fails silently if model unavailable

**`isReady(): boolean`**
- Checks if model is loaded and ready
- Returns `true` if ready, `false` otherwise

## Support

### Common Questions

**Q: Can users upload inappropriate images?**
A: Yes, warnings can be bypassed. Implement server-side validation for enforcement.

**Q: How accurate is the detection?**
A: ~90% accuracy. False positives can occur with artistic content, swimwear, etc.

**Q: Does it work offline?**
A: Yes, after model is cached. Initial load requires internet.

**Q: What about GIFs and videos?**
A: Currently only static images. Video detection requires frame extraction.

**Q: Is it GDPR compliant?**
A: Yes, all processing is client-side. No data sent to external servers.

### Resources

- **NSFW.js GitHub**: https://github.com/infinitered/nsfwjs
- **TensorFlow.js Docs**: https://www.tensorflow.org/js
- **Model Details**: https://nsfwjs.com/

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- MobileNetV2 model integration
- Client-side detection
- Warning modal with bypass option
- Dark theme support
- TypeScript types

---

**Note**: This is a content moderation tool, not a replacement for human judgment. Always maintain community guidelines and review processes for uploaded content.
