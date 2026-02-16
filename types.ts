export enum ProcessStep {
  IDLE = 0,
  CRUSHING = 1,
  FEEDING = 2,
  REACTION = 3,
  LINKAGE = 4,
  FLASHING = 5,
  FILTRATION = 6
}

export interface SimState {
  step: ProcessStep;
  temperature: number; // Celsius
  pressure: number; // MPa
  timeElapsed: number; // Seconds
  isPlaying: boolean;
  isTimerPaused: boolean; // Indicates if the timer is manually paused
  simSpeed: number; // Simulation speed multiplier (0.5x - 3.0x)
}

export enum FluidColor {
  COLD = "#3b82f6", // Blue - 20°C
  PREHEAT = "#f97316", // Orange - 90°C
  HOT = "#ef4444", // Red - 180°C
  DISCHARGE = "#eab308", // Yellow - 100°C
  STEAM = "#e2e8f0", // Very Light Grey/White for Steam on dark bg
  WATER = "#06b6d4", // Cyan
  EMPTY = "#334155" // Dark Slate for empty pipes on dark bg
}

export const SCENE_WIDTH = 1200;
export const SCENE_HEIGHT = 600;