export interface ReferenceItem {
  id: string;
  imageSrc: string;
}

export interface ModelReferences {
  modelId: string;
  modelName: string;
  items: ReferenceItem[];
}

export const REFERENCES_DATA: Record<string, ModelReferences> = {
  paris: {
    modelId: 'paris',
    modelName: 'Paris (Eiffel Tower)',
    items: [
      { id: '1', imageSrc: './references/eiffel-tower24k.jpg' },
      { id: '2', imageSrc: './references/eiffel-under.jpg' },
      { id: '3', imageSrc: './references/back-eiffel.png' },
      { id: '4', imageSrc: './references/eiffel-portrait-reference.png' },
      { id: '5', imageSrc: './references/left-right-eiffel.png' },
      { id: '6', imageSrc: './references/front-eiffel.png' },
    ],
  },
  sagrada: {
    modelId: 'sagrada',
    modelName: 'Sagrada Família',
    items: [
      { id: '1', imageSrc: './references/sagrada.png' },
    ],
  },
  jet: {
    modelId: 'jet',
    modelName: 'Fighter Jet (MiG-23 Flogger)',
    items: [
      { id: '1', imageSrc: './references/jet-reference.png' },
    ],
  },
  chair: {
    modelId: 'chair',
    modelName: 'Modern Red Armchair',
    items: [
      { id: '1', imageSrc: './references/referensi.png' },
    ],
  },
};
