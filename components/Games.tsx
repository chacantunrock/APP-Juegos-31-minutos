
import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import { playTone, speak } from '../services/audio';
import { editImageWithGemini } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface GameProps {
  type: GameType;
  onFinish: (score: number) => void;
  volume: number;
}

// --- Shared UI ---
interface GameContainerProps {
  children: React.ReactNode;
  title: string;
  instruction: string;
  level: number;
  maxLevels: number;
}

const GameContainer: React.FC<GameContainerProps> = ({ children, title, instruction, level, maxLevels }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (level === 1) {
         speak(instruction);
      } else {
         speak(`Nivel ${level}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [instruction, level]);

  return (
    <div className="flex flex-col items-center w-full h-full p-2 bg-white/90 rounded-3xl border-4 border-tv-orange shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center w-full px-4 pt-2 mb-2 border-b-2 border-dashed border-gray-300 pb-2">
         <h2 className="text-xl md:text-2xl font-black uppercase text-tv-orange truncate">{title}</h2>
         <div className="flex items-center gap-2">
            <span className="font-bold text-tv-black">Nivel {level}/{maxLevels}</span>
            <div className="flex gap-1">
                {[...Array(maxLevels)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < level ? 'bg-tv-orange' : 'bg-gray-300'}`} />
                ))}
            </div>
         </div>
      </div>
      <div className="w-full h-full flex flex-col items-center justify-center flex-1 relative overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};

// --- Rights Logic Game with Voice Input ---
const RightsLogicGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const pairs = [
    { icon: '🍎', text: 'ALIMENTACIÓN', match: ['alimentación', 'comida', 'comer'] },
    { icon: '🏥', text: 'SALUD', match: ['salud', 'médico', 'hospital'] },
    { icon: '📖', text: 'EDUCACIÓN', match: ['educación', 'escuela', 'estudiar'] }
  ];
  
  const [level, setLevel] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const current = pairs[level - 1];

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tu navegador no soporta voz. ¡Usa el botón!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
      playTone('click');
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript.toLowerCase();
      setTranscript(result);
      checkAnswer(result);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setError("No te escuché bien, ¡intenta de nuevo!");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const checkAnswer = (input: string) => {
    const isCorrect = current.match.some(m => input.includes(m));
    if (isCorrect) {
      playTone('correct');
      if (level < 3) {
        setTimeout(() => {
          setLevel(l => l + 1);
          setTranscript("");
        }, 1000);
      } else {
        setTimeout(() => onFinish(100), 1000);
      }
    } else {
      playTone('wrong');
      setError(`Dijiste "${input}". ¡Di "${current.text.toLowerCase()}"!`);
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Derechos" instruction="Di el nombre del derecho frente al micrófono">
      <div className="flex flex-col items-center gap-6">
        <div className="text-9xl mb-2 drop-shadow-lg">{current.icon}</div>
        <div className="bg-tv-blue text-white px-8 py-4 rounded-2xl font-black text-3xl border-4 border-black shadow-xl text-center">
          {current.text}
        </div>
        
        <div className="flex flex-col items-center gap-4 mt-4">
          <button 
            onMouseDown={startListening}
            className={`w-28 h-28 rounded-full border-[8px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all active:scale-90 active:shadow-none ${isListening ? 'bg-red-500 animate-pulse' : 'bg-tv-red'}`}
          >
            <span className="text-5xl text-white">🎤</span>
          </button>
          
          <p className="font-bold text-tv-black text-center max-w-[200px]">
            {isListening ? "¡Habla ahora!" : "Presiona para hablar"}
          </p>
          
          {transcript && (
            <p className="bg-gray-100 px-4 py-2 rounded-xl text-sm italic text-gray-600">
              Escuché: "{transcript}"
            </p>
          )}
          
          {error && (
            <p className="text-tv-red font-black uppercase text-xs animate-bounce text-center">
              {error}
            </p>
          )}

          {/* Botón de respaldo por si falla el reconocimiento en el ambiente del niño */}
          <button 
            onClick={() => checkAnswer(current.text.toLowerCase())}
            className="mt-2 text-[10px] text-gray-400 underline uppercase tracking-widest font-bold"
          >
            Omitir voz (Botón secreto)
          </button>
        </div>
      </div>
    </GameContainer>
  );
};

