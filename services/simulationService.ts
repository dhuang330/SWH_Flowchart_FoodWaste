import { ProcessStep, SimState } from '../types';

export const getNextSimState = (currentStep: ProcessStep): Partial<SimState> => {
  switch (currentStep) {
    case ProcessStep.IDLE:
      return { temperature: 20, pressure: 0.1 };
    case ProcessStep.CRUSHING:
      return { temperature: 20, pressure: 0.2 };
    case ProcessStep.FEEDING:
      return { temperature: 90, pressure: 0.5 };
    case ProcessStep.REACTION:
      // Transfer phase, temp rising
      return { temperature: 140, pressure: 1.2 };
    case ProcessStep.LINKAGE:
      // Holding phase (Hydrolysis)
      return { temperature: 180, pressure: 1.8 };
    case ProcessStep.FLASHING:
      return { temperature: 100, pressure: 0.2 };
    case ProcessStep.FILTRATION:
      return { temperature: 40, pressure: 0.1 };
    default:
      return { temperature: 20, pressure: 0.1 };
  }
};