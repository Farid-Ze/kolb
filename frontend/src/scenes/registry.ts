export enum RoomStage {
  Intro = 'Intro',
  ConcreteExperience = 'Concrete Experience',
  ReflectiveObservation = 'Reflective Observation',
  AbstractConceptualization = 'Abstract Conceptualization',
  ActiveExperimentation = 'Active Experimentation',
}

export interface RoomDefinition {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  stage: RoomStage;
  description?: string;
  accentColor?: string;
  backgroundClassName?: string;
}

export const ROOM_REGISTRY: RoomDefinition[] = [
  {
    id: 'intro-room',
    index: 0,
    title: 'Welcome',
    subtitle: 'Begin your journey',
    stage: RoomStage.Intro,
    description: 'An introduction to the Kolb Learning Style Inventory.',
    accentColor: '#3b82f6', // blue-500
    backgroundClassName: 'bg-gradient-to-br from-slate-900 to-slate-800',
  },
  {
    id: 'concrete-experience-room',
    index: 1,
    title: 'Feeling',
    subtitle: 'Concrete Experience',
    stage: RoomStage.ConcreteExperience,
    description: 'Engage with your immediate experiences and feelings.',
    accentColor: '#10b981', // emerald-500
    backgroundClassName: 'bg-gradient-to-br from-emerald-900 to-teal-800',
  },
  {
    id: 'reflective-observation-room',
    index: 2,
    title: 'Watching',
    subtitle: 'Reflective Observation',
    stage: RoomStage.ReflectiveObservation,
    description: 'Observe and reflect on your experiences from different perspectives.',
    accentColor: '#8b5cf6', // violet-500
    backgroundClassName: 'bg-gradient-to-br from-violet-900 to-purple-800',
  },
  {
    id: 'abstract-conceptualization-room',
    index: 3,
    title: 'Thinking',
    subtitle: 'Abstract Conceptualization',
    stage: RoomStage.AbstractConceptualization,
    description: 'Analyze ideas and form logical theories.',
    accentColor: '#3b82f6', // blue-500
    backgroundClassName: 'bg-gradient-to-br from-blue-900 to-indigo-800',
  },
  {
    id: 'active-experimentation-room',
    index: 4,
    title: 'Doing',
    subtitle: 'Active Experimentation',
    stage: RoomStage.ActiveExperimentation,
    description: 'Test theories and apply learning in practical situations.',
    accentColor: '#f59e0b', // amber-500
    backgroundClassName: 'bg-gradient-to-br from-amber-900 to-orange-800',
  },
];
