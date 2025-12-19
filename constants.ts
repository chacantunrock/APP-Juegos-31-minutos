import { Character, CharacterId, GameType } from './types';

// Usamos imágenes directas que capturan la esencia de los títeres proporcionados
export const CHARACTERS: Character[] = [
  {
    id: CharacterId.TULIO,
    name: "Tulio",
    color: "bg-red-600",
    avatarUrl: "https://file-service.M5-mz86d6.workers.dev/files/17411993439906478988640700147915.png",
    catchphrase: "¡Yo opino...!",
    voicePitch: 0.8,
    voiceRate: 0.9,
    visualDescription: "a grey sock puppet wearing a formal brown suit and red tie, button eyes"
  },
  {
    id: CharacterId.BODOQUE,
    name: "Bodoque",
    color: "bg-red-700",
    avatarUrl: "https://file-service.M5-mz86d6.workers.dev/files/17411993172081702898953185566063.png",
    catchphrase: "¡Nota verde!",
    voicePitch: 1.0,
    voiceRate: 1.0,
    visualDescription: "a red rabbit puppet with long ears and a striped shirt"
  },
  {
    id: CharacterId.JUANIN,
    name: "Juanín",
    color: "bg-white text-black",
    avatarUrl: "https://file-service.M5-mz86d6.workers.dev/files/1741199324021798319692484558223.png",
    catchphrase: "¡Tulio, estamos al aire!",
    voicePitch: 1.6,
    voiceRate: 1.1,
    visualDescription: "a white fluffy creature with orange headphones and a brown vest"
  },
  {
    id: CharacterId.PATANA,
    name: "Patana",
    color: "bg-green-500",
    avatarUrl: "https://file-service.M5-mz86d6.workers.dev/files/17411993309997103767468307682227.png",
    catchphrase: "¡Tío Tulio!",
    voicePitch: 1.2,
    voiceRate: 1.0,
    visualDescription: "a green bird puppet with orange hair and a pink puffer vest"
  },
  {
    id: CharacterId.MARIO_HUGO,
    name: "Mario Hugo",
    color: "bg-yellow-600",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/5/5e/Mario_Hugo_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Hermoso y desconocido!",
    voicePitch: 0.9,
    voiceRate: 0.8,
    visualDescription: "a brown chihuahua dog puppet, reporter style"
  },
  {
    id: CharacterId.POLICARPO,
    name: "Policarpo",
    color: "bg-purple-600",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/3/3d/Policarpo_Avenda%C3%B1o_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Top Top Top!",
    voicePitch: 1.4,
    voiceRate: 1.3,
    visualDescription: "a puppet with a mustache and a fancy wig"
  },
  {
    id: CharacterId.CALCETIN,
    name: "Calcetín Man",
    color: "bg-blue-600",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/5/52/Calcet%C3%ADn_con_Rombos_Man_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Todo es muy sencillo!",
    voicePitch: 1.1,
    voiceRate: 0.9,
    visualDescription: "a sock puppet superhero with diamond patterns"
  },
  {
    id: CharacterId.DANTE,
    name: "Dante Torobolino",
    color: "bg-gray-400",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/1/14/Dante_Torobolino_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Explosión!",
    voicePitch: 0.7,
    voiceRate: 1.2,
    visualDescription: "a fluffy white character with crazy hair"
  },
  {
    id: CharacterId.MICO,
    name: "Mico el Micófono",
    color: "bg-green-700",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/0/07/Mico_el_Mic%C3%B3fono_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Silencio en el set!",
    voicePitch: 1.0,
    voiceRate: 1.0,
    visualDescription: "a green living microphone puppet"
  },
  {
    id: CharacterId.GUARIPOLO,
    name: "Guaripolo",
    color: "bg-orange-500",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/e/e0/Guaripolo_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Soy el personaje más popular!",
    voicePitch: 1.2,
    voiceRate: 1.1,
    visualDescription: "an orange fluffy creature with a long nose"
  },
  {
    id: CharacterId.HUACHIMINGO,
    name: "Huachimingo",
    color: "bg-blue-300",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/a/a2/Huachimingo_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Es un dato real!",
    voicePitch: 0.9,
    voiceRate: 0.9,
    visualDescription: "a blue creature with yellow spots"
  },
  {
    id: CharacterId.JOE_PINO,
    name: "Joe Pino",
    color: "bg-pink-500",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/d/da/Joe_Pino_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Yo opino que esto es genial!",
    voicePitch: 1.5,
    voiceRate: 1.3,
    visualDescription: "a red character with thin arms"
  },
  {
    id: CharacterId.BOMBI,
    name: "Bombi",
    color: "bg-indigo-700",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/7/75/Bombi_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡Bombi!",
    voicePitch: 0.5,
    voiceRate: 0.7,
    visualDescription: "a zombie puppet character"
  },
  {
    id: CharacterId.TENISON,
    name: "Tenison Salinas",
    color: "bg-yellow-400",
    avatarUrl: "https://static.wikia.nocookie.net/31minutos/images/7/71/Tenison_Salinas_T4.png/revision/latest/scale-to-width-down/300",
    catchphrase: "¡El deporte es vida!",
    voicePitch: 1.1,
    voiceRate: 1.1,
    visualDescription: "a athletic puppet with a headband"
  }
];

