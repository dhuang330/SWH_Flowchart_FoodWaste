import React, { useMemo, useState, useEffect } from 'react';
import { ProcessStep, FluidColor, SCENE_WIDTH, SCENE_HEIGHT } from '../types';
import { STEPS_CONFIG } from '../constants'; 
import { Flame, CheckCircle2, Settings, Droplets, Waves, Box } from 'lucide-react';

interface ProcessDiagramProps {
  step: ProcessStep;
  temperature: number;
  pressure: number;
  simSpeed?: number; // Optional prop for speed control
}

// --- CONSTANTS ---
const getHoverClass = (color: string) => `cursor-help transition-all duration-300 hover:brightness-110 hover:drop-shadow-[0_0_25px_${color}]`;

const getActiveClass = (active: boolean, isIdle: boolean) => {
  if (isIdle) {
    return "transition-all duration-1000 opacity-100 animate-cyan-pulse hover:animate-none";
  }
  // Enhanced active state: stronger colored shadow, clearer brightness
  return active 
    ? "transition-all duration-700 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] brightness-110" 
    : "transition-all duration-700 opacity-60 saturate-50"; 
};

// --- COMPONENT: Sensor Indicator ---
const SensorIndicator: React.FC<{ x: number; y: number; label: string; active: boolean; type?: 'TEMP' | 'PRESS' | 'LEVEL' }> = ({ x, y, label, active, type = 'TEMP' }) => {
  if (!active) return null;
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
       <line x1="0" y1="0" x2="20" y2="-20" stroke="#22c55e" strokeWidth="1" opacity="0.6">
         <animate attributeName="x2" values="0;20" dur="0.5s" fill="freeze" />
         <animate attributeName="y2" values="0;-20" dur="0.5s" fill="freeze" />
         <animate attributeName="opacity" values="0;0.6" dur="0.5s" fill="freeze" />
       </line>
       <g transform="translate(20, -20)">
          <rect x="0" y="-10" width="60" height="20" rx="2" fill="#064e3b" stroke="#22c55e" strokeWidth="1" opacity="0.8">
             <animate attributeName="width" from="0" to="60" dur="0.3s" begin="0.2s" fill="freeze" />
          </rect>
          <g opacity="0">
             <animate attributeName="opacity" to="1" dur="0.2s" begin="0.5s" fill="freeze" />
             <text x="5" y="4" fontSize="9" fill="#4ade80" fontFamily="monospace" fontWeight="bold">{type}</text>
             <text x="35" y="4" fontSize="9" fill="#22c55e" fontFamily="monospace" fontWeight="bold">OK</text>
             <circle cx="55" cy="-1" r="2" fill="#22c55e" className="animate-pulse" />
          </g>
       </g>
       <circle cx="0" cy="0" r="3" fill="#22c55e" stroke="#064e3b" strokeWidth="1">
         <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
         <animate attributeName="stroke-width" values="1;4;1" dur="2s" repeatCount="indefinite" />
       </circle>
    </g>
  );
};

// --- COMPONENT: Pressure Gauge ---
const PressureGauge: React.FC<{ x: number; y: number; value: number }> = ({ x, y, value }) => {
  // 0 to 2.5 MPa scale
  const angle = -135 + (Math.min(value, 2.5) / 2.5) * 270; 
  
  return (
    <g transform={`translate(${x}, ${y})`}>
       {/* Stem */}
       <line x1="-12" y1="0" x2="0" y2="0" stroke="#64748b" strokeWidth="4" />
       
       {/* Body */}
       <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
       <circle cx="0" cy="0" r="11" fill="#0f172a" />
       
       {/* Ticks */}
       <line x1="0" y1="-9" x2="0" y2="-11" stroke="#475569" strokeWidth="1" transform="rotate(-45)" />
       <line x1="0" y1="-9" x2="0" y2="-11" stroke="#475569" strokeWidth="1" transform="rotate(0)" />
       <line x1="0" y1="-9" x2="0" y2="-11" stroke="#475569" strokeWidth="1" transform="rotate(45)" />
       <line x1="0" y1="-9" x2="0" y2="-11" stroke="#ef4444" strokeWidth="1.5" transform="rotate(90)" />
       
       {/* Needle Group - Handles Value Rotation */}
       <g transform={`rotate(${angle})`} className="transition-transform duration-500 ease-out">
           {/* Needle Line - Handles Jitter */}
           <line 
             x1="0" y1="0" x2="0" y2="-9" 
             stroke="#ef4444" 
             strokeWidth="1.5"
             strokeLinecap="round" 
             style={{ transformOrigin: '0 0' }}
             className="animate-gauge-shake"
           />
       </g>
       <circle cx="0" cy="0" r="2" fill="#cbd5e1" />
       
       {/* Digital/Text Readout */}
       <text x="0" y="22" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">{value.toFixed(1)} MPa</text>
    </g>
  );
};

// --- COMPONENT: Safety Valve / Steam Vent ---
const SafetyValve: React.FC<{ x: number; y: number; active: boolean }> = ({ x, y, active }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Valve Body */}
            <rect x="-4" y="0" width="8" height="10" fill="#64748b" />
            <rect x="-6" y="-4" width="12" height="4" fill="#475569" />
            <path d="M -2 -4 L -2 -8 L 2 -8 L 2 -4" fill="#cbd5e1" />
            
            {/* Steam Venting Effect */}
            {active && (
                <g>
                    {[0, 1, 2].map(i => (
                        <circle key={i} cx={0} cy={-10} r={2} fill="#e2e8f0" opacity="0.6" filter="blur(2px)">
                            <animate attributeName="cy" from={-10} to={-50 - Math.random() * 20} dur="0.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                            <animate attributeName="cx" values={`0;${-10 + Math.random() * 20};${-5 + Math.random() * 10}`} dur="0.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0" dur="0.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                            <animate attributeName="r" values="2;8" dur="0.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                        </circle>
                    ))}
                    {/* Vibration */}
                     <animateTransform attributeName="transform" type="translate" values={`${x},${y}; ${x+1},${y}; ${x-1},${y}; ${x},${y}`} dur="0.1s" repeatCount="indefinite" />
                </g>
            )}
        </g>
    );
};

// --- COMPONENT: Heat Map Overlay ---
const HeatOverlay: React.FC<{ 
  intensity: number; 
  pathD?: string; 
  x?: number; y?: number; width?: number; height?: number; 
  rx?: number;
}> = ({ intensity, pathD, x=0, y=0, width=0, height=0, rx=0 }) => {
  let r, g, b;
  if (intensity < 0.5) {
    const t = intensity * 2;
    r = 59 + (249 - 59) * t;
    g = 130 + (115 - 130) * t;
    b = 246 + (22 - 246) * t;
  } else {
    const t = (intensity - 0.5) * 2;
    r = 249 + (239 - 249) * t;
    g = 115 + (68 - 115) * t;
    b = 22 + (68 - 22) * t;
  }
  const color = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  const opacity = 0.1 + (intensity * 0.4); 

  return (
     <g className="pointer-events-none transition-all duration-1000" style={{ opacity }}>
       {pathD ? (
         <path d={pathD} fill={color} filter="blur(12px)" style={{ mixBlendMode: 'overlay' }} />
       ) : (
         <rect x={x} y={y} width={width} height={height} rx={rx} fill={color} filter="blur(12px)" style={{ mixBlendMode: 'overlay' }} />
       )}
       {intensity > 0.7 && pathD && (
         <path d={pathD} fill={color} filter="blur(6px)" opacity="0.3" transform="scale(0.8) translate(10, 10)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
       )}
     </g>
  );
};

// --- COMPONENT: Heat Wave ---
const HeatWave: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M 0 0 Q 4 -6 0 -12 T 0 -24" fill="none" stroke="#f97316" strokeWidth="2" opacity="0" strokeLinecap="round">
      <animate attributeName="d" values="M 0 0 Q 4 -6 0 -12 T 0 -24; M 0 0 Q -4 -6 0 -12 T 0 -24; M 0 0 Q 4 -6 0 -12 T 0 -24" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="transform" type="translate" values="0 0; 0 -20" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
    </path>
  </g>
);

// --- COMPONENT: Pipe Glow ---
const PipeGlow: React.FC<{ pathD: string; color: string; active: boolean; width?: number; blur?: number }> = ({ pathD, color, active, width = 14, blur = 5 }) => {
  if (!active) return null;
  return (
    <path d={pathD} fill="none" stroke={color} strokeWidth={width} strokeOpacity="0.3" filter={`blur(${blur}px)`} className="pointer-events-none">
      <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="2.5s" repeatCount="indefinite" />
    </path>
  );
};

// --- COMPONENT: Pipe Insulation Overlay ---
const InsulatedPipePath: React.FC<{ pathD: string; width?: number }> = ({ pathD, width = 14 }) => (
  <g>
    <path d={pathD} fill="none" stroke="url(#insulation-pattern)" strokeWidth={width} strokeLinecap="round" />
    <path d={pathD} fill="none" stroke="#000" strokeWidth={width} strokeLinecap="round" strokeOpacity="0.1" />
  </g>
);

// --- COMPONENT: Swirl Effect (Turbulence) ---
const SwirlEffect: React.FC<{ x: number; y: number; color: string; active: boolean }> = ({ x, y, color, active }) => {
  if (!active) return null;
  const particles = [0, 1, 2, 3, 4];
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      <defs>
        <filter id={`turb-blur-${x}-${y}`}>
           <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>
      
      {/* Background Glow - Pulsing separation energy */}
      <circle cx="0" cy="0" r="10" fill={color} opacity="0.25" filter={`url(#turb-blur-${x}-${y})`}>
          <animate attributeName="r" values="6;14;6" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* Spinning Turbulence Lines - representing vortex separation */}
      <g>
         <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2.5s" repeatCount="indefinite" />
         {[0, 1, 2].map(i => (
             <path key={i} transform={`rotate(${i * 120})`} d="M 0 0 Q 6 6 12 0" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round">
                <animate attributeName="d" values="M 0 0 Q 6 6 12 0; M 0 0 Q 6 -6 12 0; M 0 0 Q 6 6 12 0" dur="0.6s" repeatCount="indefinite" begin={`${i*0.1}s`} />
             </path>
         ))}
      </g>

      {/* Emitting Bubbles/Droplets - Fast dynamic exit */}
      {particles.map(i => (
         <circle key={i} r={1.5} fill={color} opacity="0.9">
            <animateTransform attributeName="transform" type="rotate" values={`0 0 0; 360 0 0`} dur={`${2 + i}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values="0;16" dur={`${0.5 + i*0.1}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values="0;8" dur={`${0.5 + i*0.1}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" dur={`${0.5 + i*0.1}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="2;0" dur={`${0.5 + i*0.1}s`} repeatCount="indefinite" />
         </circle>
      ))}
    </g>
  );
};

