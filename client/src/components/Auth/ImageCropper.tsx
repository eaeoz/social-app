import { useState, useRef, useCallback, useEffect } from 'react';
import './ImageCropper.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image and calculate initial size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      // Center the image initially
      if (containerRef.current) {
        const containerSize = 300; // Preview size
        const scale = Math.max(containerSize / img.width, containerSize / img.height);
        setZoom(scale);
        
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

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
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
      const scaledWidth = imageSize.width * zoom;
      const scaledHeight = imageSize.height * zoom;

      // Calculate source rectangle (what's visible in the preview)
      const sourceX = Math.max(0, -position.x / zoom);
      const sourceY = Math.max(0, -position.y / zoom);
      const sourceWidth = Math.min(imageSize.width - sourceX, previewSize / zoom);
      const sourceHeight = Math.min(imageSize.height - sourceY, previewSize / zoom);

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
      const containerSize = 300;
      const scale = Math.max(containerSize / imageSize.width, containerSize / imageSize.height);
      setZoom(scale);
      
      // Recalculate centered position
      const scaledWidth = imageSize.width * scale;
      const scaledHeight = imageSize.height * scale;
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
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
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
                onClick={() => handleZoomChange(zoom - 0.1)}
                disabled={zoom <= 0.5 || loading}
              >
                ➖
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="zoom-slider"
                disabled={loading}
              />
              <button
                className="zoom-button"
                onClick={() => handleZoomChange(zoom + 0.1)}
                disabled={zoom >= 3 || loading}
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
