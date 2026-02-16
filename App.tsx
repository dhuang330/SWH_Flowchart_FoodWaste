import React, { useState, useEffect, useRef } from 'react';
import ProcessDiagram from './components/ProcessDiagram';
import Dashboard from './components/Dashboard';
import { ProcessStep, SimState } from './types';
import { STEPS_CONFIG } from './constants';
import { getNextSimState } from './services/simulationService';
import useSoundSystem from './hooks/useSoundSystem';

const App: React.FC = () => {
  const [state, setState] = useState<SimState>({
    step: ProcessStep.IDLE,
    temperature: 20,
    pressure: 0.1,
    timeElapsed: 0,
    isPlaying: false,
    isTimerPaused: false,
    simSpeed: 1.0 // Default speed 1x
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Sound System Hook with dynamic inputs
  const { resumeAudio } = useSoundSystem(
    state.step, 
    state.isPlaying, 
    isMuted, 
    state.simSpeed, 
    state.pressure, 
    state.temperature
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Timer Loop for Elapsed Time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // Timer runs if simulation is playing AND timer is NOT manually paused
    if (state.isPlaying && !state.isTimerPaused) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000 / state.simSpeed); // Timer ticks faster if speed is increased
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isPlaying, state.isTimerPaused, state.simSpeed]);

  // Simulation Loop (Steps)
  useEffect(() => {
    if (state.isPlaying) {
      const currentStepDuration = STEPS_CONFIG[state.step].duration;
      // Adjust duration based on simulation speed
      const adjustedDuration = currentStepDuration / state.simSpeed;
      
      timerRef.current = setTimeout(() => {
        setState(prev => {
          const nextStep = prev.step === ProcessStep.FILTRATION ? ProcessStep.IDLE : prev.step + 1;
          
          // Stop recording if we loop back to IDLE
          if (isRecording && nextStep === ProcessStep.IDLE) {
             stopRecording();
             return { ...prev, step: nextStep, isPlaying: false };
          }

          const simData = getNextSimState(nextStep);
          return {
            ...prev,
            step: nextStep,
            ...simData
          };
        });
      }, adjustedDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.step, state.isPlaying, isRecording, state.simSpeed]);

  const handlePlayPause = () => {
    // Resume audio context on first user interaction if needed
    resumeAudio();
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };
  
  const handleToggleTimer = () => {
    setState(prev => ({ ...prev, isTimerPaused: !prev.isTimerPaused }));
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handlePrevious = () => {
    setState(prev => {
      const prevStep = prev.step === ProcessStep.IDLE ? ProcessStep.FILTRATION : prev.step - 1;
      const simData = getNextSimState(prevStep);
      return { ...prev, step: prevStep, ...simData, isPlaying: false };
    });
  };

  const handleNext = () => {
    setState(prev => {
      const nextStep = prev.step === ProcessStep.FILTRATION ? ProcessStep.IDLE : prev.step + 1;
      const simData = getNextSimState(nextStep);
      return { ...prev, step: nextStep, ...simData, isPlaying: false };
    });
  };

  const handleReset = () => {
    setState({
      step: ProcessStep.IDLE,
      temperature: 20,
      pressure: 0.1,
      timeElapsed: 0,
      isPlaying: false,
      isTimerPaused: false,
      simSpeed: 1.0
    });
  };

  const handleSpeedChange = (speed: number) => {
    setState(prev => ({ ...prev, simSpeed: speed }));
  };

  // --- Recording Logic ---
  const handleRecord = async () => {
    let stream: MediaStream | null = null;
    try {
      // 1. Ask user to select screen/tab to record
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 }
      });
      
      // 2. Setup Recorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      // Fallback if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
         // Try common alternatives
         if (MediaRecorder.isTypeSupported('video/webm')) {
            options.mimeType = 'video/webm';
         } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options.mimeType = 'video/mp4';
         } else {
            // Default browser choice
            delete (options as any).mimeType; 
         }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle external stop (e.g. user clicks "Stop Sharing" in browser UI)
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        
        // Guess extension based on mimeType
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `industrial_sim_recording.${ext}`;
        
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Stop all tracks to clear "sharing" indicator
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
      };

      // 3. Start Recording & Simulation
      mediaRecorder.start();
      setIsRecording(true);
      
      // Reset to start and play
      setState({
        step: ProcessStep.IDLE,
        temperature: 20,
        pressure: 0.1,
        timeElapsed: 0,
        isPlaying: true, // Auto play
        isTimerPaused: false,
        simSpeed: 1.0
      });
      // Ensure audio is ready
      resumeAudio();

    } catch (err: any) {
      // Cleanup stream if it was created but setup failed
      if (stream) {
        (stream as MediaStream).getTracks().forEach(track => track.stop());
      }

      // Handle user cancellation gracefully
      if (err.name === 'NotAllowedError') {
        console.log("Recording cancelled by user");
        setIsRecording(false);
        return;
      }

      console.error("Error starting recording:", err);
      alert("Unable to start recording. Screen recording permission is restricted or an unknown error occurred.\n\nTechnical error: " + (err instanceof Error ? err.message : String(err)));
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience - Dark Mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900 pointer-events-none" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight drop-shadow-lg">
            Subcritical Water Hydrolysis Process for Organic Waste
          </h1>
          <p className="text-slate-400 text-sm mt-1 tracking-wider uppercase font-medium">
            Industrial Simulation
          </p>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="w-full h-full max-w-7xl max-h-[800px] p-4 flex items-center justify-center pt-20 pb-60">
        <ProcessDiagram 
          step={state.step} 
          temperature={state.temperature}
          pressure={state.pressure}
          simSpeed={state.simSpeed}
        />
      </div>

      {/* Dashboard Controls */}
      <Dashboard 
        state={state} 
        onPlayPause={handlePlayPause} 
        onToggleTimer={handleToggleTimer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onReset={handleReset}
        onRecord={handleRecord}
        isRecording={isRecording}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onSpeedChange={handleSpeedChange}
      />
      
    </div>
  );
};

export default App;