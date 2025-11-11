/**
 * NSFW Content Detection Utility
 * Uses NSFW.js with TensorFlow.js for client-side image content detection
 * 
 * Detection Categories:
 * - Porn: Explicit sexual content
 * - Sexy: Provocative/suggestive content
 * - Hentai: Animated explicit content
 * - Neutral: Safe content
 * - Drawing: Safe illustrations
 */

import * as nsfwjs from 'nsfwjs';

interface NSFWPrediction {
  className: 'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy';
  probability: number;
}

interface DetectionResult {
  isNSFW: boolean;
  predictions: NSFWPrediction[];
  highestRisk: {
    category: string;
    probability: number;
  };
  warnings: string[];
}

class NSFWDetector {
  private model: any = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  // Thresholds for detection (adjustable)
  private readonly THRESHOLDS = {
    porn: 0.3,      // 30% confidence for porn
    sexy: 0.5,      // 50% confidence for sexy/suggestive
    hentai: 0.4,    // 40% confidence for hentai
  };

  /**
   * Load the NSFW detection model
   */
  async loadModel(): Promise<void> {
    // If already loaded, return
    if (this.model) {
      return;
    }

    // If currently loading, wait for existing load
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        console.log('Loading NSFW detection model...');
        // Load the MobileNetV2 model from CDN (more reliable than local files)
        // First try local model, fall back to CDN if it fails
        try {
          this.model = await nsfwjs.load('/models/', { type: 'graph' });
          console.log('NSFW detection model loaded successfully from local files');
        } catch (localError) {
          console.log('Local model not found, loading from CDN...');
          // Load from CDN - nsfwjs will use its default hosted model
          this.model = await nsfwjs.load();
          console.log('NSFW detection model loaded successfully from CDN');
        }
      } catch (error) {
        console.error('Failed to load NSFW detection model:', error);
        throw new Error('Failed to initialize content safety detection');
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Analyze an image for NSFW content
   * @param imageSource - Can be an HTMLImageElement, File, or Blob
   * @returns Detection results with warnings
   */
  async analyzeImage(imageSource: HTMLImageElement | File | Blob): Promise<DetectionResult> {
    // Ensure model is loaded
    if (!this.model) {
      await this.loadModel();
    }

    try {
      let imageElement: HTMLImageElement;

      // Convert File/Blob to Image element if needed
      if (imageSource instanceof File || imageSource instanceof Blob) {
        imageElement = await this.blobToImage(imageSource);
      } else {
        imageElement = imageSource;
      }

      // Run prediction
      const predictions = await this.model.classify(imageElement) as NSFWPrediction[];
      
      // Analyze results
      const result = this.analyzeResults(predictions);

      // Clean up if we created a temporary image
      if (imageSource instanceof File || imageSource instanceof Blob) {
        URL.revokeObjectURL(imageElement.src);
      }

      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image content');
    }
  }

  /**
   * Analyze prediction results and determine if content is NSFW
   */
  private analyzeResults(predictions: NSFWPrediction[]): DetectionResult {
    const warnings: string[] = [];
    let isNSFW = false;

    // Find highest probability category
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    const highestRisk = {
      category: sorted[0].className,
      probability: sorted[0].probability,
    };

    // Check each concerning category
    predictions.forEach((pred) => {
      const category = pred.className.toLowerCase();
      const probability = pred.probability;

      if (category === 'porn' && probability >= this.THRESHOLDS.porn) {
        isNSFW = true;
        warnings.push(`⚠️ Explicit sexual content detected (${(probability * 100).toFixed(1)}% confidence)`);
      } else if (category === 'hentai' && probability >= this.THRESHOLDS.hentai) {
        isNSFW = true;
        warnings.push(`⚠️ Explicit animated content detected (${(probability * 100).toFixed(1)}% confidence)`);
      } else if (category === 'sexy' && probability >= this.THRESHOLDS.sexy) {
        isNSFW = true;
        warnings.push(`⚠️ Suggestive/provocative content detected (${(probability * 100).toFixed(1)}% confidence)`);
      }
    });

    return {
      isNSFW,
      predictions,
      highestRisk,
      warnings,
    };
  }

  /**
   * Convert Blob/File to HTMLImageElement
   */
  private blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => resolve(img);
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Preload the model for faster first-time detection
   */
  async preload(): Promise<void> {
    try {
      await this.loadModel();
    } catch (error) {
      console.warn('Failed to preload NSFW detection model:', error);
      // Don't throw - allow the app to continue
    }
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
export const nsfwDetector = new NSFWDetector();

// Export types
export type { DetectionResult, NSFWPrediction };