// --- Logic Clue Game with 3 Levels ---
const LogicClueGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const suspects = [
    { id: 1, icon: '🧔', traits: ['barba', 'gorro'] },
    { id: 2, icon: '👓', traits: ['lentes', 'calvo'] },
    { id: 3, icon: '🎀', traits: ['moño', 'pelo largo'] },
    { id: 4, icon: '🤡', traits: ['maquillaje', 'nariz roja'] }
  ];
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState(suspects[0]);
  const [clue, setClue] = useState("");

  useEffect(() => {
    const t = suspects[Math.floor(Math.random() * suspects.length)];
    setTarget(t);
    const trait = t.traits[Math.floor(Math.random() * t.traits.length)];
    setClue(`El culpable tiene ${trait}`);
  }, [level]);

  const handlePick = (s: any) => {
    if (s.id === target.id) {
      playTone('correct');
      if (level < 3) setLevel(l => l + 1); else onFinish(100);
    } else playTone('wrong');
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Culpable" instruction="Sigue la pista de Patana">
      <div className="bg-tv-black text-tv-yellow p-4 rounded-xl mb-6 font-black text-xl border-4 border-black shadow-lg">
        🕵️‍♀️ PISTA: {clue.toUpperCase()}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {suspects.map(s => (
          <button key={s.id} onClick={() => handlePick(s)} className="bg-white border-4 border-black p-6 rounded-2xl text-6xl shadow-xl hover:scale-110 active:scale-95 transition-all">
            {s.icon}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Spatial Map Game with 3 Levels ---
const SpatialMapGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [angles, setAngles] = useState([90, 180, 270, 0]);
  
  useEffect(() => {
    setAngles(angles.map(() => [90, 180, 270][Math.floor(Math.random() * 3)]));
  }, [level]);

  const rotate = (idx: number) => {
    playTone('click');
    const newAngles = [...angles];
    newAngles[idx] = (newAngles[idx] + 90) % 360;
    setAngles(newAngles);
    if (newAngles.every(a => a === 0)) {
      playTone('win');
      if (level < 3) {
        setTimeout(() => setLevel(l => l + 1), 500);
      } else {
        setTimeout(() => onFinish(100), 500);
      }
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="El Mapa" instruction="Gira las piezas para arreglar el mapa">
      <div className="grid grid-cols-2 gap-2 p-4 bg-tv-black border-4 border-black rounded-lg shadow-2xl">
        {angles.map((a, i) => (
          <button key={i} onClick={() => rotate(i)} style={{ transform: `rotate(${a}deg)` }} className="w-20 h-20 md:w-24 md:h-24 bg-tv-yellow flex items-center justify-center text-4xl border-2 border-black transition-transform duration-300">
            {i === 0 ? '🏔️' : i === 1 ? '🌊' : i === 2 ? '🌲' : '🏠'}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Recycle Game with 3 Levels ---
const RecycleGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [idx, setIdx] = useState(0);
  const levelsData = [
    [{ e: '🍏', t: 'o' }, { e: '🍌', t: 'o' }],
    [{ e: '🥫', t: 'r' }, { e: '🥛', t: 'r' }, { e: '🍕', t: 'o' }],
    [{ e: '📦', t: 'r' }, { e: '📰', t: 'r' }, { e: '🍔', t: 'o' }, { e: '🍗', t: 'o' }]
  ];

  const currentItems = levelsData[level - 1];
  const currentItem = currentItems[idx];

  const handleSort = (type: string) => {
    if (currentItem.t === type) {
      playTone('correct');
      if (idx < currentItems.length - 1) {
        setIdx(i => i + 1);
      } else {
        if (level < 3) {
          setLevel(l => l + 1);
          setIdx(0);
        } else {
          onFinish(100);
        }
      }
    } else playTone('wrong');
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Basura" instruction="Verde: Orgánico | Azul: Reciclable">
      <div className="text-8xl mb-8 animate-bounce">{currentItem.e}</div>
      <div className="flex gap-6">
        <button onClick={() => handleSort('o')} className="bg-green-500 w-28 h-28 rounded-3xl border-4 border-black text-5xl shadow-xl flex items-center justify-center">🍏</button>
        <button onClick={() => handleSort('r')} className="bg-blue-500 w-28 h-28 rounded-3xl border-4 border-black text-5xl shadow-xl flex items-center justify-center">♻️</button>
      </div>
    </GameContainer>
  );
};

// --- Memory Game with 3 Levels ---
const MemoryGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  const iconsPool = ['🎸', '🎹', '🥁', '🎺', '🎻', '🎷', '🎤', '📻'];

  useEffect(() => {
    const pairsCount = level + 1;
    const selectedIcons = iconsPool.slice(0, pairsCount);
    const newCards = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon }));
    setCards(newCards);
    setFlipped([]);
    setSolved([]);
  }, [level]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || solved.includes(id) || flipped.includes(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].icon === cards[newFlipped[1]].icon) {
        playTone('correct');
        const newSolved = [...solved, ...newFlipped];
        setSolved(newSolved);
        setFlipped([]);
        if (newSolved.length === cards.length) {
          if (level < 3) setTimeout(() => setLevel(l => l + 1), 800);
          else setTimeout(() => onFinish(100), 800);
        }
      } else {
        setTimeout(() => { playTone('wrong'); setFlipped([]); }, 800);
      }
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Memoria" instruction="¡Busca los pares!">
      <div className={`grid gap-2 ${level === 3 ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
        {cards.map(c => (
          <button key={c.id} onClick={() => handleFlip(c.id)} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl transition-all border-4 border-black shadow-lg ${flipped.includes(c.id) || solved.includes(c.id) ? 'bg-white' : 'bg-tv-orange text-white'}`}>
            {(flipped.includes(c.id) || solved.includes(c.id)) ? c.icon : '?'}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Vowel Game with 3 Levels ---
const VowelGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const vowels = ['A', 'E', 'I'];
  const cur = vowels[level - 1];
  const options = [{v:'A', e:'🍎'}, {v:'E', e:'🐘'}, {v:'I', e:'🏝️'}];
  
  return (
    <GameContainer level={level} maxLevels={3} title="Vocales" instruction={`Toca lo que empieza con ${cur}`}>
      <div className="text-9xl font-black text-tv-orange mb-6">{cur}</div>
      <div className="flex gap-4">
        {options.map(o => (
          <button key={o.v} onClick={() => { if (o.v === cur) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong'); }} 
            className="bg-white border-4 border-black p-6 rounded-3xl text-6xl shadow-xl">{o.e}</button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Special Games (Exempt from 3 levels as per request) ---
const MagicCameraGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [img, setImg] = useState<string | null>(null);
  const [proc, setProc] = useState(false);
  const vRef = useRef<HTMLVideoElement>(null);
  const cRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if (vRef.current) vRef.current.srcObject = s; }); }, []);
  const take = async () => {
    if (!vRef.current || !cRef.current) return;
    cRef.current.getContext('2d')?.drawImage(vRef.current, 0, 0, 400, 300);
    const data = cRef.current.toDataURL('image/jpeg'); setImg(data); setProc(true);
    const res = await editImageWithGemini(data, "Ponle una nariz de payaso estilo 31 Minutos");
    if (res) setImg(res); setProc(false); playTone('win');
  };
  return (
    <GameContainer level={1} maxLevels={1} title="Cámara" instruction="¡Foto de títere!">
      {!img ? (
        <div className="flex flex-col items-center gap-4">
          <video ref={vRef} autoPlay className="w-full max-w-[240px] border-4 border-black rounded-xl shadow-2xl" />
          <canvas ref={cRef} width="400" height="300" className="hidden" />
          <button onClick={take} className="bg-tv-yellow p-6 rounded-full border-4 border-black text-5xl shadow-2xl">📸</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img src={img} className="w-56 border-4 border-black rounded-xl shadow-2xl" />
          {proc ? <p className="font-black animate-pulse text-tv-orange">PROCESANDO...</p> : <button onClick={() => onFinish(100)} className="bg-green-500 p-6 rounded-full border-4 border-black text-5xl shadow-xl">✅</button>}
        </div>
      )}
    </GameContainer>
  );
};

const VeoAnimationGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        playTone('click');
        speak("¡Imagen cargada!");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;
    setIsGenerating(true);
    setStatus("Juanín preparando...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Hacer que la imagen cobre vida al estilo 31 minutos",
        image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoResponse.blob();
        setVideoUrl(URL.createObjectURL(blob));
        playTone('win');
      }
    } catch (error) { setStatus("Error..."); } finally { setIsGenerating(false); }
  };

  return (
    <GameContainer level={1} maxLevels={1} title="Cine" instruction="¡Anima tus fotos!">
      {!videoUrl ? (
        <div className="flex flex-col items-center gap-4 w-full">
          {!image ? (
            <button onClick={() => fileInputRef.current?.click()} className="bg-tv-yellow w-32 h-32 rounded-3xl text-6xl shadow-xl border-4 border-black">📷</button>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <img src={image} className="h-32 object-cover rounded-xl border-2 border-black" />
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="¿Qué pasa?" className="p-2 border-2 border-gray-300 rounded-lg text-sm" />
              <button onClick={generateVideo} disabled={isGenerating} className="bg-tv-orange text-white py-2 rounded-xl font-black">{isGenerating ? status : "🎬 ¡ANIMAR!"}</button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-2">
          <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg border-2 border-black shadow-2xl" />
          <button onClick={() => onFinish(100)} className="bg-tv-yellow px-6 py-2 rounded-xl font-bold uppercase mt-2 border-2 border-black">✅ Listo</button>
        </div>
      )}
    </GameContainer>
  );
};

export const ActiveGame: React.FC<GameProps> = ({ type, onFinish, volume }) => {
  switch (type) {
    case GameType.VEO_ANIMATION: return <VeoAnimationGame onFinish={onFinish} />;
    case GameType.RECYCLING: return <RecycleGame onFinish={onFinish} />;
    case GameType.MEMORY: return <MemoryGame onFinish={onFinish} />;
    case GameType.VOWELS: return <VowelGame onFinish={onFinish} />;
    case GameType.MAGIC_CAMERA: return <MagicCameraGame onFinish={onFinish} />;
    case GameType.LOGIC_CLUE: return <LogicClueGame onFinish={onFinish} />;
    case GameType.SPATIAL_MAP: return <SpatialMapGame onFinish={onFinish} />;
    case GameType.RIGHTS_LOGIC: return <RightsLogicGame onFinish={onFinish} />;
    default: return <div className="p-10 font-black text-center text-tv-orange">¡PRONTO!</div>;
  }
};
