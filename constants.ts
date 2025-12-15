import { Character, CharacterId, GameType } from './types';

// Using weserv.nl proxy to bypass Wikia hotlinking protection and resize images
// Added quality adjustment and output format
const getProxyUrl = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=400&fit=cover&output=png&q=80`;

export const CHARACTERS: Character[] = [
  {
    id: CharacterId.TULIO,
    name: "Tulio",
    color: "bg-red-600",
    // Updated with user provided image
    avatarUrl: "https://file-service.M5-mz86d6.workers.dev/files/17411985923166804561021484196885.png",
    catchphrase: "¡Yo opino...!",
    voicePitch: 0.8,
    voiceRate: 0.9,
    visualDescription: "a gray chimpanzee puppet wearing a formal suit and red tie"
  },
  {
    id: CharacterId.BODOQUE,
    name: "Bodoque",
    color: "bg-red-700",
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/2/23/Juan_Carlos_Bodoque_T4.png/revision/latest"),
    catchphrase: "¡Nota verde!",
    voicePitch: 1.0,
    voiceRate: 1.0,
    visualDescription: "a red rabbit puppet with long ears, wearing a striped shirt"
  },
  {
    id: CharacterId.JUANIN,
    name: "Juanín",
    color: "bg-white text-black",
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/9/98/Juan%C3%ADn_Juan_Harry_T4.png/revision/latest"),
    catchphrase: "¡Tulio, estamos al aire!",
    voicePitch: 1.6,
    voiceRate: 1.1,
    visualDescription: "a white fluffy creature puppet with big eyes and thin arms"
  },
  {
    id: CharacterId.PATANA,
    name: "Patana",
    color: "bg-green-500",
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/a/a2/Patana_Tufillo_T4.png/revision/latest"),
    catchphrase: "¡Tío Tulio!",
    voicePitch: 1.2,
    voiceRate: 1.0,
    visualDescription: "a green bird girl puppet with a beak, wearing a dress and glasses"
  },
  {
    id: CharacterId.MARIO_HUGO,
    name: "Mario Hugo",
    color: "bg-yellow-600",
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/5/5e/Mario_Hugo_T4.png/revision/latest"),
    catchphrase: "¡Hermoso y desconocido!",
    voicePitch: 0.9,
    voiceRate: 0.8,
    visualDescription: "a brown chihuahua dog puppet, reporter style"
  },
  {
    id: CharacterId.POLICARPO,
    name: "Policarpo",
    color: "bg-purple-600",
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/3/3d/Policarpo_Avenda%C3%B1o_T4.png/revision/latest"),
    catchphrase: "¡Top Top Top!",
    voicePitch: 1.4,
    voiceRate: 1.3,
    visualDescription: "a puppet with a mustache and a fancy wig"
  },
  {
    id: CharacterId.CALCETIN,
    name: "Calcetín Man",
    color: "bg-blue-600",
    // Updated to the T4 version (with goggles/lentes)
    avatarUrl: getProxyUrl("https://static.wikia.nocookie.net/31minutos/images/5/52/Calcet%C3%ADn_con_Rombos_Man_T4.png/revision/latest"),
    catchphrase: "¡Todo es muy sencillo!",
    voicePitch: 1.1,
    voiceRate: 0.9,
    visualDescription: "a sock puppet superhero with diamond patterns and a cape"
  }
];

export const GAMES = [
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
    description: "Atrapa la foto",
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
  }
];