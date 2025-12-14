export enum CharacterId {
  TULIO = 'Tulio Triviño',
  BODOQUE = 'Juan Carlos Bodoque',
  JUANIN = 'Juanín Juan Harry',
  PATANA = 'Patana Tufillo',
  MARIO_HUGO = 'Mario Hugo',
  POLICARPO = 'Policarpo Avendaño',
  CALCETIN = 'Calcetín con Rombos Man'
}

export enum GameType {
  RECYCLING = 'Nota Verde: Reciclaje',
  MEMORY = 'Ranking Top Top Top: Memoria',
  MATH = 'Entrevista Matemática',
  VOWELS = 'Caza Vocales',
  REFLEX = 'La Ruta de la Caca',
  SIMON = 'Ranking Musical',
  HEALTHY = 'Misión Saludable',
  MAGIC_CAMERA = 'Cámara Mágica'
}

export interface Character {
  id: CharacterId;
  name: string;
  color: string;
  avatarUrl: string;
  catchphrase: string;
  voicePitch: number; // 0 to 2
  voiceRate: number;  // 0.1 to 10
  visualDescription: string; // For Gemini Image generation
}

export interface GameResult {
  score: number;
  maxScore: number;
  message: string;
}