import React, { useState, useRef } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import Controls from './components/Controls';
import HandTracker from './components/HandTracker';
import { AppState, ParticleCanvasHandle } from './types';

// Updated SVG to closely match the "Human Future Wearable" logo design
const DEFAULT_LOGO = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEh1bWFuIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI1MCwgMjMwKSBzY2FsZSgwLjkwKSI+CiAgICAgPCEtLSBIZWFkIC0tPgogICAgIDxjaXJjbGUgY3k9Ii0xNjAiIHI9IjMwIiBmaWxsPSJ3aGl0ZSIvPgogICAgIDwhLS0gVG9yc28gJiBMZWdzIC0tPgogICAgIDxwYXRoIGQ9Ik0tNDUgLTExMCBRLTYwIC0xMTAgLTY1IC04MCBMLTgwIDUwIEwtNTUgNTUgTC00NSAtNTAgTC00MCAtNTAgTC00MCAyMDAgTC0xMCAyMDAgTC0xMCA4MCBMMTAgODAgTDEwIDIwMCBMNDAgMjAwIEw0MCAtNTAgTDQ1IC01MCBMNTUgNTUgTDgwIDUwIEw2NSAtODAgUTYwIC0xMTAgNDUgLTExMCBaIiBmaWxsPSJ3aGl0ZSIvPgogIDwvZz4KICA8IS0tIFJpbmcgLS0+CiAgPGVsbGlXBzZSBjeD0iMjUwIiBjeT0iMjAwIiByeD0iMTU1IiByeT0iMjIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPgogIDwhLS0gVGV4dCAtLT4KICA8cGF0aCBpZD0iY3VydmUiIGQ9Ik0gOTAgMzYwIFEgMjUwIDQ2MCA0MTAgMzYwIiBmaWxsPSJub25lIi8+CiAgPHRleHQgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSIyNiIgbGV0dGVyLXNwYWNpbmc9IjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgPHRleHRQYXRoIGhyZWY9IiNjdXJ2ZSIgc3RhcnRPZmZzZXQ9IjUwJSI+CiAgICAgIEhVTUFOIEZVVFVSRSBXRUFSQUJMRQogICAgPC90ZXh0UGF0aD4KICA8L3RleHQ+Cjwvc3ZnPg==`;

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(DEFAULT_LOGO);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isEntered, setIsEntered] = useState(false);
  const canvasRef = useRef<ParticleCanvasHandle>(null);

  const handleEnter = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    // Set state to true triggers HandTracker to load and request camera
    setIsEntered(true);
  };

  const handleSnapshot = () => {
    if (canvasRef.current) {
      canvasRef.current.downloadSnapshot();
    }
  };

  const handleHandMove = (x: number | null, y: number | null) => {
    if (canvasRef.current) {
      canvasRef.current.setInteractionPoint(x, y);
    }
  };

  return (
    // Changed bg-black to a radial gradient so "black particles" can be seen against the lighter center
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans">
      
      {/* Deep Space Gradient Base - kept to ensure visibility of dark particles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] opacity-80" />

      {/* Background decoration grid - reduced opacity */}
      <div className="absolute inset-0 pointer-events-none opacity-5" 
           style={{
             backgroundImage: `radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px)`,
             backgroundSize: '50px 50px, 20px 20px',
             backgroundPosition: '0 0, 25px 25px'
           }}
      />

      {/* Main Canvas */}
      <ParticleCanvas ref={canvasRef} imageSrc={imageSrc} />
      
      {/* Hand Tracker - Only active when entered */}
      <HandTracker onHandMove={handleHandMove} isActive={isEntered} />

      {!isEntered ? (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-1000">
          <button 
            onClick={handleEnter}
            className="group relative px-12 py-5 bg-transparent overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 border border-white/20 transform skew-x-[-12deg] group-hover:border-white/60 transition-colors"></div>
            <div className="absolute inset-0 bg-white/5 transform skew-x-[-12deg] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
            <span className="relative text-2xl font-light tracking-[0.4em] text-white group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all">
              INITIALIZE
            </span>
          </button>
          <p className="mt-6 text-white/30 text-xs font-mono tracking-[0.2em] uppercase max-w-md text-center">
            Click to authorize Full Screen & Camera Access for Gesture Control
          </p>
        </div>
      ) : (
        <>
          {/* Controls Overlay */}
          <Controls 
            onImageSelect={setImageSrc} 
            onSnapshot={handleSnapshot}
            appState={appState}
            setAppState={setAppState}
          />
          
          {/* Instruction Overlay */}
          <div className="absolute bottom-10 right-10 pointer-events-none text-white/30 text-right select-none mix-blend-difference">
            <h2 className="text-4xl font-light tracking-tighter">PARTICLE<br/>UNIVERSE</h2>
            <p className="text-sm mt-2 font-mono">USE YOUR HAND TO DISPERSE STARDUST</p>
          </div>
        </>
      )}

    </div>
  );
};

export default App;