// --- COMPONENT: Pipe Flow Particles ---
const PipeFlowParticles: React.FC<{ 
  pathD: string; 
  color?: string; 
  fluidType?: 'oil' | 'water' | 'solid' | 'steam' | 'slurry' | 'default';
  active: boolean; 
  size?: number;
  count?: number; 
  duration?: number 
}> = ({ pathD, color, fluidType = 'default', active, size = 3, count = 6, duration = 3 }) => {
  if (!active) return null;

  const getFluidColor = (type: string, fallback?: string) => {
    switch(type) {
      case 'oil': return '#f59e0b'; // Amber-500 (Rich Gold/Amber)
      case 'water': return '#0ea5e9'; // Sky-500 (Vibrant Blue)
      case 'solid': return '#a8a29e'; // Stone-400 (Distinct Earthy Grey)
      case 'steam': return '#e2e8f0'; // Slate-200 (Distinct light color for steam)
      case 'slurry': return '#d97706'; // Amber-600
      default: return fallback || '#cbd5e1';
    }
  };

  const finalColor = getFluidColor(fluidType, color);

  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: -(i * (duration / count)), 
    r: size + (Math.random() * 2 - 1), 
    opacity: 0.3 + Math.random() * 0.4
  }));

  if (fluidType === 'solid') {
    // Render squares for solid particles to distinguish from liquids
    return (
        <g className="pointer-events-none">
            {particles.map((p) => (
                <g key={p.id}>
                    <rect x={-p.r} y={-p.r} width={p.r * 2} height={p.r * 2} fill={finalColor} opacity={p.opacity} filter="brightness(1.1)">
                        <animateMotion 
                            dur={`${duration}s`} 
                            repeatCount="indefinite" 
                            path={pathD} 
                            begin={`${p.delay}s`} 
                            rotate="auto" 
                            keyPoints="0;1" 
                            keyTimes="0;1" 
                            calcMode="linear" 
                        />
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${duration}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur={`${duration/2}s`} repeatCount="indefinite" additive="sum" />
                    </rect>
                </g>
            ))}
        </g>
    );
  }

  return (
    <g className="pointer-events-none">
      {particles.map((p) => (
        <circle key={p.id} r={p.r} fill={finalColor} opacity={p.opacity} filter="brightness(1.1)">
           <animateMotion 
             dur={`${duration}s`} 
             repeatCount="indefinite" 
             path={pathD} 
             begin={`${p.delay}s`} 
             rotate="auto" 
             keyPoints="0;1" 
             keyTimes="0;1" 
             calcMode="linear" 
           />
           <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${duration}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
        </circle>
      ))}
    </g>
  );
};

// --- COMPONENT: Vertical Conveyor ---
const VerticalConveyor: React.FC<{ x: number; y: number; height: number; active: boolean }> = ({ x, y, height, active }) => {
  const width = 30;
  const buckets = Array.from({ length: 6 });
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Conveyor Frame */}
      <rect 
        x={-width/2} y={-height} width={width} height={height} 
        fill="#334155" 
        stroke={active ? "#38bdf8" : "#1e293b"} 
        strokeWidth={active ? 3 : 2} 
        className="transition-all duration-500"
      />
      <line x1={-width/2} y1={-height} x2={-width/2} y2={0} stroke="#475569" strokeWidth="1" />
      <line x1={width/2} y1={-height} x2={width/2} y2={0} stroke="#475569" strokeWidth="1" />
      
      {/* Top and Bottom Pulleys */}
      <circle cx={0} cy={-height + 8} r={10} fill="#64748b" stroke="#1e293b" />
      <circle cx={0} cy={-8} r={10} fill="#64748b" stroke="#1e293b" />
      
      {/* Moving Buckets/Slats */}
      <g clipPath={`inset(0 0 0 0)`}>
         <defs>
            <clipPath id={`conveyor-clip-${x}`}>
               <rect x={-width/2 + 2} y={-height + 8} width={width - 4} height={height - 16} />
            </clipPath>
         </defs>
         <g clipPath={`url(#conveyor-clip-${x})`}>
            {buckets.map((_, i) => {
               const startY = 0;
               return (
                  <rect key={i} x={-10} y={startY} width={20} height={4} rx={1} fill={active ? "#cbd5e1" : "#475569"} opacity="0.8">
                     {active && (
                       <animate attributeName="y" from={-8} to={-height + 8} dur="2s" begin={`${i * 0.33}s`} repeatCount="indefinite" />
                     )}
                     {!active && <animate attributeName="y" from={-20 - (i*30)} to={-20 - (i*30)} dur="0s" fill="freeze" />}
                  </rect>
               )
            })}
         </g>
      </g>
      
      <text x={0} y={15} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">Conveyor</text>
    </g>
  );
};

// --- COMPONENT: Crusher/Pulper ---
const Crusher: React.FC<{ x: number; y: number; active: boolean; scale?: number }> = ({ x, y, active, scale = 1 }) => {
  // Generate a random ID suffix for clip paths to avoid conflicts if multiple crushers exist
  const idSuffix = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
       {/* Vibration Group */}
       <g>
         {active && (
            <animateTransform attributeName="transform" type="translate" values="0,0; 0.5,0.5; -0.5,-0.5; 0.5,-0.5; 0,0" dur="0.08s" repeatCount="indefinite" />
         )}
         
         {/* Hopper */}
         <path d="M -20 -30 L 20 -30 L 10 0 L -10 0 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
         
         {/* Main Body */}
         <rect 
            x="-25" y="0" width="50" height="40" rx="2" 
            fill="#475569" 
            stroke={active ? "#38bdf8" : "#1e293b"} 
            strokeWidth={active ? 3 : 2} 
            className="transition-all duration-500"
         />
         
         {/* Internal Gears/Blades Window */}
         <rect x="-18" y="5" width="36" height="30" fill="#1e293b" stroke="#0f172a" />
         
         <g clipPath={`url(#crusher-clip-${idSuffix})`}>
           <defs><clipPath id={`crusher-clip-${idSuffix}`}><rect x="-18" y="5" width="36" height="30" /></clipPath></defs>
           
           {/* Crushing Particles - Debris */}
           {active && (
             <g>
               {[0, 1, 2, 3].map(i => (
                 <path key={i} d="M 0 0 L 3 0 L 1.5 3 Z" fill="#fcd34d" opacity="0.9">
                   <animate attributeName="d" values="M 0 0 L 3 0 L 1.5 3 Z; M 0 0 L 4 1 L 2 4 Z; M 0 0 L 3 0 L 1.5 3 Z" dur="0.2s" repeatCount="indefinite" />
                   <animateMotion path={`M ${-10 + i*6} 0 L ${-15 + i*8 + (i%2==0?5:-5)} 40`} dur={`${0.3 + (i%3)*0.1}s`} repeatCount="indefinite" />
                   <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.2s" repeatCount="indefinite" />
                 </path>
               ))}
             </g>
           )}

           {/* Teeth Top - Moving Left, aggressively */}
           <path d="M -50 12 L -40 22 L -30 12 L -20 22 L -10 12 L 0 22 L 10 12 L 20 22 L 30 12 L 40 22 L 50 12" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="bevel">
              {active && <animateTransform attributeName="transform" type="translate" from="0 0" to="-20 0" dur="0.15s" repeatCount="indefinite" />}
           </path>
           
           {/* Teeth Bottom - Moving Right, offset speed */}
           <path d="M -50 28 L -40 18 L -30 28 L -20 18 L -10 28 L 0 18 L 10 28 L 20 18 L 30 28 L 40 18 L 50 28" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="bevel">
              {active && <animateTransform attributeName="transform" type="translate" from="-20 0" to="0 0" dur="0.18s" repeatCount="indefinite" />}
           </path>
         </g>
         
         {/* Motor Side */}
         <rect x="25" y="10" width="10" height="20" fill="#334155" stroke="#1e293b" />
         {active && (
            <circle cx="30" cy="20" r="2" fill="#ef4444" className="animate-pulse" />
         )}
         
         <text x="0" y="55" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">Crushing & Pulping</text>
         <text x="0" y="65" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">Crusher</text>
       </g>
    </g>
  );
};

// --- COMPONENT: Screw Pump (Static Body, Rotating Screw) ---
const ScrewPump: React.FC<{ x: number; y: number; active: boolean; width?: number }> = ({ x, y, active, width = 120 }) => {
  const height = 30;
  const motorWidth = 30;
  const statorWidth = width - motorWidth;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Motor Housing (Static) */}
      <rect 
        x={0} y={-height/2} width={motorWidth} height={height} rx={2} 
        fill="#64748b" 
        stroke={active ? "#38bdf8" : "#1e293b"} 
        strokeWidth={active ? 2 : 1}
        className="transition-all duration-500" 
      />
      <line x1={5} y1={-height/2} x2={5} y2={height/2} stroke="#334155" strokeWidth="1" />
      <line x1={12} y1={-height/2} x2={12} y2={height/2} stroke="#334155" strokeWidth="1" />
      
      {/* Coupling */}
      <rect x={motorWidth} y={-height/3} width={10} height={height*0.66} fill="#475569" stroke="#1e293b" />

      {/* Pump Stator (Long Body) - Static */}
      <rect 
        x={motorWidth + 10} y={-height/2 + 3} width={statorWidth - 10} height={height - 6} rx={4} 
        fill="url(#metal-gradient)" 
        stroke={active ? "#38bdf8" : "#475569"} 
        strokeWidth={active ? 2 : 1} 
        className="transition-all duration-500"
      />
      
      {/* Internal Screw Animation (Cutaway View) */}
      <g clipPath="inset(0 0 0 0)">
        <defs>
           <clipPath id={`pump-window-${x}-${y}`}>
              <rect x={motorWidth + 15} y={-8} width={statorWidth - 20} height={16} rx={2} />
           </clipPath>
        </defs>
        
        {/* Cutaway Window Background */}
        <rect x={motorWidth + 15} y={-8} width={statorWidth - 20} height={16} rx={2} fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
        
        {/* Rotating Screw (Simulated with sliding sine wave) */}
        <g clipPath={`url(#pump-window-${x}-${y})`}>
           <path 
             d="M 0 0 Q 5 -5 10 0 T 20 0 T 30 0 T 40 0 T 50 0 T 60 0 T 70 0 T 80 0 T 90 0 T 100 0 T 110 0" 
             transform={`translate(${motorWidth + 10}, 0)`}
             fill="none" 
             stroke="#cbd5e1" 
             strokeWidth="4"
             strokeLinecap="round"
           >
             {active && (
                <animateTransform attributeName="transform" type="translate" from={`${motorWidth + 10} 0`} to={`${motorWidth} 0`} dur="0.4s" repeatCount="indefinite" />
             )}
           </path>
           <path 
             d="M 0 0 Q 5 5 10 0 T 20 0 T 30 0 T 40 0 T 50 0 T 60 0 T 70 0 T 80 0 T 90 0 T 100 0 T 110 0" 
             transform={`translate(${motorWidth + 10}, 0)`}
             fill="none" 
             stroke="#94a3b8" 
             strokeWidth="4"
             strokeLinecap="round"
             opacity="0.6"
           >
             {active && (
                <animateTransform attributeName="transform" type="translate" from={`${motorWidth + 10} 0`} to={`${motorWidth} 0`} dur="0.4s" repeatCount="indefinite" />
             )}
           </path>
        </g>
      </g>
      
      <text x={width/2} y={30} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="bold">Screw Pump</text>
      <text x={width/2} y={40} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">Pump</text>
    </g>
  );
};

