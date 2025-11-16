import { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Socket } from 'socket.io-client';
import './Whiteboard.css';

// Type definitions for Excalidraw
type ExcalidrawImperativeAPI = any;
type ExcalidrawElement = any;

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

function Whiteboard({ socket, roomId, isOpen, onClose }: WhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastSentElementsRef = useRef<string>('');
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Excalidraw API
  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
    setIsLoading(false);
  }, []);

  // Handle local changes and broadcast to others
  const handleChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    if (!socket || !excalidrawAPI || isSyncingRef.current) return;

    // Debounce sending updates to avoid overwhelming the socket
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const elementsJson = JSON.stringify(elements);
      
      // Only send if elements have changed
      if (elementsJson !== lastSentElementsRef.current) {
        lastSentElementsRef.current = elementsJson;
        
        socket.emit('whiteboard-update', {
          roomId,
          elements: elements,
          appState: excalidrawAPI.getAppState()
        });
      }
    }, 100); // 100ms debounce
  }, [socket, roomId, excalidrawAPI]);

  // Listen for remote whiteboard updates
  useEffect(() => {
    if (!socket || !excalidrawAPI) return;

    const handleWhiteboardUpdate = (data: { 
      elements: readonly ExcalidrawElement[];
      appState: any;
    }) => {
      // Prevent syncing loop
      isSyncingRef.current = true;

      try {
        // Update scene with new elements
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: {
            ...data.appState,
            // Preserve local view settings
            viewBackgroundColor: excalidrawAPI.getAppState().viewBackgroundColor,
            currentItemFontFamily: excalidrawAPI.getAppState().currentItemFontFamily,
          }
        });

        lastSentElementsRef.current = JSON.stringify(data.elements);
      } catch (error) {
        console.error('Error updating whiteboard:', error);
      } finally {
        // Allow local changes after a short delay
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 50);
      }
    };

    socket.on('whiteboard-update', handleWhiteboardUpdate);

    return () => {
      socket.off('whiteboard-update', handleWhiteboardUpdate);
    };
  }, [socket, excalidrawAPI]);

  // Request initial whiteboard state when opening
  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.emit('whiteboard-request-state', { roomId });

    const handleWhiteboardState = (data: {
      elements: readonly ExcalidrawElement[];
      appState: any;
    }) => {
      if (excalidrawAPI && data.elements) {
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: data.appState
        });
        lastSentElementsRef.current = JSON.stringify(data.elements);
      }
    };

    socket.on('whiteboard-state', handleWhiteboardState);

    return () => {
      socket.off('whiteboard-state', handleWhiteboardState);
    };
  }, [socket, isOpen, roomId, excalidrawAPI]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isExpanded) return; // Don't allow dragging when expanded
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [isExpanded, position]);

  // Handle drag move
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 600);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 450);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className={`whiteboard-container ${isExpanded ? 'expanded' : ''}`}
      style={!isExpanded ? {
        left: `${position.x}px`,
        top: `${position.y}px`
      } : undefined}
    >
      <div 
        className="whiteboard-header"
        onMouseDown={handleDragStart}
      >
        <h3>Whiteboard</h3>
        <div className="whiteboard-header-controls">
          <button 
            className="whiteboard-expand-btn"
            onClick={toggleExpanded}
            aria-label={isExpanded ? 'Restore size' : 'Expand'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                // Compress icon
                <>
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </>
              ) : (
                // Expand icon
                <>
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </>
              )}
            </svg>
          </button>
          <button 
            className="whiteboard-close-btn"
            onClick={onClose}
            aria-label="Close whiteboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
        
        <div className="whiteboard-content">
          {isLoading && (
            <div className="whiteboard-loading">
              <div className="whiteboard-spinner"></div>
              <p>Loading whiteboard...</p>
            </div>
          )}
          
          <Excalidraw
            excalidrawAPI={handleExcalidrawAPI}
            onChange={handleChange}
            initialData={{
              appState: {
                viewBackgroundColor: '#ffffff',
                currentItemStrokeColor: '#8b5cf6',
                currentItemBackgroundColor: '#e9d5ff',
                currentItemFillStyle: 'solid',
                currentItemStrokeWidth: 2,
                currentItemRoughness: 1,
                currentItemOpacity: 100,
                theme: 'light'
              }
            }}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: { saveFileToDisk: true },
                loadScene: true,
                saveToActiveFile: false,
                toggleTheme: true
              },
              tools: {
                image: false
              }
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
        </div>
    </div>
  );
}

export default Whiteboard;
