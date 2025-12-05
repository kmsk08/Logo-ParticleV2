import React, { useState } from 'react';
import { generateCosmicImage } from '../services/geminiService';
import { AppState } from '../types';

interface ControlsProps {
  onImageSelect: (src: string) => void;
  onSnapshot: () => void;
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const Controls: React.FC<ControlsProps> = ({ onImageSelect, onSnapshot, appState, setAppState }) => {
  const [prompt, setPrompt] = useState('A glowing cybernetic skull');
  const [isOpen, setIsOpen] = useState(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      setAppState(AppState.LOADING);
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageSelect(e.target.result as string);
          setAppState(AppState.READY);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!process.env.API_KEY) {
      alert("API_KEY is missing in the environment variables.");
      return;
    }
    if (!prompt.trim()) return;

    setAppState(AppState.LOADING);
    try {
      const base64Image = await generateCosmicImage(prompt);
      onImageSelect(base64Image);
      setAppState(AppState.READY);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  return (
    <div className={`fixed top-4 left-4 z-50 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}>
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-neutral-100 p-6 rounded-2xl shadow-2xl w-80">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Particle Weaver
          </h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-neutral-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-xs file:font-semibold
              file:bg-purple-900/50 file:text-purple-300
              hover:file:bg-purple-900/70
              cursor-pointer
            "
          />
        </div>

        {/* Snapshot Button */}
        <div className="mb-6">
           <button 
            onClick={onSnapshot}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-sm font-medium transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
             Take Snapshot
           </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-neutral-700"></div>
          <span className="flex-shrink mx-4 text-neutral-600 text-xs uppercase">Or Generate with AI</span>
          <div className="flex-grow border-t border-neutral-700"></div>
        </div>

        {/* Generate Section */}
        <div className="mt-4">
           <label className="block text-sm font-medium text-neutral-400 mb-2">
            Describe a cosmic scene
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-black/50 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none h-24 mb-3"
            placeholder="e.g. A nebula shaped like a phoenix..."
          />
          <button
            onClick={handleGenerate}
            disabled={appState === AppState.LOADING}
            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 
              ${appState === AppState.LOADING 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20'
              }`}
          >
            {appState === AppState.LOADING ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Generate Particle Universe'}
          </button>
          
          {appState === AppState.ERROR && (
            <p className="text-red-400 text-xs mt-2 text-center">Failed to generate image. Try again.</p>
          )}
        </div>
      </div>
      
      {/* Re-open toggle */}
      {!isOpen && (
         <button 
         onClick={() => setIsOpen(true)}
         className="fixed top-4 left-4 p-3 bg-neutral-900/80 backdrop-blur border border-neutral-700 rounded-full text-white hover:bg-purple-900/50 transition-colors shadow-xl"
       >
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
       </button>
      )}
    </div>
  );
};

export default Controls;