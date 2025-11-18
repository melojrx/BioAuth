import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { VIDEO_WIDTH, VIDEO_HEIGHT, COLORS } from '../constants';
import { faceService } from '../services/faceService';
import { AuthStatus, DetectionResult } from '../types';
import { Scan, UserCheck, UserX, Loader2 } from 'lucide-react';

interface CameraProps {
  mode: 'login' | 'register';
  onFaceDetected: (descriptor: Float32Array, detection: DetectionResult) => void;
  status: AuthStatus;
  isModelLoaded: boolean;
}

const Camera: React.FC<CameraProps> = ({ mode, onFaceDetected, status, isModelLoaded }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const detectionLoop = useCallback(async () => {
    if (
      !isModelLoaded ||
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4
    ) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    
    if (canvas) {
      // Match canvas dimensions to video
      const displaySize = { width: VIDEO_WIDTH, height: VIDEO_HEIGHT };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect face
      const detection = await faceService.detectFace(video);

      // Clear previous drawings
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        
        // Draw detection box using native Canvas API to avoid faceapi.draw dependency issues
        const box = resizedDetections.detection.box;
        if (ctx) {
          const { x, y, width, height } = box;
          const label = mode === 'login' ? 'Identifying...' : 'New User';
          const color = status === AuthStatus.SUCCESS ? COLORS.success : COLORS.primary;

          // Draw Box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw Label Background
          ctx.fillStyle = color;
          const textPadding = 6;
          ctx.font = 'bold 14px Inter, sans-serif'; // Set font first to measure correctly
          const textMetrics = ctx.measureText(label);
          const textWidth = textMetrics.width;
          const textHeight = 14; // Approximate height
          
          // Draw background rectangle for text
          ctx.fillRect(
            x, 
            y - textHeight - (textPadding * 2), 
            textWidth + (textPadding * 2), 
            textHeight + (textPadding * 2)
          );

          // Draw Label Text
          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'top';
          ctx.fillText(label, x + textPadding, y - textHeight - textPadding);
        }

        // Draw landmarks (custom point drawing)
        const landmarks = resizedDetections.landmarks;
        if (ctx) {
            ctx.fillStyle = status === AuthStatus.SUCCESS ? COLORS.success : COLORS.primary;
            landmarks.positions.forEach(point => {
                ctx.fillRect(point.x, point.y, 2, 2);
            });
        }

        // Pass data up
        if (status === AuthStatus.IDLE || status === AuthStatus.DETECTING) {
             const detectionData: DetectionResult = {
                score: detection.detection.score,
                box: detection.detection.box,
                landmarks: { positions: detection.landmarks.positions }
            };
            onFaceDetected(detection.descriptor, detectionData);
        }
      }
    }
  }, [isModelLoaded, mode, onFaceDetected, status]);


  useEffect(() => {
    let intervalId: any;
    if (isModelLoaded) {
      setIsScanning(true);
      intervalId = setInterval(detectionLoop, 100); // ~10fps detection
    }
    return () => clearInterval(intervalId);
  }, [isModelLoaded, detectionLoop]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900 ring-1 ring-slate-700">
      {!isModelLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 text-sm">Loading Neural Networks...</p>
        </div>
      )}
      
      <Webcam
        ref={webcamRef}
        audio={false}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
          facingMode: "user"
        }}
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full transform scale-x-[-1]" // Mirror canvas too
      />

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-mono text-slate-300">
          {isScanning ? 'SYSTEM ACTIVE' : 'OFFLINE'}
        </span>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20">
        {status === AuthStatus.SUCCESS && (
          <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-500/50 text-green-400 px-4 py-2 rounded-lg">
            <UserCheck className="w-5 h-5" />
            <span className="font-bold">Access Granted</span>
          </div>
        )}
         {status === AuthStatus.FAILED && (
          <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-400 px-4 py-2 rounded-lg">
            <UserX className="w-5 h-5" />
            <span className="font-bold">Access Denied</span>
          </div>
        )}
        {status === AuthStatus.DETECTING && (
           <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg">
           <Scan className="w-5 h-5 animate-pulse" />
           <span className="font-bold">Scanning...</span>
         </div>
        )}
      </div>

      {/* Scan Line Animation */}
      {status === AuthStatus.DETECTING && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
           <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
        </div>
      )}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(${VIDEO_HEIGHT}px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Camera;