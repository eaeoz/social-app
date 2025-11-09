import { useState, useRef, useCallback, useEffect } from 'react';
import './ImageCropper.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoomPercent, setZoomPercent] = useState(100); // Percentage: 100 = fit to frame
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1); // Scale that fits image to frame
  const [loading, setLoading] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate actual zoom from percentage
  const actualZoom = (baseScale * zoomPercent) / 100;

  // Load image and calculate initial size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      // Center the image initially
      if (containerRef.current) {
        const containerSize = 300; // Preview size
        const scale = Math.max(containerSize / img.width, containerSize / img.height);
        setBaseScale(scale);
        setZoomPercent(100); // Start at 100% (perfectly fit)
        
        // Calculate initial position to center the image
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const initialX = (containerSize - scaledWidth) / 2;
        const initialY = (containerSize - scaledHeight) / 2;
        setPosition({ x: initialX, y: initialY });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newPercent: number) => {
    // Allow 50% to 300% of the fitted size
    setZoomPercent(Math.max(50, Math.min(300, newPercent)));
  };

  const handleZoomStep = (step: number) => {
    setZoomPercent(prev => Math.max(50, Math.min(300, prev + step)));
  };

  const handleCrop = async () => {
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas size to final output size (120x120)
      const outputSize = 120;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Load the image
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate the visible area in the preview (300x300)
      const previewSize = 300;

      // Calculate source rectangle (what's visible in the preview)
      const sourceX = Math.max(0, -position.x / actualZoom);
      const sourceY = Math.max(0, -position.y / actualZoom);
      const sourceWidth = Math.min(imageSize.width - sourceX, previewSize / actualZoom);
      const sourceHeight = Math.min(imageSize.height - sourceY, previewSize / actualZoom);

      // Draw the cropped area to canvas
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize,
        outputSize
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
          setLoading(false);
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error cropping image:', error);
      setLoading(false);
    }
  };

  const resetPosition = () => {
    if (containerRef.current && imageSize.width > 0) {
      setZoomPercent(100); // Reset to 100% (fit to frame)
      
      // Recalculate centered position with base scale
      const containerSize = 300;
      const scaledWidth = imageSize.width * baseScale;
      const scaledHeight = imageSize.height * baseScale;
      const initialX = (containerSize - scaledWidth) / 2;
      const initialY = (containerSize - scaledHeight) / 2;
      setPosition({ x: initialX, y: initialY });
    }
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="cropper-header">
          <h2>Position Your Photo</h2>
          <button className="cropper-close" onClick={onCancel} disabled={loading}>
            ✕
          </button>
        </div>

        <div className="cropper-body">
          <div className="cropper-instructions">
            <p>🖱️ Drag to reposition • 🔍 Use slider to zoom</p>
          </div>

          <div
            ref={containerRef}
            className="cropper-preview-container"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="cropper-preview-circle">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="cropper-image"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${actualZoom})`,
                  transformOrigin: 'top left',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                draggable={false}
              />
            </div>
          </div>

          <div className="cropper-controls">
            <div className="zoom-control">
              <button
                className="zoom-button"
                onClick={() => handleZoomStep(-5)}
                disabled={zoomPercent <= 50 || loading}
                title="Zoom out 5%"
              >
                ➖
              </button>
              <div className="zoom-info">
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="1"
                  value={zoomPercent}
                  onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                  className="zoom-slider"
                  disabled={loading}
                />
                <span className="zoom-label">{zoomPercent}%</span>
              </div>
              <button
                className="zoom-button"
                onClick={() => handleZoomStep(5)}
                disabled={zoomPercent >= 300 || loading}
                title="Zoom in 5%"
              >
                ➕
              </button>
            </div>

            <button
              className="reset-button"
              onClick={resetPosition}
              disabled={loading}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <div className="cropper-footer">
          <button
            className="cropper-button cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="cropper-button apply"
            onClick={handleCrop}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Apply & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
