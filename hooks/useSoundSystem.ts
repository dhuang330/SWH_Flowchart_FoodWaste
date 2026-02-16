import { useEffect, useRef, useState, useCallback } from 'react';
import { ProcessStep } from '../types';

interface SoundSystemHook {
  resumeAudio: () => Promise<void>;
}

// Store references to nodes we want to modulate
interface ModulationTargets {
  mainOsc?: OscillatorNode;
  filter?: BiquadFilterNode;
  lfo?: OscillatorNode;
  gain?: GainNode;
  flowGain?: GainNode;
  flowFilter?: BiquadFilterNode;
  pressureOsc?: OscillatorNode;
  pressureGain?: GainNode;
  type?: ProcessStep;
}

export const useSoundSystem = (
  step: ProcessStep, 
  isPlaying: boolean, 
  isMuted: boolean,
  simSpeed: number,
  pressure: number,
  temperature: number
): SoundSystemHook => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const currentStepRef = useRef<ProcessStep>(ProcessStep.IDLE);
  const modulationTargetsRef = useRef<ModulationTargets>({});

  // Initialize Audio Context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : 0.3; // Default volume
    masterGain.connect(ctx.destination);

    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;

    // Create a white noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = buffer;

    return () => {
      ctx.close();
    };
  }, []);

  // Handle Mute Toggle
  useEffect(() => {
    if (masterGainRef.current) {
      const now = audioCtxRef.current?.currentTime || 0;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 0.3, now + 0.1);
    }
  }, [isMuted]);

  const stopCurrentSounds = (fadeOutTime = 0.5) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    activeNodesRef.current.forEach(node => {
        if (node instanceof GainNode) {
            node.gain.cancelScheduledValues(now);
            node.gain.setValueAtTime(node.gain.value, now);
            node.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
        }
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
            node.stop(now + fadeOutTime);
        }
    });
    activeNodesRef.current = [];
    modulationTargetsRef.current = {};
  };

  const updateSoundDynamics = (targets: ModulationTargets, speed: number, press: number, temp: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Step-specific modulations
      switch (targets.type) {
          case ProcessStep.CRUSHING:
              if (targets.lfo) {
                  // Speed up crunches based on simSpeed
                  targets.lfo.frequency.setTargetAtTime(4 * speed, now, 0.1);
              }
              break;
          case ProcessStep.FEEDING:
              if (targets.lfo) {
                  // Pump stroke rate
                  targets.lfo.frequency.setTargetAtTime(1.5 * speed, now, 0.1);
              }
              break;
          case ProcessStep.REACTION:
               // Boiler: Pitch scales with pressure (0.1 to 1.8)
               // Hiss filter scales with pressure
               if (targets.mainOsc) {
                   const baseFreq = 40;
                   targets.mainOsc.frequency.setTargetAtTime(baseFreq + (press * 20), now, 0.5);
               }
               if (targets.filter) {
                   targets.filter.frequency.setTargetAtTime(4000 + (press * 1000), now, 0.5);
               }
               break;
          case ProcessStep.FILTRATION:
               // Centrifuge RPM sound
               if (targets.mainOsc) {
                   const targetFreq = 200 + (600 * speed);
                   targets.mainOsc.frequency.setTargetAtTime(targetFreq, now, 0.5);
               }
               break;
      }

      // Dynamic Flow Modulation
      if (targets.flowGain) {
          // Define base volumes for flow types roughly
          let baseFlowVol = 0.1;
          switch (targets.type) {
              case ProcessStep.CRUSHING: baseFlowVol = 0.15; break;
              case ProcessStep.FEEDING: baseFlowVol = 0.12; break; // Steam/Pump
              case ProcessStep.REACTION: baseFlowVol = 0.18; break; // High pressure steam
              case ProcessStep.FLASHING: baseFlowVol = 0.2; break; // Sustained flow during flash
              case ProcessStep.FILTRATION: baseFlowVol = 0.1; break; // Liquid output
              default: baseFlowVol = 0.1;
          }
          
          // Scale volume by simulation speed (faster = louder flow)
          const targetVol = Math.min(baseFlowVol * speed, 0.5);
          targets.flowGain.gain.setTargetAtTime(targetVol, now, 0.2);
      }
      
      // Distinct Pressure Cue Modulation
      if (targets.pressureOsc && targets.pressureGain) {
          // Pitch rises with pressure: 300Hz -> ~700Hz
          const targetFreq = 300 + (press * 220); 
          targets.pressureOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
          
          // Volume fades in as pressure rises above 0.3 MPa
          // Max volume capped at 0.12 to stay subtle
          const targetVol = press > 0.3 ? Math.min((press - 0.3) * 0.08, 0.12) : 0;
          targets.pressureGain.gain.setTargetAtTime(targetVol, now, 0.1);
      }
  };

  const playSoundForStep = useCallback((stepToPlay: ProcessStep) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master || !noiseBufferRef.current) return;

    const now = ctx.currentTime;
    stopCurrentSounds(0.3);

    const nodes: AudioNode[] = [];
    const targets: ModulationTargets = { type: stepToPlay };

    const createHum = (freq: number, type: OscillatorType, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.2);
        nodes.push(osc, gain);
        return { osc, gain };
    };

    const createNoise = (filterType: BiquadFilterType, filterFreq: number, vol: number, Q: number = 1) => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBufferRef.current;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = Q;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        src.start(now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.2);
        nodes.push(src, filter, gain);
        return { src, filter, gain };
    };

    switch (stepToPlay) {
        case ProcessStep.IDLE:
            createHum(50, 'sine', 0.05);
            createHum(100, 'triangle', 0.01); 
            createNoise('lowpass', 200, 0.02);
            break;

        case ProcessStep.CRUSHING:
            // Motor
            const { osc: crushMotor } = createHum(45, 'sawtooth', 0.12);
            const loadLfo = ctx.createOscillator();
            loadLfo.frequency.value = 6; 
            const loadLfoGain = ctx.createGain();
            loadLfoGain.gain.value = 3; 
            loadLfo.connect(loadLfoGain);
            loadLfoGain.connect(crushMotor.frequency);
            loadLfo.start(now);
            nodes.push(loadLfo, loadLfoGain);

            // Crunching Noise
            const { filter: crushFilter } = createNoise('lowpass', 600, 0.2);
            const crunchLfo = ctx.createOscillator();
            crunchLfo.type = 'square'; 
            crunchLfo.frequency.value = 4; 
            targets.lfo = crunchLfo; // Track for dynamic speed
            
            const crunchLfoGain = ctx.createGain();
            crunchLfoGain.gain.value = 200; 
            crunchLfo.connect(crunchLfoGain);
            crunchLfoGain.connect(crushFilter.frequency);
            crunchLfo.start(now);
            nodes.push(crunchLfo, crunchLfoGain);
            
            // Flow: Slurry Movement
            const slurryFlow = createNoise('lowpass', 300, 0.15);
            targets.flowGain = slurryFlow.gain;
            targets.flowFilter = slurryFlow.filter;
            break;

        case ProcessStep.FEEDING:
            // Pump
            createHum(60, 'sine', 0.1);
            const { gain: fluidGain } = createNoise('bandpass', 500, 0.15, 2);
            const pumpLfo = ctx.createOscillator();
            pumpLfo.frequency.value = 1.5; 
            targets.lfo = pumpLfo; // Track for speed
            
            const pumpLfoGain = ctx.createGain();
            pumpLfoGain.gain.value = 0.1;
            pumpLfo.connect(pumpLfoGain);
            pumpLfoGain.connect(fluidGain.gain);
            pumpLfo.start(now);
            nodes.push(pumpLfo, pumpLfoGain);
            
            // Flow: Steam/Liquid Mix (Hissing)
            const steamFlow = createNoise('highpass', 1500, 0.12);
            targets.flowGain = steamFlow.gain;
            targets.flowFilter = steamFlow.filter;
            break;

        case ProcessStep.REACTION:
            // Boiler Rumble
            const { osc: rumble } = createHum(40, 'square', 0.06); 
            targets.mainOsc = rumble; // Track for pressure modulation
            
            createNoise('lowpass', 120, 0.25);
            const { filter: hissFilter } = createNoise('highpass', 4000, 0.03); 
            targets.filter = hissFilter; // Track for pressure modulation
            
            // Flow: High Pressure Injection (Swoosh)
            const injectionFlow = createNoise('bandpass', 1000, 0.18, 1);
            targets.flowGain = injectionFlow.gain;
            targets.flowFilter = injectionFlow.filter;

            // Pressure Tension (initially silent, modulated by pressure)
            const { osc: rTension, gain: rTensionGain } = createHum(300, 'sine', 0);
            targets.pressureOsc = rTension;
            targets.pressureGain = rTensionGain;
            break;

        case ProcessStep.LINKAGE:
             createHum(55, 'sine', 0.12);
             createHum(56.5, 'sine', 0.12); 
             // Subtle boiling/agitation
             const boiling = createNoise('bandpass', 400, 0.1, 3);
             targets.flowGain = boiling.gain;
             targets.flowFilter = boiling.filter;

             // Pressure Tension (sustained, modulated)
             const { osc: lTension, gain: lTensionGain } = createHum(300, 'sine', 0);
             targets.pressureOsc = lTension;
             targets.pressureGain = lTensionGain;
             break;

        case ProcessStep.FLASHING:
            // 1. Violent Discharge (Explosion/Release) - One-shot envelope
            const blast = createNoise('lowpass', 600, 0, 0.5);
            // Cancel default ramp from createNoise
            blast.gain.gain.cancelScheduledValues(now);
            blast.gain.gain.setValueAtTime(0, now);
            blast.gain.gain.linearRampToValueAtTime(0.5, now + 0.1); // Rapid Attack
            blast.gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0); // Fast Decay
            
            // 2. Distinct Hiss (Steam trailing off)
            const steamHiss = createNoise('highpass', 3500, 0, 2);
            steamHiss.gain.gain.cancelScheduledValues(now);
            steamHiss.gain.gain.setValueAtTime(0, now);
            steamHiss.gain.gain.linearRampToValueAtTime(0.3, now + 0.05); // Sharp Attack
            steamHiss.gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0); // Long Trail
            
            // 3. Pitch Dropping Turbulence
            const { osc: turbOsc, gain: turbGain } = createHum(60, 'sawtooth', 0);
            turbGain.gain.cancelScheduledValues(now);
            turbGain.gain.setValueAtTime(0, now);
            turbGain.gain.linearRampToValueAtTime(0.15, now + 0.2);
            turbGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
            turbOsc.frequency.exponentialRampToValueAtTime(10, now + 4.0); // Drop pitch
            
            // 4. Sustained Flow (Modulated by Speed)
            const sustainedFlow = createNoise('bandpass', 500, 0.15);
            targets.flowGain = sustainedFlow.gain;
            targets.flowFilter = sustainedFlow.filter;
            break;

        case ProcessStep.FILTRATION:
            // Centrifuge Spin
            const { osc: spinOsc } = createHum(200, 'triangle', 0.08);
            targets.mainOsc = spinOsc; // Track for speed
            
            const { filter: windFilter } = createNoise('bandpass', 1000, 0.15, 5);
            windFilter.frequency.exponentialRampToValueAtTime(3000, now + 2);
            createHum(195, 'sine', 0.05);
            
            // Flow: Liquid Trickling out
            const liquidOut = createNoise('bandpass', 1200, 0.1, 2);
            targets.flowGain = liquidOut.gain;
            targets.flowFilter = liquidOut.filter;
            break;
    }

    activeNodesRef.current = nodes;
    modulationTargetsRef.current = targets;
  }, []);

  // Update sound dynamics whenever simulation state changes
  useEffect(() => {
      if (isPlaying && !isMuted) {
          updateSoundDynamics(modulationTargetsRef.current, simSpeed, pressure, temperature);
      }
  }, [simSpeed, pressure, temperature, isPlaying, isMuted]);

  // Handle step changes
  useEffect(() => {
    if (!isPlaying) {
        stopCurrentSounds();
        return;
    }
    if (step !== currentStepRef.current || (isPlaying && activeNodesRef.current.length === 0)) {
        playSoundForStep(step);
        currentStepRef.current = step;
        // Immediate dynamic update for new step
        updateSoundDynamics(modulationTargetsRef.current, simSpeed, pressure, temperature);
    }
  }, [step, isPlaying, playSoundForStep]);

  const resumeAudio = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  };

  return { resumeAudio };
};

export default useSoundSystem;