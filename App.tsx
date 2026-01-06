
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, Hand, MousePointer2, Settings, Box, Palette, CameraOff, Sparkles } from 'lucide-react';
import ParticleSystem from './components/ParticleSystem';
import { ModelType, GestureMode } from './types';
import { HandGestureService, Landmarks } from './services/HandTracker';

// Constants for state machine locking
const LOCK_THRESHOLD = 5; // Frames to wait before switching mode

const App: React.FC = () => {
  const [model, setModel] = useState<ModelType>('HEART');
  const [color, setColor] = useState('#00ffcc');
  const [gestureMode, setGestureMode] = useState<GestureMode>(GestureMode.IDLE);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastDetectedMode = useRef<GestureMode>(GestureMode.IDLE);
  const modeCounter = useRef(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleResults = useCallback((results: any) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setGestureMode(GestureMode.IDLE);
      return;
    }

    const landmarks: Landmarks[] = results.multiHandLandmarks[0];
    const detected = HandGestureService.detectMode(landmarks);

    // State Machine Locking
    if (detected === lastDetectedMode.current) {
      modeCounter.current++;
    } else {
      lastDetectedMode.current = detected;
      modeCounter.current = 0;
    }

    if (modeCounter.current >= LOCK_THRESHOLD) {
      setGestureMode(detected);
    }

    // Apply logic based on mode
    if (detected === GestureMode.ROTATE_XY) {
      const indexTip = landmarks[8];
      // Map index tip position (0-1) to rotation radians
      // Note: MediaPipe X is mirrored for selfie view
      const targetX = (indexTip.y - 0.5) * Math.PI;
      const targetY = (0.5 - indexTip.x) * Math.PI;
      setRotation(prev => ({ ...prev, x: targetX, y: targetY }));
    } else if (detected === GestureMode.ROTATE_Z) {
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const angle = Math.atan2(middleTip.y - indexTip.y, middleTip.x - indexTip.x);
      setRotation(prev => ({ ...prev, z: angle }));
    } else if (detected === GestureMode.SCALE) {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];
      const dist = HandGestureService.getDistance(wrist, indexTip);
      // Map extension distance to scale factor
      setScaleFactor(Math.max(0.5, dist * 6));
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(handleResults);

    // @ts-ignore
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480
    });

    camera.start().then(() => setIsCameraReady(true));

    return () => {
      camera.stop();
      hands.close();
    };
  }, [handleResults]);

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans select-none">
      <ParticleSystem 
        modelType={model} 
        color={color} 
        gestureMode={gestureMode} 
        scaleFactor={scaleFactor}
        rotation={rotation}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center pointer-events-none z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={24} />
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-purple-500">
              ZEN PARTICLES
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
              gestureMode === GestureMode.IDLE ? 'bg-gray-800' : 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
            }`}>
              {gestureMode} MODE
            </span>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all border border-white/10"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Right Interaction Legend */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 space-y-4 pointer-events-none">
        <InteractionHint 
          active={gestureMode === GestureMode.SCALE} 
          icon={<Hand />} 
          title="Scale / Burst" 
          desc="Five fingers open / move away" 
        />
        <InteractionHint 
          active={gestureMode === GestureMode.ROTATE_XY} 
          icon={<MousePointer2 />} 
          title="Rotate XY" 
          desc="Extend index finger only" 
        />
        <InteractionHint 
          active={gestureMode === GestureMode.ROTATE_Z} 
          icon={<Settings />} 
          title="Tilt Z" 
          desc="Index + Middle fingers" 
        />
      </div>

      {/* Left Sidebar Control Panel */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-transform duration-500 z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%-20px)]'}`}>
        <div className="relative flex items-center">
          <div className="w-72 bg-black/60 backdrop-blur-3xl p-8 rounded-r-3xl border-y border-r border-white/10 space-y-8 shadow-2xl">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 opacity-80">
                <Box size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Formation</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['HEART', 'FLOWER', 'SATURN', 'BUDDHA', 'FIREWORK'] as ModelType[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      model === m 
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400 opacity-80">
                <Palette size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Aura Color</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['#00ffcc', '#ff0077', '#7700ff', '#ffcc00', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 bg-transparent cursor-pointer rounded-full overflow-hidden border-none"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Intensity</span>
                <span className="text-cyan-400">{(scaleFactor * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={scaleFactor}
                onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </section>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-24 w-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-r-xl flex items-center justify-center transition-all border-y border-r border-white/10"
          >
            <div className={`w-1 h-8 bg-white/30 rounded-full transition-transform ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="absolute bottom-6 left-6 w-56 h-42 bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
        />
        {!isCameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <CameraOff size={24} className="text-white/20 mb-2" />
            <div className="text-[10px] text-white/40 font-mono animate-pulse">CALIBRATING SENSORS...</div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
          <div className={`w-1.5 h-1.5 rounded-full ${isCameraReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[8px] font-bold text-white/60 tracking-widest uppercase">Live Vision</span>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 right-6 text-[10px] font-mono text-white/30 tracking-widest uppercase">
        Real-time Hand Tracking Engine | WebGL-P6 | Interaction Locked
      </div>
    </div>
  );
};

interface InteractionHintProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const InteractionHint: React.FC<InteractionHintProps> = ({ active, icon, title, desc }) => (
  <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
    <div className="text-right">
      <div className={`text-sm font-bold transition-colors ${active ? 'text-cyan-400' : 'text-white'}`}>{title}</div>
      <div className="text-[10px] text-gray-500">{desc}</div>
    </div>
    <div className={`p-3 rounded-2xl border transition-all duration-500 ${active ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
  </div>
);

export default App;