// --- COMPONENT: Material Inlet Flow ---
const MaterialInletFlow: React.FC<{ x: number; y: number; active: boolean; type?: 'pour' | 'jet'; }> = ({ x, y, active, type = 'pour' }) => {
  if (!active) return null;
  const count = type === 'jet' ? 8 : 6;
  const color = "#334155"; 

  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      <line x1={0} y1={-5} x2={type === 'jet' ? 25 : 0} y2={type === 'jet' ? 15 : 40} stroke={color} strokeWidth={type === 'jet' ? 6 : 8} strokeLinecap="round" opacity="0.7">
         {type === 'pour' && (<animate attributeName="stroke-width" values="8;5;9;6;8" dur="0.4s" repeatCount="indefinite" />)}
      </line>
      {Array.from({ length: count }).map((_, i) => {
         const delay = i * 0.15;
         const r = 2 + Math.random() * 3; 
         const dur = 0.4 + (i % 3) * 0.1;
         return (
        <circle key={i} cx={0} cy={0} r={r} fill={color} opacity={0.6 + Math.random() * 0.4}>
          <animate attributeName="cy" from={0} to={type === 'jet' ? 30 : 60} dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
          {type === 'jet' && (<animate attributeName="cx" from={0} to={40} dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />)}
          {type === 'pour' && (<animate attributeName="cx" values={`0;${Math.random()*4-2};0`} dur="0.5s" begin={`${delay}s`} repeatCount="indefinite" />)}
          <animate attributeName="opacity" values="1;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      )})}
    </g>
  );
};

// --- COMPONENT: Material Particles ---
const MaterialParticles: React.FC<{ x: number; y: number; width: number; height: number; active: boolean; mode: 'mix' | 'fall'; }> = ({ x, y, width, height, active, mode }) => {
  if (!active) return null;
  const count = 16;
  const color = mode === 'fall' ? "#fcd34d" : "#cbd5e1"; 

  const particles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * width * 0.7,
      y: (Math.random() - 0.5) * height * 0.6,
      r: 2 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.6,
      delay: Math.random() * 2,
      dur: 2 + Math.random() * 2
  }));

  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {particles.map((p) => {
        return (
          <circle key={p.id} cx={mode === 'mix' ? p.x : (p.id % 4) * (width / 4) - width / 2 + (Math.random() * 10)} cy={mode === 'mix' ? p.y : 0} r={p.r} fill={color} opacity={p.opacity}>
              {mode === 'mix' && (
                <>
                  <animateTransform attributeName="transform" type="rotate" values={`0 0 0; 360 0 0`} dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                  <animate attributeName="r" values={`${p.r};${p.r * 1.3};${p.r}`} dur={`${p.dur/1.5}s`} repeatCount="indefinite" />
                </>
              )}
              {mode === 'fall' && (
                <>
                   <animate attributeName="cy" from={-height/2} to={height/2} dur={`${1.2 + (p.id % 3) * 0.4}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                   <animate attributeName="opacity" values="0; 1; 0" dur={`${1.2 + (p.id % 3) * 0.4}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                </>
              )}
          </circle>
        );
      })}
    </g>
  );
};

