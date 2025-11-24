/**
 * NSFW Content Detection - Server-Side Only
 * 
 * This is a placeholder file. NSFW detection is now handled entirely on the server.
 * The server validates all uploaded images before accepting them.
 * 
 * Client-side detection has been removed because:
 * 1. It can be bypassed by users
 * 2. TensorFlow.js models are large and slow on client devices
 * 3. Server-side validation is more secure and consistent
 * 4. Better compatibility across all platforms (web, iOS, Android)
 */

interface DetectionResult {
  isNSFW: boolean;
  predictions: any[];
  highestRisk: {
    category: string;
    probability: number;
  };
  warnings: string[];
}

class NSFWDetector {
  /**
   * Server-side validation - This method is now a no-op
   * All validation happens on the server when the image is uploaded
   */
  async analyzeImage(imageSource: HTMLImageElement | File | Blob): Promise<DetectionResult> {
    // Return safe result - server will handle actual validation
    console.log('✓ Image will be validated by server during upload');
    return {
      isNSFW: false,
      predictions: [],
      highestRisk: {
        category: 'Neutral',
        probability: 1.0,
      },
      warnings: [],
    };
  }

  async loadModel(): Promise<void> {
    // No-op - model loading happens on server
    console.log('✓ NSFW validation is handled by server');
  }

  async preload(): Promise<void> {
    // No-op
  }

  isReady(): boolean {
    // Always ready since we don't do client-side validation
    return true;
  }
}

// Export singleton instance
export const nsfwDetector = new NSFWDetector();

// Export types
export type { DetectionResult };
