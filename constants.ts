import { ProcessStep } from './types';

export const STEPS_CONFIG = [
  {
    id: ProcessStep.IDLE,
    title: "System Ready",
    description: "System Check Complete | Waiting for Start",
    details: "Highlights: Subcritical Hydrolysis | Deep Cell Disruption (Yield +30%) | Full Resource Recovery",
    duration: 5000
  },
  {
    id: ProcessStep.CRUSHING,
    title: "Crushing & Pulping",
    description: "Mechanical Crushing | Initial Oil Separation",
    details: "High-torque crushing homogenizes material; free oil separates naturally.",
    duration: 5000
  },
  {
    id: ProcessStep.FEEDING,
    title: "Heat Recovery",
    description: "Direct Steam Heating | Preheating to 90°C",
    details: "Recovers flash steam for direct heating, saving 40% energy.",
    duration: 5000
  },
  {
    id: ProcessStep.REACTION,
    title: "Injection Heating",
    description: "High Pressure Feed | Latent Heat Release",
    details: "Injects 1.8MPa saturated steam, utilizing latent heat for instant heating.",
    duration: 5000
  },
  {
    id: ProcessStep.LINKAGE,
    title: "Subcritical Hydrolysis",
    description: "Deep Hydrolysis | Bound Oil Release",
    details: "180°C subcritical state disrupts cells, releasing bound oil completely.",
    duration: 5000
  },
  {
    id: ProcessStep.FLASHING,
    title: "Flash Evaporation",
    description: "Flash Explosion | Energy Loop",
    details: "Pressure drop causes boiling; steam recycles for preheating (Energy Loop).",
    duration: 5000
  },
  {
    id: ProcessStep.FILTRATION,
    title: "3-Phase Separation",
    description: "Centrifugal Separation | Oil/Water/Solid",
    details: "3000G force separates: Industrial Oil, Liquid Fertilizer, Organic Fertilizer.",
    duration: 5000
  }
];