import React from 'react';
import { SimState, ProcessStep } from '../types';
import { RotateCw, Video, Play, Pause, SkipForward, SkipBack, Timer, Volume2, VolumeX, Gauge } from 'lucide-react';
import { STEPS_CONFIG } from '../constants';

interface DashboardProps {
  state: SimState;
  onPlayPause: () => void;
  onToggleTimer: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onRecord: () => void;
  isRecording: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  state, onPlayPause, onToggleTimer, onPrevious, onNext, onReset, 
  onRecord, isRecording, isMuted, onToggleMute, onSpeedChange 
}) => {
  const currentConfig = STEPS_CONFIG[state.step];
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
        
      {/* Compact Dashboard: Centered Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[1150px] pointer-events-auto transition-all duration-300 ease-in-out">
         <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden group hover:border-slate-500 transition-colors">
            
            {/* Top Row: Status & Controls */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
               <div className="flex items-center gap-4 overflow-hidden min-w-0 max-w-[350px]">
                  <div className={`w-4 h-4 rounded-full shrink-0 ${state.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-lg font-bold text-slate-200 truncate" title={currentConfig.title}>
                    {currentConfig.title}
                  </span>
               </div>
               
               {/* Center Controls: Timer & Speed */}
               <div className="flex items-center gap-6">
                 {/* Timer Display */}
                 <div 
                   onClick={onToggleTimer}
                   className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition-all duration-300 select-none ${
                      state.isTimerPaused 
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                        : 'bg-slate-950/50 border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-900'
                   }`}
                   title={state.isTimerPaused ? "Click to Resume Timer" : "Click to Pause Timer"}
                 >
                   {state.isTimerPaused ? (
                      <Pause size={18} className="text-amber-500 animate-pulse" />
                   ) : (
                      <Timer size={18} className={`text-cyan-500 ${state.isPlaying ? 'animate-pulse' : ''}`} />
                   )}
                   <span className={`font-mono font-bold text-lg tracking-wider transition-colors ${state.isTimerPaused ? 'text-amber-500' : 'text-cyan-400'}`}>
                     {formatTime(state.timeElapsed)}
                   </span>
                 </div>

                 {/* Speed Control Slider */}
                 <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/50">
                    <Gauge size={16} className="text-slate-400" />
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.0" 
                      step="0.5" 
                      value={state.simSpeed} 
                      onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      title="Simulation Speed"
                    />
                    <span className="text-xs font-mono text-blue-300 w-8 text-right">{state.simSpeed.toFixed(1)}x</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={onPrevious} 
                    disabled={state.isPlaying}
                    className="p-3 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Previous Step"
                  >
                     <SkipBack size={20} fill="currentColor" />
                  </button>
                  <button 
                    onClick={onPlayPause} 
                    className="p-3 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title={state.isPlaying ? "Pause" : "Play"}
                  >
                     {state.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={onNext} 
                    disabled={state.isPlaying}
                    className="p-3 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Next Step"
                  >
                     <SkipForward size={20} fill="currentColor" />
                  </button>
                  <div className="w-px h-6 bg-slate-700 mx-2"></div>
                  
                  {/* Sound Toggle */}
                  <button 
                    onClick={onToggleMute} 
                    className={`p-3 hover:bg-slate-700 rounded-lg transition-colors ${isMuted ? 'text-slate-500' : 'text-blue-400'}`}
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  >
                     {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <button 
                    onClick={onReset} 
                    className="p-3 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-blue-400 transition-colors"
                    title="Reset Process"
                  >
                     <RotateCw size={20} />
                  </button>
                  <button 
                    onClick={onRecord} 
                    disabled={isRecording}
                    className={`p-3 hover:bg-slate-700 rounded-lg transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-300 hover:text-red-400'}`}
                    title="Record Video"
                  >
                     <Video size={20} />
                  </button>
               </div>
            </div>
            
            {/* Bottom Row: Static Description (Centered) */}
            <div className="relative h-24 bg-slate-950 flex flex-col items-center justify-center text-center px-8 py-2 gap-1">
               <div className="text-blue-400 font-bold text-lg leading-tight">
                  {currentConfig.description}
               </div>
               <div className="text-slate-400 text-sm font-medium leading-snug max-w-4xl opacity-90 whitespace-pre-wrap">
                  {currentConfig.details}
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;