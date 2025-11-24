import sharp from 'sharp';

/**
 * Pure Node.js NSFW Validator (No Python, No External APIs)
 * 
 * This validator uses image analysis to detect potentially inappropriate content:
 * - Analyzes skin tone percentage in the image
 * - Checks image dimensions and aspect ratios
 * - Detects excessive skin-colored pixels
 * 
 * Note: This is a heuristic approach and not as accurate as ML models,
 * but it works entirely in Node.js without external dependencies.
 */

class NSFWValidator {
  constructor() {
    // Skin tone color ranges (RGB)
    this.skinToneRanges = [
      { r: [95, 255], g: [40, 185], b: [20, 135] },   // Light to medium skin
      { r: [45, 255], g: [34, 200], b: [30, 120] },   // Various skin tones
      { r: [80, 220], g: [50, 150], b: [40, 100] },   // Additional skin range
    ];
    
    // Thresholds
    this.maxSkinPercentage = 40; // Maximum % of skin-colored pixels allowed
    this.minImageSize = 80 * 80; // Minimum image size to analyze
    
    console.log('✅ NSFW Validator initialized (Pure Node.js - no Python/APIs)');
    console.log(`📊 Skin tone threshold: ${this.maxSkinPercentage}%`);
  }

  /**
   * Check if a pixel color is in skin tone range
   */
  isSkinTone(r, g, b) {
    for (const range of this.skinToneRanges) {
      if (
        r >= range.r[0] && r <= range.r[1] &&
        g >= range.g[0] && g <= range.g[1] &&
        b >= range.b[0] && b <= range.b[1]
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Analyze image for potentially inappropriate content
   */
  async validateImage(imageBuffer) {
    try {
      console.log('🔍 Starting NSFW validation (Pure Node.js analysis)...');
      
      // Get image metadata
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      console.log(`📐 Image dimensions: ${metadata.width}x${metadata.height}`);
      
      // Skip very small images
      const imageSize = metadata.width * metadata.height;
      if (imageSize < this.minImageSize) {
        console.log('✅ Image too small to analyze, allowing through');
        return {
          isValid: true,
          message: 'Image passed validation (too small to analyze)'
        };
      }

      // Resize image to 200x200 for faster analysis
      const resizedBuffer = await image
        .resize(200, 200, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resizedBuffer;
      const pixelCount = info.width * info.height;
      let skinPixelCount = 0;

      // Analyze pixels for skin tones
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (this.isSkinTone(r, g, b)) {
          skinPixelCount++;
        }
      }

      const skinPercentage = (skinPixelCount / pixelCount) * 100;
      console.log(`🎨 Skin tone percentage: ${skinPercentage.toFixed(2)}%`);

      // Check if skin percentage exceeds threshold
      if (skinPercentage > this.maxSkinPercentage) {
        console.warn(`⚠️ High skin tone detected: ${skinPercentage.toFixed(2)}% (threshold: ${this.maxSkinPercentage}%)`);
        return {
          isValid: false,
          reason: 'Image contains excessive skin-colored content',
          details: {
            skinPercentage: skinPercentage.toFixed(2),
            threshold: this.maxSkinPercentage
          }
        };
      }

      console.log('✅ Image passed NSFW validation');
      return {
        isValid: true,
        message: 'Image passed validation',
        details: {
          skinPercentage: skinPercentage.toFixed(2),
          threshold: this.maxSkinPercentage
        }
      };

    } catch (error) {
      console.error('❌ NSFW validation error:', error);
      // Allow the upload if validation fails to avoid blocking legitimate images
      return {
        isValid: true,
        warning: 'Content validation unavailable',
        error: error.message
      };
    }
  }

  /**
   * Update skin percentage threshold
   */
  setThreshold(percentage) {
    if (percentage >= 0 && percentage <= 100) {
      this.maxSkinPercentage = percentage;
      console.log(`📊 Skin tone threshold updated to: ${percentage}%`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const nsfwValidator = new NSFWValidator();
