import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface HandTrackerProps {
  onHandMove: (x: number | null, y: number | null) => void;
  isActive: boolean;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandMove, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        landmarkerRef.current = landmarker;
        setIsLoaded(true);
      } catch (e: any) {
        console.error("Failed to load hand landmarker:", e);
        setError("AI Model Load Failed");
      }
    };

    if (isActive) {
      initLandmarker();
    }

    return () => {
        if (landmarkerRef.current) {
            landmarkerRef.current.close();
            landmarkerRef.current = null;
        }
    };
  }, [isActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (isActive && isLoaded && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              frameRate: { ideal: 30 }
            } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
          }
        } catch (e: any) {
          console.error("Camera access denied:", e);
          setError("Camera Access Denied");
        }
      }
    };

    startCamera();

    return () => {
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }
       if (requestRef.current) {
         cancelAnimationFrame(requestRef.current);
       }
    };
  }, [isActive, isLoaded]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker) return;

    const startTimeMs = performance.now();
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const results = landmarker.detectForVideo(video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        // Get Index Finger Tip (Index 8)
        const indexTip = results.landmarks[0][8];
        
        // Map normalized coordinates (0-1) to screen coordinates
        // Mirror X because webcam is mirrored in CSS transform
        const x = (1 - indexTip.x) * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        
        onHandMove(x, y);
      } else {
        // No hand detected
        onHandMove(null, null);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 overflow-hidden rounded-xl border border-white/20 bg-black/50 backdrop-blur shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-opacity duration-500 group">
       <div className="relative w-48 h-36">
         {error ? (
           <div className="flex items-center justify-center w-full h-full text-red-400 text-xs text-center px-4">
             {error}
           </div>
         ) : !isLoaded ? (
           <div className="flex items-center justify-center w-full h-full text-white/50 text-xs animate-pulse">
             INITIALIZING AI...
           </div>
         ) : (
           <>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 opacity-60 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] text-white/80 font-mono uppercase tracking-widest">Live Feed</span>
            </div>
            <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
            {/* Crosshair decoration */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/30 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"></div>
           </>
         )}
       </div>
    </div>
  );
};

export default HandTracker;