export const GAMES = [
  {
    id: GameType.KARAOKE,
    title: "Karaoke Top",
    description: "¡Canta con Policarpo!",
    icon: "🎤",
    characterId: CharacterId.POLICARPO
  },
  {
    id: GameType.VEO_ANIMATION,
    title: "Cine Mágico",
    description: "¡Anima tus fotos!",
    icon: "🎬",
    characterId: CharacterId.JUANIN
  },
  {
    id: GameType.MAGIC_CAMERA,
    title: "Cámara Mágica",
    description: "¡Transfórmate!",
    icon: "✨",
    characterId: CharacterId.TULIO
  },
  {
    id: GameType.RECYCLING,
    title: "Basura",
    description: "Pon la basura en su lugar",
    icon: "♻️",
    characterId: CharacterId.BODOQUE
  },
  {
    id: GameType.MEMORY,
    title: "Memoria",
    description: "Busca los pares",
    icon: "🎵",
    characterId: CharacterId.POLICARPO
  },
  {
    id: GameType.MATH,
    title: "Números",
    description: "Suma y resta",
    icon: "🧮",
    characterId: CharacterId.JUANIN
  },
  {
    id: GameType.VOWELS,
    title: "Vocales",
    description: "¿Con qué letra empieza?",
    icon: "🅰️",
    characterId: CharacterId.PATANA
  },
  {
    id: GameType.REFLEX,
    title: "Fotos",
    description: "Atrapa la photo",
    icon: "📸",
    characterId: CharacterId.MARIO_HUGO
  },
  {
    id: GameType.SIMON,
    title: "Música",
    description: "Repite los sonidos",
    icon: "🎹",
    characterId: CharacterId.CALCETIN
  },
  {
    id: GameType.HEALTHY,
    title: "Vida Sana",
    description: "Elige lo saludable",
    icon: "🦸",
    characterId: CharacterId.CALCETIN
  },
  {
    id: GameType.COUNTDOWN,
    title: "Explosión",
    description: "Cuenta hacia atrás",
    icon: "💣",
    characterId: CharacterId.DANTE
  },
  {
    id: GameType.SOUNDS,
    title: "Sonidos",
    description: "¿Qué escuchas?",
    icon: "👂",
    characterId: CharacterId.MICO
  },
  {
    id: GameType.HIDDEN_OBJ,
    title: "Favorito",
    description: "¿Dónde está Guaripolo?",
    icon: "🔍",
    characterId: CharacterId.GUARIPOLO
  },
  {
    id: GameType.COLORS,
    title: "El Museo",
    description: "Ordena por colores",
    icon: "🎨",
    characterId: CharacterId.HUACHIMINGO
  },
  {
    id: GameType.RHYMES,
    title: "Rimas",
    description: "¿Qué rima con...?",
    icon: "🎙️",
    characterId: CharacterId.JOE_PINO
  },
  {
    id: GameType.SHAPES,
    title: "Formas",
    description: "Reconoce las figuras",
    icon: "🟦",
    characterId: CharacterId.BOMBI
  },
  {
    id: GameType.PUZZLES,
    title: "Puzzles",
    description: "Arma la imagen",
    icon: "🧩",
    characterId: CharacterId.TENISON
  }
];