
import { Character, CharacterId, GameType } from './types';

const imgProxy = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url.replace('https://', ''))}`;

export const NEWS_PHRASES = [
  "ÚLTIMA HORA: TULIO TRIVIÑO OLVIDA SUS LÍNEAS NUEVAMENTE",
  "LA NOTA VERDE: JUAN CARLOS BODOQUE ENCUENTRA UN BOSQUE DE PLÁSTICO",
  "RANKING TOP: ¡EL DINOSAURIO ANASTASIO SIGUE EN EL PUESTO #1!",
  "CALCETÍN CON ROMBOS MAN SALVA A UN PAR DE CALCETINES SIN ELÁSTICO",
  "ATENCIÓN: SE BUSCA A GUARIPOLO, EL PERSONAJE MÁS POPULAR",
  "PATANA DESMINTIÓ QUE TULIO SEA SU TÍO FAVORITO... ES BODOQUE",
  "POLICARPO AVENDAÑO PREPARA SU NUEVO TOP TOP TOP",
  "HUACHIMINGO ASEGURA HABER VISTO UN OVNI CON FORMA DE ALCACHOFA"
];

export const CHARACTERS: Character[] = [
  {
    id: CharacterId.TULIO,
    name: "Tulio Triviño",
    color: "bg-blue-600",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/e/e0/Tulio_T4.png"),
    catchphrase: "¡Bienvenidos al noticiero más importante!",
    voicePitch: 0.7,
    voiceRate: 0.9,
    visualDescription: "puppet with a grey head, brown suit, and red tie"
  },
  {
    id: CharacterId.BODOQUE,
    name: "Juan Carlos Bodoque",
    color: "bg-red-600",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/3/3d/Juan_Carlos_Bodoque_T4.png"),
    catchphrase: "Soy Juan Carlos Bodoque y este es mi juego.",
    voicePitch: 1.0,
    voiceRate: 0.8,
    visualDescription: "red rabbit puppet with long ears"
  },
  {
    id: CharacterId.JUANIN,
    name: "Juanín Juan Harry",
    color: "bg-white",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/1/14/Juan%C3%ADn_Juan_Harry_T4.png"),
    catchphrase: "¡Tulio, estamos al aire!",
    voicePitch: 1.8,
    voiceRate: 1.2,
    visualDescription: "white fluffy creature with orange ears"
  },
  {
    id: CharacterId.PATANA,
    name: "Patana Tufillo",
    color: "bg-green-500",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/3/30/Patana_Tufillo_T4.png"),
    catchphrase: "¡Tío Tulio, yo quiero jugar!",
    voicePitch: 1.2,
    voiceRate: 1.0,
    visualDescription: "green bird puppet with orange hair"
  },
  {
    id: CharacterId.POLICARPO,
    name: "Policarpo Avendaño",
    color: "bg-purple-600",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/3/3d/Policarpo_Avenda%C3%B1o_T4.png"),
    catchphrase: "¡Top Top Top!",
    voicePitch: 1.4,
    voiceRate: 1.3,
    visualDescription: "puppet with a mustache and a fancy wig"
  },
  {
    id: CharacterId.HUACHIMINGO,
    name: "Huachimingo",
    color: "bg-yellow-500",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/6/6f/Huachimingo_T4.png"),
    catchphrase: "¡Tengo una primicia!",
    voicePitch: 1.5,
    voiceRate: 1.1,
    visualDescription: "yellow spotted puppet with a long nose"
  },
  {
    id: CharacterId.CALCETIN,
    name: "Calcetín con Rombos Man",
    color: "bg-blue-400",
    avatarUrl: imgProxy("https://static.wikia.nocookie.net/31minutos/images/2/22/Calcet%C3%ADn_con_Rombos_Man_T4.png"),
    catchphrase: "¡Todo niño tiene derecho...!",
    voicePitch: 0.9,
    voiceRate: 1.0,
    visualDescription: "a sock puppet with diamond patterns wearing a cape"
  }
];

export const GAMES = [
  {
    id: GameType.MAGIC_CAMERA,
    title: "CÁMARA",
    description: "Filtros",
    icon: "📸",
    characterId: CharacterId.TULIO
  },
  {
    id: GameType.VEO_ANIMATION,
    title: "CINE",
    description: "Animación",
    icon: "🎬",
    characterId: CharacterId.JUANIN
  },
  {
    id: GameType.RECYCLING,
    title: "RECICLAJE",
    description: "Basura",
    icon: "♻️",
    characterId: CharacterId.BODOQUE
  },
  {
    id: GameType.MEMORY,
    title: "RANKING",
    description: "Memoria",
    icon: "🎹",
    characterId: CharacterId.POLICARPO
  },
  {
    id: GameType.VOWELS,
    title: "VOCALES",
    description: "Letras",
    icon: "🅰️",
    characterId: CharacterId.PATANA
  },
  {
    id: GameType.LOGIC_CLUE,
    title: "CULPABLE",
    description: "Deducción",
    icon: "🕵️‍♀️",
    characterId: CharacterId.PATANA
  },
  {
    id: GameType.SPATIAL_MAP,
    title: "EL MAPA",
    description: "Lógica",
    icon: "🗺️",
    characterId: CharacterId.HUACHIMINGO
  },
  {
    id: GameType.RIGHTS_LOGIC,
    title: "DERECHOS",
    description: "Cívica",
    icon: "🦸‍♂️",
    characterId: CharacterId.CALCETIN
  }
];