// --- COMPONENT: Steam Injection Bubbles ---
const SteamInjectionBubbles: React.FC<{ x: number; y: number; active: boolean; height: number }> = ({ x, y, active, height }) => {
  if (!active) return null;
  const particles = [0, 1, 2, 3, 4, 5];
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
       <g opacity="0.8">
          <line x1="0" y1="0" x2="-12" y2="-25" stroke="white" strokeWidth="2" strokeLinecap="round">
             <animate attributeName="x2" values="-10;-15;-10" dur="0.15s" repeatCount="indefinite" />
             <animate attributeName="y2" values="-20;-30;-20" dur="0.15s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="0" x2="12" y2="-25" stroke="white" strokeWidth="2" strokeLinecap="round">
             <animate attributeName="x2" values="10;15;10" dur="0.15s" repeatCount="indefinite" />
             <animate attributeName="y2" values="-20;-30;-20" dur="0.15s" repeatCount="indefinite" />
          </line>
       </g>
       {particles.map((i) => (
         <circle key={i} cx={0} cy={0} r={3} fill="#f1f5f9" opacity="0.7">
           <animate attributeName="cy" from={0} to={-height * 0.8} dur={`${0.8 + (i % 3) * 0.3}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
           <animate attributeName="cx" values={`0;${-20 + (i * 8)};${-5 + (i * 3)};${15 - (i * 4)}`} dur={`${0.8 + (i % 3) * 0.3}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
           <animate attributeName="opacity" values="0.7;0.3;0" dur={`${0.8 + (i % 3) * 0.3}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
         </circle>
       ))}
    </g>
  );
};

// --- COMPONENT: Stirrer ---
const Stirrer: React.FC<{ x: number; y: number; height: number; active: boolean; scale?: number; part?: 'motor' | 'shaft' | 'all'; }> = ({ x, y, height, active, scale = 1, part = 'all' }) => {
  const renderMotor = () => (
    <g className="drop-shadow-xl" filter="drop-shadow(0 4px 4px rgba(0,0,0,0.5))">
      <rect x="-24" y="-2" width="48" height="6" rx="1" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
      <rect x="-14" y="-10" width="28" height="8" fill="#334155" stroke="#0f172a" strokeWidth="1" />
      <rect x="-20" y="-55" width="40" height="45" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <path d="M -20 -55 Q 0 -65 20 -55 L 20 -50 L -20 -50 Z" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <g>
        <rect x="20" y="-45" width="12" height="16" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        <circle cx="26" cy="-37" r="2.5" fill={active ? "#22c55e" : "#94a3b8"} stroke="#0f172a" strokeWidth="0.5" className={active ? "animate-pulse" : ""} />
      </g>
    </g>
  );

  const renderShaft = () => (
    <g opacity="1"> 
      <rect x="-3" y="0" width="6" height={height} fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.5" />
      <g>
         {active ? (
           <g className="animate-mix" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
             <g transform={`translate(0, ${height - 15})`}>
                <path d="M -45 0 C -45 -10 -15 -10 0 0 C 15 10 45 10 45 0 L 45 8 C 45 18 15 18 0 8 C -15 -8 -45 -8 -45 0 Z" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1" />
             </g>
             {height > 100 && (
               <g transform={`translate(0, ${height * 0.5})`}>
                 <path d="M -35 -4 C -35 -12 -12 -12 0 -4 C 12 4 35 4 35 -4 L 35 4 C 35 12 12 12 0 4 C -12 -4 -35 -4 -35 -4 Z" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1" />
               </g>
             )}
           </g>
         ) : (
           <g>
             <path transform={`translate(0, ${height - 15})`} d="M -45 0 L 45 0 L 45 8 L -45 8 Z" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1" />
             {height > 100 && (
                <path transform={`translate(0, ${height * 0.5})`} d="M -35 -4 L 35 -4 L 35 4 L -35 4 Z" fill="#f1f5f9" stroke="#1e293b" strokeWidth="1" />
             )}
           </g>
         )}
      </g>
    </g>
  );

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {(part === 'all' || part === 'shaft') && renderShaft()}
      {(part === 'all' || part === 'motor') && renderMotor()}
    </g>
  );
};

type FlowDirection = 'up' | 'down' | 'left' | 'right';

const Valve: React.FC<{ x: number; y: number; isOpen: boolean; flowDirection?: FlowDirection }> = ({ x, y, isOpen, flowDirection = 'right' }) => {
  const getSteamPhysics = () => {
    switch (flowDirection) {
      case 'up':    return { x: 0, y: -8, dx: 0, dy: -35 };
      case 'down':  return { x: 0, y: 8,  dx: 0, dy: 35 };
      case 'left':  return { x: -8, y: 0, dx: -35, dy: 0 };
      case 'right': default: return { x: 8,  y: 0, dx: 35, dy: 0 };
    }
  };
  const p = getSteamPhysics();
  const rotation = flowDirection === 'up' || flowDirection === 'down' ? 90 : 0;

  return (
    <g transform={`translate(${x}, ${y})`}>
       <g transform={`rotate(${rotation})`}>
        {isOpen && (
           <circle cx="0" cy="-14" r="16" fill="white" opacity="0.1" className="animate-pulse" />
        )}
        <path d="M -8 -6 L -8 6 L 8 -6 L 8 6 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#94a3b8" strokeWidth="2" />
        <g transform="translate(0, -14)">
           <circle cx="0" cy="0" r="8" fill={isOpen ? "#22c55e" : "#ef4444"} stroke="#0f172a" strokeWidth="1" className="transition-colors duration-500" />
           <g>
             {isOpen && (
                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />
             )}
             <path d="M -6 0 L 6 0 M 0 -6 L 0 6" stroke="#f8fafc" strokeWidth="1.5" />
           </g>
        </g>
      </g>
      {isOpen && (
        <g className="pointer-events-none">
           {[0, 1, 2].map((i) => (
             <circle key={i} cx={p.x} cy={p.y} r={2 + i} fill="#e2e8f0" opacity="0.6" filter="blur(2px)">
               <animate attributeName="cx" from={p.x} to={p.x + p.dx} dur={`${0.6 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
               <animate attributeName="cy" from={p.y} to={p.y + p.dy} dur={`${0.6 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
               <animate attributeName="opacity" values="0.6;0" dur={`${0.6 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
             </circle>
           ))}
        </g>
      )}
    </g>
  );
};

const PipeLabel: React.FC<{ x: number; y: number; text: string; color?: string; align?: 'middle' | 'start' | 'end'; active?: boolean; }> = ({ x, y, text, color = "#94a3b8", align = 'middle', active = false }) => (
  <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
    <g className={active ? "animate-label-pulse" : ""}>
        <rect x={align === 'middle' ? -70 : align === 'start' ? 0 : -140} y="-14" width="140" height="28" rx="4" fill="#0f172a" fillOpacity="0.95" stroke={active ? color : "#475569"} strokeWidth={active ? 2 : 1} />
        <text x={align === 'middle' ? 0 : align === 'start' ? 70 : -70} y="5" textAnchor="middle" fill={active ? color : "#cbd5e1"} fontSize="11" fontWeight="bold" fontFamily="sans-serif">{text}</text>
    </g>
  </g>
);

const ProcessDiagram: React.FC<ProcessDiagramProps> = ({ step, temperature, pressure, simSpeed = 1.0 }) => {
  const [hoveredStep, setHoveredStep] = useState<ProcessStep | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [triggerFlash, setTriggerFlash] = useState(false);

  useEffect(() => {
    setTriggerFlash(true);
    const timer = setTimeout(() => setTriggerFlash(false), 500);
    return () => clearTimeout(timer);
  }, [step]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const processColor = useMemo(() => {
    if (temperature <= 50) return FluidColor.COLD;
    if (temperature <= 95) return FluidColor.PREHEAT;
    if (temperature <= 130) return FluidColor.DISCHARGE;
    return FluidColor.HOT;
  }, [temperature]);

  const getPipeColor = (activeSteps: ProcessStep[], defaultColor: string, activeColor: string) => {
    return activeSteps.includes(step) ? activeColor : defaultColor;
  };
  const isFlowing = (activeSteps: ProcessStep[]) => activeSteps.includes(step);

  const getFlowConfig = (fluidType: string, isProcessFluid: boolean = false) => {
    // Base configuration
    let config = { duration: 3.0, size: 3, count: 6 };
    
    switch (fluidType) {
      case FluidColor.STEAM:
      case '#ffffff':
      case 'steam':
        config = { duration: 0.6, size: 1.5, count: 20 };
        break;
      case FluidColor.HOT: 
        config = { duration: 0.8, size: 3, count: 12 };
        break;
      case FluidColor.DISCHARGE: 
        config = { duration: 1.5, size: 3.5, count: 8 };
        break;
      case FluidColor.PREHEAT: 
        config = { duration: 1.8, size: 4, count: 8 };
        break;
      case FluidColor.COLD: 
        config = { duration: 3.0, size: 5, count: 5 };
        break;
      case '#57534e': 
      case '#78716c':
        config = { duration: 5.0, size: 7, count: 3 };
        break;
      case '#3b82f6': 
      case '#0ea5e9':
        config = { duration: 2.0, size: 3, count: 7 };
        break;
      case '#f59e0b': 
      case '#eab308':
        config = { duration: 2.5, size: 4, count: 5 };
        break;
      default:
        config = { duration: 3, size: 3, count: 6 };
    }

    if (isProcessFluid) {
       const pressureFactor = 0.5 + Math.min(pressure, 2.0); 
       config.duration = Math.max(0.4, config.duration / pressureFactor);
    }
    
    // Apply Simulation Speed Multiplier
    config.duration = config.duration / simSpeed;

    return config;
  };

  const getTempIntensity = (step: ProcessStep, type: 'boiler' | 'storage' | 'preheat' | 'hydro' | 'flash' | 'filter') => {
    switch(type) {
      case 'boiler':
         if (step === ProcessStep.REACTION || step === ProcessStep.LINKAGE) return 1.0;
         if (step === ProcessStep.FEEDING) return 0.7; // Heating phase
         return 0.3;
      case 'storage': return 0.1;
      case 'preheat':
         if (step === ProcessStep.FEEDING) return 0.6; // Heating phase
         if (step === ProcessStep.REACTION) return 0.5;
         if (step === ProcessStep.FLASHING) return 0.4; 
         return 0.1;
      case 'hydro':
         if (step === ProcessStep.LINKAGE) return 1.0;
         if (step === ProcessStep.REACTION) return 0.8;
         if (step === ProcessStep.FLASHING) return 0.6;
         if (step === ProcessStep.FEEDING) return 0.3;
         return 0.1;
      case 'flash':
         return step === ProcessStep.FLASHING ? 0.8 : 0.1;
    }
    return 0;
  };

  const getTankLevels = (s: ProcessStep) => {
    const base = { storage: 0.8, preheat: 0.05, hydro: 0.05, flash: 0.05, oil: 0.05, water: 0.05 };
    switch (s) {
      case ProcessStep.IDLE: return base;
      case ProcessStep.CRUSHING: return { ...base, storage: 0.6, preheat: 0.85, oil: 0.7, water: 0.7 };
      case ProcessStep.FEEDING: return { ...base, storage: 0.6, preheat: 0.85, oil: 0.7, water: 0.7 };
      case ProcessStep.REACTION: return { ...base, storage: 0.6, preheat: 0.05, hydro: 0.85, oil: 0.7, water: 0.7 };
      case ProcessStep.LINKAGE: return { ...base, storage: 0.6, preheat: 0.05, hydro: 0.85, oil: 0.7, water: 0.7 };
      case ProcessStep.FLASHING: return { ...base, storage: 0.6, preheat: 0.05, hydro: 0.05, flash: 0.6, oil: 0.7, water: 0.7 };
      case ProcessStep.FILTRATION: return { ...base, storage: 0.6, preheat: 0.05, hydro: 0.05, flash: 0.05, oil: 0.7, water: 0.7 };
      default: return base;
    }
  };

  const levels = getTankLevels(step);
  // We need current Step Duration for CSS transitions, but adjusted by speed
  const stepDuration = STEPS_CONFIG[step].duration / simSpeed;
  
  const valveStates = {
    storageOut: step === ProcessStep.CRUSHING,
    preheatIn: step === ProcessStep.CRUSHING,
    oilWaterOut: step === ProcessStep.CRUSHING,
    auxSteam: step === ProcessStep.FEEDING, 
    transfer: step === ProcessStep.REACTION,
    boilerMain: step === ProcessStep.REACTION || step === ProcessStep.LINKAGE, 
    steamReturn: step === ProcessStep.FEEDING || step === ProcessStep.FLASHING,
    discharge: step === ProcessStep.FLASHING,
    filterIn: step === ProcessStep.FILTRATION
  };

  const isBoilerMainValveOpen = valveStates.boilerMain;
  const isPreheatSteamActive = valveStates.auxSteam;
  const isSteamRecovery = valveStates.steamReturn;
  const isFeedingMaterial = valveStates.storageOut;
  const isTransfer = valveStates.transfer;
  const isDischarge = valveStates.discharge;
  const isFiltration = valveStates.filterIn;

  const isPreheatStirring = step === ProcessStep.CRUSHING || step === ProcessStep.FEEDING || step === ProcessStep.REACTION;
  const isHydroStirring = step === ProcessStep.REACTION || step === ProcessStep.LINKAGE || step === ProcessStep.FLASHING;

  const isStorageActive = step === ProcessStep.IDLE || step === ProcessStep.CRUSHING;
  const isPreheatActive = step === ProcessStep.CRUSHING || step === ProcessStep.FEEDING || step === ProcessStep.REACTION;
  const isHydroActive = step === ProcessStep.REACTION || step === ProcessStep.LINKAGE;
  const isBoilerActive = step === ProcessStep.FEEDING || step === ProcessStep.REACTION || step === ProcessStep.LINKAGE;
  const isFlashActive = step === ProcessStep.FLASHING;
  const isFilterActive = step === ProcessStep.FILTRATION;
  const isSystemIdle = step === ProcessStep.IDLE;
  const PIPE_EMPTY = FluidColor.EMPTY;

  const renderDomeTank = (x: number, y: number, w: number, h: number, title: string, subtitle: string, fluidLevel: number, fluidColor: string, stirrerActive: boolean, temp?: string, steamInjecting: boolean = false, materialActive: boolean = false, steamInletOffset?: number, materialInletOffset?: number, isActive: boolean = false, tooltipStep?: ProcessStep, hoverColor: string = "rgba(56,189,248,0.5)", heatIntensity: number = 0, labelOffsetY: number = 0) => {
    const pathD = `M 0,30 Q ${w/2},-20 ${w},30 L ${w},${h-30} Q ${w/2},${h+20} 0,${h-30} Z`;
    const stirrerY = 5;
    const safeShaftHeight = (h - 80) / 1.2;
    const bubbleX = steamInletOffset !== undefined ? steamInletOffset : w/2;
    const materialInletX = materialInletOffset !== undefined ? materialInletOffset : 40;
    const clipId = `clip-${title.replace(/\s+/g, '')}`;

    // Adaptive styling for small tanks
    const isSmall = w < 100;
    const titleSize = isSmall ? 14 : 20;
    const subtitleSize = isSmall ? 10 : 12;
    const subtitleOffset = isSmall ? 12 : 18;
    const showStirrer = !isSmall;

    return (
      <g 
        transform={`translate(${x}, ${y})`}
        onMouseEnter={() => tooltipStep !== undefined && setHoveredStep(tooltipStep)}
        onMouseLeave={() => setHoveredStep(null)}
        className={`${getActiveClass(isActive, isSystemIdle)} ${tooltipStep !== undefined ? getHoverClass(hoverColor) : ""}`}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <g className={isSystemIdle ? "animate-idle-breath" : ""}>
          <defs><clipPath id={clipId}><path d={pathD} /></clipPath></defs>
          
          {/* Tank Body & Fluid - Grouped for Heat Haze */}
          <g style={ heatIntensity > 0.6 ? { filter: 'url(#heat-haze)' } : {} }>
            <g style={ heatIntensity > 0.6 ? { filter: 'url(#heat-haze-distort)' } : heatIntensity > 0.6 ? { filter: 'url(#heat-haze)' } : {} }>
                <path d={pathD} fill="#1e293b" />
                {showStirrer && <Stirrer x={w/2} y={stirrerY} height={safeShaftHeight} active={stirrerActive} scale={1.2} part="shaft" />}
                <SteamInjectionBubbles x={bubbleX} y={h - 10} active={steamInjecting} height={h - 20} />
                {fluidLevel > 0.2 && <MaterialParticles x={w/2} y={h/2} width={w * 0.7} height={h * 0.7} active={materialActive} mode="mix" />}
                <MaterialInletFlow x={materialInletX} y={0} active={materialActive} type="pour" />
                <g clipPath={`url(#${clipId})`}>
                <rect x="0" y={h * (1 - fluidLevel)} width={w} height={h * fluidLevel} fill={fluidColor} opacity="0.5" className="transition-all ease-in-out" style={{ transitionDuration: `${stepDuration}ms` }} />
                </g>
                <path 
                d={pathD} 
                fill="url(#metal-gradient)" 
                stroke={isActive ? "#38bdf8" : "#94a3b8"} 
                strokeWidth={isActive ? 4 : 3} 
                fillOpacity="0.3" 
                className="transition-all duration-500"
                />
                <HeatOverlay intensity={heatIntensity} pathD={pathD} />
            </g>
          </g>

          {showStirrer && <Stirrer x={w/2} y={stirrerY} height={safeShaftHeight} active={stirrerActive} scale={1.2} part="motor" />}
          <text x={w/2} y={h/2 - labelOffsetY} textAnchor="middle" fill="#cbd5e1" fontSize={titleSize} fontWeight="900" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}} className="pointer-events-none">{title}</text>
          {subtitle && <text x={w/2} y={h/2 + subtitleOffset - labelOffsetY} textAnchor="middle" fill="#94a3b8" fontSize={subtitleSize} fontWeight="bold" className="pointer-events-none">{subtitle}</text>}
          {temp && <text x={w/2} y={h - 25} textAnchor="middle" fill="#ff2222" fontSize="18" fontWeight="900" className="animate-pulse-red pointer-events-none" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 34, 34, 0.8))' }}>{temp}</text>}
        </g>
      </g>
    );
  };

  // --- DIMENSIONS & LAYOUT ---
  const BASE_Y = 400; 
  // Reduced Storage Size
  const STORAGE_W = 115; // Slightly reduced width
  const STORAGE_H = 180; 
  const STORAGE_X = 5; // Shifted Left more
  const STORAGE_Y = BASE_Y - STORAGE_H; 
  
  // Compact Feed Section
  const CONVEYOR_X = 140; // Shifted Left
  const CONVEYOR_Y = BASE_Y - 50;
  const CONVEYOR_HEIGHT = 160;
  
  const CRUSHER_X = 200; // Shifted Left
  const CRUSHER_Y = BASE_Y - 140; 
  const CRUSHER_SCALE = 1.6;

  // New Oil & Water Collection Tanks - Side by Side BELOW Crusher
  const TANK_W = 60;
  const TANK_H = 70;
  
  const OIL_TANK_X = 160; // Left of Crusher center roughly
  const OIL_TANK_Y = 510; // Moved down to bottom edge
  
  const WATER_TANK_X = 240; // Right of Crusher center roughly
  const WATER_TANK_Y = 510;

  // Feed Pump
  const FEED_PUMP_X = 260; // Shifted Left further to accommodate wider pump
  const FEED_PUMP_Y = 350;
  const FEED_PUMP_WIDTH = 90; // Increased from 70

  // Tanks - Compacted Layout
  const PREHEAT_W = 160; // Reduced from 170
  const PREHEAT_H = 220; 
  const PREHEAT_X = 375; // Shifted slightly right (was 360) to avoid pipe overlap
  const PREHEAT_Y = BASE_Y - PREHEAT_H; 
  
  const HYDRO_W = 180; // Reduced from 190
  const HYDRO_H = 260; 
  const HYDRO_X = 560; // Shifted Left (was 600)
  const HYDRO_Y = BASE_Y - HYDRO_H; 
  
  const BOILER_X = 610; // Shifted Left (was 660)
  const BOILER_Y = 500; 
  
  const FLASH_X = 770; // Shifted Left (was 820)
  const FLASH_Y = 180;
  
  // Discharge Pump - Compacted
  const PUMP_X = 890; // Shifted Left (was 930)
  const PUMP_Y = 380;
  const PUMP_WIDTH = 80; // Reduced from 95
  
  // Centrifuge - Shifted Left
  const CENTRIFUGE_X = 1080; // Shifted Right to make room for pipe
  const CENTRIFUGE_SCALE = 1.05; // Reduced from 1.15

  // --- PIPING ---
  const storageOutX = STORAGE_X + STORAGE_W; const storageOutY = BASE_Y - 30;
  const preheatInX = PREHEAT_X + 40; const preheatInY = PREHEAT_Y; 
  
  // New Feed Logic: Storage -> Conveyor -> Crusher -> ScrewPump -> Preheat
  const storageToConveyor = `M ${storageOutX} ${storageOutY} L ${CONVEYOR_X} ${storageOutY} L ${CONVEYOR_X} ${CONVEYOR_Y}`;
  const conveyorToCrusher = `M ${CONVEYOR_X} ${CONVEYOR_Y - CONVEYOR_HEIGHT + 10} L ${CRUSHER_X} ${CONVEYOR_Y - CONVEYOR_HEIGHT + 10} L ${CRUSHER_X} ${CRUSHER_Y - (30 * CRUSHER_SCALE)}`;
  
  // Crusher -> Feed Pump
  const crusherToFeedPump = `M ${CRUSHER_X} ${CRUSHER_Y + (40 * CRUSHER_SCALE)} L ${CRUSHER_X} ${CRUSHER_Y + 50} L ${FEED_PUMP_X} ${CRUSHER_Y + 50} L ${FEED_PUMP_X} ${FEED_PUMP_Y}`;
  
  // Feed Pump -> Preheat
  const feedPumpOutX = FEED_PUMP_X + FEED_PUMP_WIDTH;
  // Adjusted path to go straight up from pump exit, maintaining distance from Preheat tank body
  const feedPumpToPreheat = `M ${feedPumpOutX} ${FEED_PUMP_Y} L ${feedPumpOutX} ${PREHEAT_Y - 30} L ${preheatInX} ${PREHEAT_Y - 30} L ${preheatInX} ${preheatInY}`;
  
  // Branch from Crusher Outlet to Oil/Water Tanks
  const crusherOutX = CRUSHER_X;
  const crusherOutY = CRUSHER_Y + (40 * CRUSHER_SCALE); // Approx 324
  
  const oilTankInletX = OIL_TANK_X + TANK_W/2;
  const waterTankInletX = WATER_TANK_X + TANK_W/2;
  
  // Pipe: Crusher -> Oil Tank (Left/Bottom)
  const oilPipe = `M ${crusherOutX} ${crusherOutY} L ${oilTankInletX} ${crusherOutY} L ${oilTankInletX} ${OIL_TANK_Y}`;
  
  // Pipe: Crusher -> Water Tank (Right/Bottom)
  // Rerouted to avoid overlapping with ScrewPump at (260, 350)
  // Path: Crusher Out (200, 324) -> Down (200, 340) -> Right (225, 340) -> Down (225, 450) -> Right (270, 450) -> Down to Tank
  const waterPipe = `M ${crusherOutX} 324 L ${crusherOutX} 340 L ${crusherOutX + 25} 340 L ${crusherOutX + 25} 450 L ${waterTankInletX} 450 L ${waterTankInletX} ${WATER_TANK_Y}`;

  const preheatOutX = PREHEAT_X + 80; const gapX = (PREHEAT_X + PREHEAT_W + HYDRO_X) / 2; const transferTopY = 140; const hydroInX = HYDRO_X + 40;
  const transferPipe = `M ${preheatOutX} ${BASE_Y} L ${preheatOutX} ${BASE_Y + 30} L ${gapX} ${BASE_Y + 30} L ${gapX} ${transferTopY} L ${hydroInX} ${transferTopY} L ${hydroInX} ${HYDRO_Y}`;
  const boilerSteamOutX = BOILER_X; const preheatSteamInX = PREHEAT_X + 40; 
  const boilerToPreheatPipe = `M ${boilerSteamOutX} ${BOILER_Y + 30} L ${boilerSteamOutX} ${BOILER_Y + 50} L ${preheatSteamInX} ${BOILER_Y + 50} L ${preheatSteamInX} ${BASE_Y}`;
  const auxValveX = (BOILER_X + PREHEAT_X) / 2 + 20;
  const boilerMainX = BOILER_X + 40; const hydroSteamInX = HYDRO_X + HYDRO_W / 2;
  const boilerPipeMain = `M ${boilerMainX} ${BOILER_Y} L ${boilerMainX} ${BASE_Y + 10} L ${hydroSteamInX} ${BASE_Y + 10} L ${hydroSteamInX} ${BASE_Y - 5}`;
  const mainValveX = boilerMainX; const mainValveY = BOILER_Y - 30;
  const preheatSteamRetX = PREHEAT_X + PREHEAT_W - 30;
  const steamReturnPipe = `M ${FLASH_X + 50} ${FLASH_Y} L ${FLASH_X + 50} 50 L ${preheatSteamRetX} 50 L ${preheatSteamRetX} ${PREHEAT_Y}`; 
  const hydroOutX = HYDRO_X + HYDRO_W - 30;
  const dischargePipe = `M ${hydroOutX} ${BASE_Y} L ${hydroOutX} ${BASE_Y + 20} L ${hydroOutX} ${BASE_Y + 20} L ${FLASH_X} ${BASE_Y + 20} L ${FLASH_X} ${FLASH_Y + 20}`; 
  const flashBottomX = FLASH_X + 50; const flashBottomY = FLASH_Y + 150; 
  
  // Flash -> Pump (Left side of pump)
  const filterPipePart1 = `M ${flashBottomX} ${flashBottomY} L ${flashBottomX} ${PUMP_Y} L ${PUMP_X} ${PUMP_Y}`;
  
  // Pump -> Centrifuge Inlet
  // Centrifuge Inlet adjusted for new positions
  const centrifugeInletX = 1030; // approx center relative to visual
  // Updated Path: Pump Exit -> Right -> Up -> Horizontal Into Centrifuge Axis (y=340)
  const filterPipePart2 = `M ${PUMP_X + PUMP_WIDTH} ${PUMP_Y} L ${CENTRIFUGE_X - 95} ${PUMP_Y} L ${CENTRIFUGE_X - 95} 340 L ${CENTRIFUGE_X - 80} 340`;
  
  const outputLabelY = 530; 
  const labelSpacing = 115; 
  
  // Three-Phase Outputs
  // Centrifuge Center X = 1080.
  // Solid Output (Right): Relative +110 * 1.05 = +115. Abs = 1195.
  const solidOutPipe = `M ${CENTRIFUGE_X + 110} 370 L ${CENTRIFUGE_X + 110} 500`;
  
  // Liquid (Middle/Left): Relative -30. Abs = 1050.
  const liquidOutPipe = `M ${CENTRIFUGE_X - 30} 390 L ${CENTRIFUGE_X - 30} 500`;
  
  // Oil (Far Left): Relative -50. Abs = 1030. Route further left to label.
  const oilOutPipe = `M ${CENTRIFUGE_X - 50} 340 L ${CENTRIFUGE_X - 50} 460 L ${CENTRIFUGE_X - 100} 460 L ${CENTRIFUGE_X - 100} 500`;

  // Flow Configs
  const boilerPreheatFlow = getFlowConfig(FluidColor.STEAM);
  const feedFlow = getFlowConfig(FluidColor.COLD, true); 
  const transferFlow = getFlowConfig(processColor, true); 
  const steamReturnFlow = getFlowConfig('#ffffff');
  const dischargeFlow = getFlowConfig(processColor, true); 
  const boilerMainFlow = getFlowConfig(FluidColor.STEAM);
  const filterInFlow = getFlowConfig(processColor, true); 
  const solidOutFlow = getFlowConfig('#57534e');
  const liquidOutFlow = getFlowConfig('#3b82f6');
  const oilOutFlow = getFlowConfig('#f59e0b');

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onMouseMove={handleMouseMove}>
      <svg viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" /> <stop offset="50%" stopColor="#cbd5e1" /> <stop offset="100%" stopColor="#94a3b8" /> 
          </linearGradient>
          <linearGradient id="tank-body" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#64748b" /> <stop offset="30%" stopColor="#94a3b8" /> <stop offset="60%" stopColor="#64748b" /> 
          </linearGradient>
          <linearGradient id="boiler-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
             <stop offset="0%" stopColor="#f87171" /> <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="centrifuge-drum" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <pattern id="drum-stripes" width="10" height="20" patternUnits="userSpaceOnUse">
             <rect x="0" y="0" width="10" height="4" fill="#334155" opacity="0.6" />
          </pattern>
          <pattern id="strong-stripes" width="20" height="20" patternUnits="userSpaceOnUse">
             <rect x="0" y="0" width="20" height="8" fill="#0f172a" opacity="0.8" />
          </pattern>
          <pattern id="screw-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
             <line x1="10" y1="0" x2="10" y2="20" stroke="#000" strokeWidth="4" opacity="0.3" />
          </pattern>
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/></pattern>
           
           {/* Insulation Pattern */}
           <pattern id="insulation-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
             <rect x="0" y="0" width="10" height="10" fill="#475569" opacity="0.2" />
             <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
           </pattern>

           {/* Screw Movement Pattern */}
           {/* Note: This is a duplicate ID to the one added above. Let's fix this in the output to only have one. */}
           
           {/* Heat Haze Filter */}
           <filter id="heat-haze" x="-10%" y="-10%" width="120%" height="120%">
             <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence">
               <animate attributeName="baseFrequency" values="0.05;0.055;0.05" dur="0.5s" repeatCount="indefinite" />
             </feTurbulence>
             <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" xChannelSelector="R" yChannelSelector="G" />
           </filter>
           
           {/* Heat Haze Filter for Background Distortion */}
           <filter id="heat-haze-distort" x="-10%" y="-10%" width="120%" height="120%">
             <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence">
               <animate attributeName="baseFrequency" values="0.05;0.055;0.05" dur="0.5s" repeatCount="indefinite" />
             </feTurbulence>
             <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" xChannelSelector="R" yChannelSelector="G" />
           </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className={isSystemIdle ? "animate-grid-pulse" : ""} />

        {/* PIPES */}
        
        {/* Boiler to Preheat */}
        <InsulatedPipePath pathD={boilerToPreheatPipe} width={14} />
        <PipeGlow pathD={boilerToPreheatPipe} color={FluidColor.STEAM} active={isPreheatSteamActive} width={10} blur={4} />
        <path d={boilerToPreheatPipe} fill="none" stroke={isPreheatSteamActive ? FluidColor.STEAM : PIPE_EMPTY} strokeWidth="4" strokeDasharray="4 4" className={isPreheatSteamActive ? 'animate-flow-fast' : ''} strokeLinecap="round" />
        <Valve x={auxValveX} y={BOILER_Y + 50} isOpen={valveStates.auxSteam} flowDirection="left" />
        <PipeFlowParticles pathD={boilerToPreheatPipe} fluidType="steam" active={isPreheatSteamActive} duration={boilerPreheatFlow.duration} size={boilerPreheatFlow.size} count={boilerPreheatFlow.count} />
        
        {/* Feed Pipes with Particles (Updated Logic) */}
        {/* 1. Storage -> Conveyor */}
        <path d={storageToConveyor} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, FluidColor.COLD)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={storageToConveyor} color={FluidColor.COLD} active={isFeedingMaterial} duration={feedFlow.duration} size={feedFlow.size} count={feedFlow.count} />
        
        {/* 2. Conveyor -> Crusher */}
        <path d={conveyorToCrusher} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, FluidColor.COLD)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={conveyorToCrusher} color={FluidColor.COLD} active={isFeedingMaterial} duration={feedFlow.duration} size={feedFlow.size} count={feedFlow.count} />

        {/* 3. Crusher -> Feed Pump (New) */}
        <path d={crusherToFeedPump} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, FluidColor.COLD)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={crusherToFeedPump} color={FluidColor.COLD} active={isFeedingMaterial} duration={feedFlow.duration} size={feedFlow.size} count={feedFlow.count} />
        
        {/* Feed Pump Component */}
        <ScrewPump x={FEED_PUMP_X} y={FEED_PUMP_Y} active={isFeedingMaterial} width={FEED_PUMP_WIDTH} />

        {/* 4. Feed Pump -> Preheat */}
        <path d={feedPumpToPreheat} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, FluidColor.COLD)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={feedPumpToPreheat} color={FluidColor.COLD} active={isFeedingMaterial} duration={feedFlow.duration} size={feedFlow.size} count={feedFlow.count} />
        
        {/* 5. Crusher -> Oil Tank (New Separation) */}
        <path d={oilPipe} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, "#f59e0b")} strokeWidth="6" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={oilPipe} color="#f59e0b" active={isFeedingMaterial} duration={feedFlow.duration} size={2} count={4} />

        {/* 6. Crusher -> Water Tank (New Separation) */}
        <path d={waterPipe} fill="none" stroke={getPipeColor([ProcessStep.CRUSHING], PIPE_EMPTY, "#0ea5e9")} strokeWidth="6" strokeDasharray="10 5" className={isFlowing([ProcessStep.CRUSHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={waterPipe} color="#0ea5e9" active={isFeedingMaterial} duration={feedFlow.duration} size={2} count={4} />

        {/* Transfer Pipe */}
        <InsulatedPipePath pathD={transferPipe} width={14} />
        <PipeGlow pathD={transferPipe} color={processColor} active={isTransfer} />
        <path d={transferPipe} fill="none" stroke={getPipeColor([ProcessStep.REACTION], PIPE_EMPTY, processColor)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.REACTION]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <Valve x={gapX} y={transferTopY} isOpen={valveStates.transfer} flowDirection="right" />
        <PipeFlowParticles pathD={transferPipe} color={processColor} active={isTransfer} duration={transferFlow.duration} size={transferFlow.size} count={transferFlow.count} />
        
        {/* Steam Return Pipe */}
        {isSteamRecovery && (
          <g>
            <path d={steamReturnPipe} fill="none" stroke="#f97316" strokeWidth="16" strokeOpacity="0.3" filter="blur(6px)">
               <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
            </path>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
               <HeatWave key={i} x={FLASH_X - (i * 60)} y={45} delay={i * 0.2} />
            ))}
          </g>
        )}
        <InsulatedPipePath pathD={steamReturnPipe} width={18} />
        <path d={steamReturnPipe} fill="none" stroke={getPipeColor([ProcessStep.FEEDING, ProcessStep.FLASHING], PIPE_EMPTY, FluidColor.STEAM)} strokeWidth="12" strokeDasharray="20 10" className={isFlowing([ProcessStep.FEEDING, ProcessStep.FLASHING]) ? 'animate-flow-fast' : ''} filter="drop-shadow(0 0 2px rgba(255,255,255,0.1))" strokeLinecap="round" />
        <Valve x={FLASH_X + 50} y={50} isOpen={valveStates.steamReturn} flowDirection="left" />
        <PipeFlowParticles pathD={steamReturnPipe} fluidType="steam" active={isSteamRecovery} duration={steamReturnFlow.duration} size={steamReturnFlow.size} count={steamReturnFlow.count} />
        
        {/* Discharge Pipe */}
        <InsulatedPipePath pathD={dischargePipe} width={14} />
        <PipeGlow pathD={dischargePipe} color={processColor} active={isDischarge} />
        <path d={dischargePipe} fill="none" stroke={getPipeColor([ProcessStep.FLASHING], PIPE_EMPTY, processColor)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.FLASHING]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <Valve x={hydroOutX} y={BASE_Y + 10} isOpen={valveStates.discharge} flowDirection="down" />
        <PipeFlowParticles pathD={dischargePipe} color={processColor} active={isDischarge} duration={dischargeFlow.duration} size={dischargeFlow.size} count={dischargeFlow.count} />

        {/* Boiler Main Pipe */}
        <InsulatedPipePath pathD={boilerPipeMain} width={14} />
        {isBoilerMainValveOpen && (
          <path d={boilerPipeMain} fill="none" stroke="#ffffff" strokeWidth="18" strokeOpacity="0.6" filter="blur(6px)" style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}>
             <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
             <animate attributeName="stroke-width" values="18;24;18" dur="1.5s" repeatCount="indefinite" />
          </path>
        )}
        <PipeGlow pathD={boilerPipeMain} color={FluidColor.STEAM} active={isBoilerMainValveOpen} width={12} blur={4} />
        <path d={boilerPipeMain} fill="none" stroke={isBoilerMainValveOpen ? FluidColor.STEAM : PIPE_EMPTY} strokeWidth="6" strokeDasharray="4 4" className={isBoilerMainValveOpen ? 'animate-flow-fast' : ''} strokeLinecap="round" />
        <Valve x={mainValveX} y={mainValveY} isOpen={valveStates.boilerMain} flowDirection="up" />
        <PipeFlowParticles pathD={boilerPipeMain} fluidType="steam" active={isBoilerMainValveOpen} duration={boilerMainFlow.duration} size={boilerMainFlow.size} count={boilerMainFlow.count} />
        
        {/* Screw Pump Feed Pipe (Part 1: Flash -> Pump) */}
        <path d={filterPipePart1} fill="none" stroke={getPipeColor([ProcessStep.FILTRATION], PIPE_EMPTY, processColor)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.FILTRATION]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <Valve x={flashBottomX} y={flashBottomY + 30} isOpen={valveStates.filterIn} flowDirection="down" />
        <PipeFlowParticles pathD={filterPipePart1} color={processColor} active={isFiltration} duration={filterInFlow.duration} size={filterInFlow.size} count={filterInFlow.count} />

        {/* Screw Pump Component */}
        <ScrewPump x={PUMP_X} y={PUMP_Y} active={isFiltration} width={PUMP_WIDTH} />
        
        {/* Screw Pump Outlet Pipe (Part 2: Pump -> Centrifuge) */}
        <path d={filterPipePart2} fill="none" stroke={getPipeColor([ProcessStep.FILTRATION], PIPE_EMPTY, processColor)} strokeWidth="8" strokeDasharray="10 5" className={isFlowing([ProcessStep.FILTRATION]) ? 'animate-flow' : ''} strokeLinecap="round" />
        <PipeFlowParticles pathD={filterPipePart2} color={processColor} active={isFiltration} duration={filterInFlow.duration} size={filterInFlow.size} count={filterInFlow.count} />
        
        {/* 3-Phase Output Pipes - REFINED COLORS & ICONS */}
        
        {/* Oil Output (Left) */}
        <path d={oilOutPipe} fill="none" stroke={isFiltration ? "#f59e0b" : PIPE_EMPTY} strokeWidth="6" className={isFiltration ? 'animate-flow' : ''}/>
        <PipeFlowParticles pathD={oilOutPipe} fluidType="oil" active={isFiltration} duration={oilOutFlow.duration} size={oilOutFlow.size} count={oilOutFlow.count} />
        <SwirlEffect x={CENTRIFUGE_X - 50} y={350} color="#f59e0b" active={isFiltration} />
        <Droplets x={1030} y={355} size={20} color="#f59e0b" className={isFiltration ? "animate-bounce" : "opacity-30"} />
        
        {/* Liquid Output (Middle) */}
        <path d={liquidOutPipe} fill="none" stroke={isFiltration ? "#0ea5e9" : PIPE_EMPTY} strokeWidth="6" className={isFiltration ? 'animate-flow' : ''}/>
        <PipeFlowParticles pathD={liquidOutPipe} fluidType="water" active={isFiltration} duration={liquidOutFlow.duration} size={liquidOutFlow.size} count={liquidOutFlow.count} />
        <SwirlEffect x={CENTRIFUGE_X - 30} y={390} color="#0ea5e9" active={isFiltration} />
        <Waves x={1055} y={385} size={20} color="#0ea5e9" className={isFiltration ? "animate-pulse" : "opacity-30"} />

        {/* Solids Output (Right) */}
        <path d={solidOutPipe} fill="none" stroke={isFiltration ? "#a8a29e" : PIPE_EMPTY} strokeWidth="8" className={isFiltration ? 'animate-flow' : ''}/>
        <PipeFlowParticles pathD={solidOutPipe} fluidType="solid" active={isFiltration} duration={solidOutFlow.duration} size={solidOutFlow.size} count={solidOutFlow.count} />
        <Box x={1180} y={365} size={20} color="#a8a29e" className={isFiltration ? "animate-bounce" : "opacity-30"} />

        {/* EQUIPMENT */}
        <g 
           transform={`translate(${BOILER_X}, ${BOILER_Y})`}
           onMouseEnter={() => setHoveredStep(ProcessStep.REACTION)}
           onMouseLeave={() => setHoveredStep(null)}
           className={`${getActiveClass(isBoilerActive, isSystemIdle)} ${getHoverClass("rgba(239,68,68,0.6)")}`}
           style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g className={isSystemIdle ? "animate-idle-breath" : ""}>
             <g style={ getTempIntensity(step, 'boiler') > 0.6 ? { filter: 'url(#heat-haze)' } : {} }>
                <g style={ getTempIntensity(step, 'boiler') > 0.6 ? { filter: 'url(#heat-haze-distort)' } : getTempIntensity(step, 'boiler') > 0.6 ? { filter: 'url(#heat-haze)' } : {} }>
                    <rect 
                    x="0" y="0" width="80" height="60" rx="10" 
                    fill="url(#boiler-gradient)" 
                    stroke={isBoilerActive ? "#fca5a5" : "#ef4444"} 
                    strokeWidth={isBoilerActive ? 4 : 2} 
                    className="transition-all duration-500"
                    />
                    <HeatOverlay intensity={getTempIntensity(step, 'boiler')} x={0} y={0} width={80} height={60} rx={10} />
                    <path d="M 10 0 L 10 -10 L 70 -10 L 70 0" fill="none" stroke="#b91c1c" strokeWidth="4" />
                    <circle cx="40" cy="30" r="15" fill="#7f1d1d" />
                    <Flame x="28" y="18" className="text-orange-300 animate-pulse" size={24} />
                </g>
             </g>
             <text x="40" y="75" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="bold">Boiler</text>
          </g>
        </g>
        
        <g 
           transform={`translate(${STORAGE_X}, ${STORAGE_Y})`}
           onMouseEnter={() => setHoveredStep(ProcessStep.IDLE)}
           onMouseLeave={() => setHoveredStep(null)}
           className={`${getActiveClass(isStorageActive, isSystemIdle)} ${getHoverClass("rgba(59,130,246,0.6)")}`}
           style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g className={isSystemIdle ? "animate-idle-breath" : ""}>
             <defs><rect id="clip-storage" x="0" y="0" width={STORAGE_W} height={STORAGE_H} rx="12" /></defs>
             <rect x="0" y="0" width={STORAGE_W} height={STORAGE_H} rx="12" fill="#1e293b" />
             <g clipPath="url(#clip-storage)">
               <rect x="0" y={STORAGE_H * (1 - levels.storage)} width={STORAGE_W} height={STORAGE_H * levels.storage} fill={FluidColor.COLD} opacity="0.3" className="transition-all ease-in-out" style={{ transitionDuration: `${stepDuration}ms` }} />
             </g>
             {/* Stirrer Removed */}
             <rect 
               x="0" y="0" width={STORAGE_W} height={STORAGE_H} rx="12" 
               fill="url(#tank-body)" 
               stroke={isStorageActive ? "#38bdf8" : "#94a3b8"} 
               strokeWidth={isStorageActive ? 4 : 2} 
               fillOpacity="0.3" 
               className="transition-all duration-500"
             />
             <HeatOverlay intensity={getTempIntensity(step, 'storage')} x={0} y={0} width={STORAGE_W} height={STORAGE_H} rx={12} />
             {/* Stirrer Motor Removed */}
             <text x={STORAGE_W/2} y={STORAGE_H/2} textAnchor="middle" fill="#cbd5e1" fontSize="24" fontWeight="900" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}} className="pointer-events-none">Storage</text>
          </g>
        </g>
        
        {/* NEW Feeding Equipment */}
        <VerticalConveyor x={CONVEYOR_X} y={CONVEYOR_Y} height={CONVEYOR_HEIGHT} active={isFeedingMaterial} />
        <Crusher x={CRUSHER_X} y={CRUSHER_Y} active={isFeedingMaterial} scale={CRUSHER_SCALE} />
        
        {/* Oil Collection Tank (Left Bottom) */}
        {renderDomeTank(OIL_TANK_X, OIL_TANK_Y, TANK_W, TANK_H, "Oil", "", levels.oil, "#f59e0b", false, undefined, false, false, undefined, undefined, isFeedingMaterial, undefined)}

        {/* Water Collection Tank (Right Bottom) */}
        {renderDomeTank(WATER_TANK_X, WATER_TANK_Y, TANK_W, TANK_H, "Water", "", levels.water, "#0ea5e9", false, undefined, false, false, undefined, undefined, isFeedingMaterial, undefined)}

        {renderDomeTank(PREHEAT_X, PREHEAT_Y, PREHEAT_W, PREHEAT_H, "Preheat", "Preheating Tank", levels.preheat, FluidColor.PREHEAT, isPreheatStirring, undefined, isPreheatSteamActive, step === ProcessStep.CRUSHING || step === ProcessStep.REACTION, 40, 40, isPreheatActive, ProcessStep.CRUSHING, "rgba(249,115,22,0.6)", getTempIntensity(step, 'preheat'), 18)}
        <Valve x={preheatInX} y={PREHEAT_Y - 30} isOpen={valveStates.preheatIn} flowDirection="down" />
        {(() => {
          return renderDomeTank(HYDRO_X, HYDRO_Y, HYDRO_W, HYDRO_H, "Hydrolysis", "Reactor", levels.hydro, FluidColor.HOT, isHydroStirring, undefined, isBoilerMainValveOpen, step === ProcessStep.REACTION || step === ProcessStep.LINKAGE, HYDRO_W / 2, 40, isHydroActive, ProcessStep.LINKAGE, "rgba(220,38,38,0.6)", getTempIntensity(step, 'hydro'));
        })()}
        
        {/* Pressure Gauge & Safety Valve for Hydrolysis */}
        <PressureGauge x={HYDRO_X + HYDRO_W} y={HYDRO_Y + HYDRO_H * 0.65} value={pressure} />
        <SafetyValve x={HYDRO_X + HYDRO_W / 2 + 50} y={HYDRO_Y + 28} active={pressure > 1.6} />

        <g 
           transform={`translate(${FLASH_X}, ${FLASH_Y})`}
           onMouseEnter={() => setHoveredStep(ProcessStep.FLASHING)}
           onMouseLeave={() => setHoveredStep(null)}
           className={`${getActiveClass(isFlashActive, isSystemIdle)} ${getHoverClass("rgba(234,179,8,0.6)")}`}
           style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g className={isSystemIdle ? "animate-idle-breath" : ""}>
             {(() => {
               const flashBodyPath = "M 0,0 L 100,0 L 80,100 L 20,100 Z";
               return (
                 <>
                   <defs><clipPath id="clip-flash"><path d="M 0,0 L 100,0 L 80,100 L 20,100 Z M 20,100 L 20,150 L 80,150 L 80,100" /></clipPath></defs>
                   <path 
                     d={flashBodyPath} 
                     fill="url(#tank-body)" 
                     stroke={isFlashActive ? "#38bdf8" : "#94a3b8"} 
                     strokeWidth={isFlashActive ? 3 : 2} 
                     className="transition-all duration-500"
                   />
                   <g transform="translate(0, 100)">
                     <rect x="20" y={50 * (1 - levels.flash)} width="60" height={50 * levels.flash} fill={FluidColor.DISCHARGE} opacity="0.6" className="transition-all ease-in-out" style={{ transitionDuration: `${stepDuration}ms` }} />
                   </g>
                   <MaterialInletFlow x={0} y={20} active={step === ProcessStep.FLASHING} type="jet" />
                   <g transform="translate(50, 60)"><MaterialParticles x={0} y={0} width={70} height={70} active={step === ProcessStep.FLASHING} mode="fall" /></g>
                   <path d="M 20,100 L 20,150 L 80,150 L 80,100" fill="url(#tank-body)" stroke="#94a3b8" strokeWidth="2" fillOpacity="0.5" />
                   <HeatOverlay intensity={getTempIntensity(step, 'flash')} pathD={flashBodyPath} />
                   <text x="50" y="80" textAnchor="middle" fill="#cbd5e1" fontSize="14" className="pointer-events-none">Flash Evaporation</text>
                   <text x="50" y="95" textAnchor="middle" fill="#cbd5e1" fontSize="10" className="pointer-events-none">Flash Tank</text>
                   {(step === ProcessStep.FLASHING) && (<g><circle cx="50" cy="20" r="30" fill="white" opacity="0.6" filter="blur(10px)" className="animate-pulse" /><text x="50" y="-20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">Recycle Steam</text></g>)}
                 </>
               );
             })()}
          </g>
        </g>
        
        {/* Decanter Centrifuge - Thinner and Longer Design */}
        <g 
           transform={`translate(${CENTRIFUGE_X}, 340) scale(${CENTRIFUGE_SCALE})`}
           onMouseEnter={() => setHoveredStep(ProcessStep.FILTRATION)}
           onMouseLeave={() => setHoveredStep(null)}
           className={`${getActiveClass(isFilterActive, isSystemIdle)} ${getHoverClass("rgba(6,182,212,0.6)")}`}
           style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          {/* Vibration Group */}
          <g>
             {isFilterActive && (
                <animateTransform attributeName="transform" type="translate" values="-0.5,-0.5; 0.5,0.5; -0.5,0.5; 0.5,-0.5; -0.5,-0.5" dur="0.05s" repeatCount="indefinite" />
             )}
             
             <g className={isSystemIdle ? "animate-idle-breath" : ""}>
               {/* Motor Housing (Left) */}
               <rect 
                 x="-80" y="-25" width="30" height="50" rx="4" 
                 fill="#64748b" 
                 stroke={isFilterActive ? "#38bdf8" : "#1e293b"} 
                 strokeWidth={isFilterActive ? 2 : 1}
                 className="transition-all duration-500"
               />
               <rect x="-50" y="-15" width="10" height="30" fill="#475569" stroke="#1e293b"/>
               
               {/* Main Bowl (Cylinder) - Thinner and Longer */}
               <g>
                 {/* Clips for Internal Animations */}
                 <defs>
                   <clipPath id={`drum-clip-${CENTRIFUGE_X}`}>
                     <path d="M -40 -25 L 60 -25 L 60 25 L -40 25 Z" />
                   </clipPath>
                   <clipPath id={`cone-clip-${CENTRIFUGE_X}`}>
                     <path d="M 60,-25 L 110,-12 L 110,12 L 60,25 Z" />
                   </clipPath>
                 </defs>
                 
                 {/* Cylinder Body */}
                 <rect x="-40" y="-25" width="100" height="50" rx="2" fill="url(#centrifuge-drum)" />
                 
                 {/* Internal Animation Group */}
                 <g clipPath={`url(#drum-clip-${CENTRIFUGE_X})`}>
                    {/* 1. Rotation (Vertical Motion of Stripes) */}
                    <rect x="-40" y="-60" width="100" height="120" fill="url(#strong-stripes)" opacity="0.6">
                       {isFilterActive && (
                         <animate attributeName="y" from="-60" to="-40" dur="0.2s" repeatCount="indefinite" />
                       )}
                    </rect>
                    
                    {/* 2. Screw Material Movement (Horizontal Motion) */}
                    <rect x="-40" y="-25" width="100" height="50" fill="url(#screw-pattern)" opacity="0.4">
                        {isFilterActive && (
                           <animate attributeName="x" from="-40" to="-20" dur="0.5s" repeatCount="indefinite" />
                        )}
                    </rect>
                 </g>
                 
                 {/* Frame Outline */}
                 <rect 
                   x="-40" y="-25" width="100" height="50" rx="2" 
                   fill="none" 
                   stroke={isFilterActive ? "#38bdf8" : "#475569"} 
                   strokeWidth={isFilterActive ? 3 : 2} 
                   className="transition-all duration-500"
                 />
                 
                 {/* Conical Section (Right) */}
                 <path d="M 60,-25 L 110,-12 L 110,12 L 60,25 Z" fill="url(#metal-gradient)" />
                 
                 <g clipPath={`url(#cone-clip-${CENTRIFUGE_X})`}>
                    {/* Rotation */}
                    <rect x="60" y="-60" width="50" height="120" fill="url(#strong-stripes)" opacity="0.6">
                       {isFilterActive && (
                         <animate attributeName="y" from="-60" to="-40" dur="0.2s" repeatCount="indefinite" />
                       )}
                    </rect>
                    {/* Material Pushing */}
                    <rect x="60" y="-25" width="50" height="50" fill="url(#screw-pattern)" opacity="0.4">
                        {isFilterActive && (
                           <animate attributeName="x" from="60" to="80" dur="0.5s" repeatCount="indefinite" />
                        )}
                    </rect>
                 </g>
                 
                 <path d="M 60,-25 L 110,-12 L 110,12 L 60,25 Z" fill="none" stroke="#475569" strokeWidth="2" />
                 
                 {/* Reflection Highlight */}
                 <rect x="-40" y="-10" width="100" height="20" fill="white" opacity="0.1" pointerEvents="none" />
               </g>

               {/* Bearing Block Right */}
               <rect x="110" y="-15" width="10" height="30" fill="#475569" stroke="#1e293b" />
               
               {/* Stand/Legs */}
               <path d="M -65 25 L -65 50 L 120 50 L 120 25" fill="none" stroke="#475569" strokeWidth="8" />

               {/* Discharge Chutes with Active Glow */}
               <g>
                 {/* Solid (Right) */}
                 {isFilterActive && (
                    <path d="M 100,12 L 100,25 L 110,25 L 110,12" fill="#d6d3d1" filter="blur(3px)" opacity="0.7">
                       <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.3s" repeatCount="indefinite" />
                    </path>
                 )}
                 <path d="M 100,12 L 100,25 L 110,25 L 110,12" fill={isFilterActive ? "#a8a29e" : "#475569"} className="transition-colors duration-300" />
               </g>
               
               <g>
                 {/* Liquid (Middle) */}
                 {isFilterActive && (
                    <path d="M -30,25 L -30,35 L -10,35 L -10,25" fill="#7dd3fc" filter="blur(3px)" opacity="0.7">
                       <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.3s" repeatCount="indefinite" />
                    </path>
                 )}
                 <path d="M -30,25 L -30,35 L -10,35 L -10,25" fill={isFilterActive ? "#38bdf8" : "#475569"} className="transition-colors duration-300" />
               </g>
               
               <g>
                 {/* Oil (Left) */}
                 {isFilterActive && (
                    <path d="M -50,25 L -50,35 L -35,35 L -35,25" fill="#fcd34d" filter="blur(3px)" opacity="0.7">
                       <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.3s" repeatCount="indefinite" />
                    </path>
                 )}
                 <path d="M -50,25 L -50,35 L -35,35 L -35,25" fill={isFilterActive ? "#fbbf24" : "#475569"} className="transition-colors duration-300" />
               </g>

               <text x="35" y="70" textAnchor="middle" fill="#cbd5e1" fontSize="12" className="pointer-events-none font-bold">Decanter Centrifuge</text>
             </g>
          </g>
        </g>
        
        {/* Sensor Indicators */}
        <SensorIndicator x={STORAGE_X + STORAGE_W - 20} y={STORAGE_Y + 20} label="LEVEL OK" active={isSystemIdle} type="LEVEL" />
        <SensorIndicator x={PREHEAT_X + PREHEAT_W - 20} y={PREHEAT_Y + 30} label="TEMP OK" active={isSystemIdle} type="TEMP" />
        <SensorIndicator x={HYDRO_X + HYDRO_W - 20} y={HYDRO_Y + 40} label="PRESS OK" active={isSystemIdle} type="PRESS" />
        <SensorIndicator x={BOILER_X + 60} y={BOILER_Y - 10} label="PRESS OK" active={isSystemIdle} type="PRESS" />
        <SensorIndicator x={FLASH_X + 60} y={FLASH_Y + 20} label="LEVEL OK" active={isSystemIdle} type="LEVEL" />
        
        {/* LABELS - Bilingual Updates */}
        
        <PipeLabel x={600} y={50} text="Steam Recovery" color="#ef4444" active={isSteamRecovery} />
        <PipeLabel x={670} y={470} text="Main Steam" color="#ef4444" active={isBoilerMainValveOpen} align="start" />
        <PipeLabel x={500} y={575} text="Aux Heat" color="#ef4444" active={isPreheatSteamActive} />
        
        {/* 3-Phase Output Labels - Side-by-Side Alignment */}
        {/* Oil (Left) */}
        <PipeLabel x={CENTRIFUGE_X - labelSpacing} y={outputLabelY} text="Oil" color="#f59e0b" active={isFiltration} />
        {/* Liquid (Middle) */}
        <PipeLabel x={CENTRIFUGE_X} y={outputLabelY} text="Liquid" color="#0ea5e9" active={isFiltration} />
        {/* Solid (Right) */}
        <PipeLabel x={CENTRIFUGE_X + labelSpacing} y={outputLabelY} text="Solid" color="#a8a29e" active={isFiltration} />
        
      </svg>
      
      {/* Tooltip Overlay */}
      {hoveredStep !== null && (
        <div 
          className="absolute z-50 p-4 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-lg shadow-2xl pointer-events-none max-w-xs transition-opacity duration-200"
          style={{ 
            left: Math.min(mousePos.x + 20, SCENE_WIDTH - 300), 
            top: Math.min(mousePos.y + 20, SCENE_HEIGHT - 100),
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${step === hoveredStep ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <h4 className="text-slate-200 font-bold text-sm">{STEPS_CONFIG[hoveredStep].title}</h4>
          </div>
          <p className="text-blue-400 text-xs font-semibold mb-1">{STEPS_CONFIG[hoveredStep].description}</p>
          <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{STEPS_CONFIG[hoveredStep].details}</p>
        </div>
      )}
      
      {/* Step Transition Flash */}
      <div className={`absolute inset-0 pointer-events-none bg-cyan-100 mix-blend-overlay transition-opacity duration-500 ease-out ${triggerFlash ? 'opacity-20' : 'opacity-0'}`} />
    </div>
  );
};

export default ProcessDiagram;