
export enum CharacterId {
  TULIO = 'Tulio Triviño',
  BODOQUE = 'Juan Carlos Bodoque',
  JUANIN = 'Juanín Juan Harry',
  PATANA = 'Patana Tufillo',
  MARIO_HUGO = 'Mario Hugo',
  POLICARPO = 'Policarpo Avendaño',
  CALCETIN = 'Calcetín con Rombos Man',
  DANTE = 'Dante Torobolino',
  MICO = 'Mico el Micófono',
  GUARIPOLO = 'Guaripolo',
  HUACHIMINGO = 'Huachimingo',
  JOE_PINO = 'Joe Pino',
  BOMBI = 'Bombi',
  TENISON = 'Tenison Salinas'
}

export enum GameType {
  RECYCLING = 'Nota Verde: Reciclaje',
  MEMORY = 'Ranking Top Top Top: Memoria',
  MATH = 'Entrevista Matemática',
  VOWELS = 'Caza Vocales',
  REFLEX = 'La Ruta de la Caca',
  SIMON = 'Ranking Musical',
  HEALTHY = 'Misión Saludable',
  MAGIC_CAMERA = 'Cámara Mágica',
  COUNTDOWN = 'Dante: ¡Explosión!',
  SOUNDS = 'Mico: La Entrevista',
  HIDDEN_OBJ = 'Guaripolo: El Favorito',
  COLORS = 'Huachimingo: El Museo',
  RHYMES = 'Rimas de Joe Pino',
  SHAPES = 'Bombi: Las Formas',
  PUZZLES = 'Tenison: Rompecabezas',
  VEO_ANIMATION = 'Cine Mágico',
  LOGIC_CLUE = 'Patana: El Culpable',
  SPATIAL_MAP = 'Huachimingo: El Mapa',
  RIGHTS_LOGIC = 'Calcetín: Derechos'
}

export interface Character {
  id: CharacterId;
  name: string;
  color: string;
  avatarUrl: string;
  catchphrase: string;
  voicePitch: number;
  voiceRate: number;
  visualDescription: string;
}

export interface GameResult {
  score: number;
  maxScore: number;
  message: string;
}
