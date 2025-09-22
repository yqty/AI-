export interface ViralScript {
  id: number;
  title: string;
  fiveActStructure: string;
  modeAndMethod: string;
  scriptOutline: string;
}

export interface AnalyzedTopic {
  id: string;
  category: string;
  text: string;
}

export interface CustomPrompt {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}
