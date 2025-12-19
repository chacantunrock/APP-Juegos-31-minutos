
import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import { playTone, speak } from '../services/audio';
import { editImageWithGemini } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface GameProps {
  type: GameType;
  onFinish: (score: number) => void;
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
      <div className="w-full h-full flex flex-col items-center justify-center flex-1 relative overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

interface IconButtonProps {
  onClick: () => void;
  emoji: string;
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, emoji, color, label, size = 'lg' }) => {
    const sizeClasses = size === 'sm' ? 'w-20 h-20 text-4xl' : size === 'md' ? 'w-28 h-28 text-5xl' : 'w-32 h-32 md:w-40 md:h-40 text-6xl md:text-7xl';
    
    return (
      <button
        onClick={() => {
          playTone('click');
          onClick();
        }}
        className={`${color} ${sizeClasses} rounded-3xl flex flex-col items-center justify-center shadow-[0_8px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all border-4 border-white ring-4 ring-black/10`}
      >
        <span className="drop-shadow-md">{emoji}</span>
        {label && <span className="sr-only">{label}</span>}
      </button>
    );
};

// --- Karaoke Game ---
const songs = [
  {
    title: "Lala",
    lyrics: ["Lala lala lala", "Lala lala lala", "Lala lala lala", "Lala lala lala"],
    tempo: 1200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Placeholder rítmico
  },
  {
    title: "Mi Muñeca me Habló",
    lyrics: ["Mi muñeca me habló", "Me dijo cosas", "Que no puedo repetir", "Secretos de amor"],
    tempo: 2200,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" // Placeholder rítmico
  },
  {
    title: "Baila sin Cesar",
    lyrics: ["Baila baila baila", "Sin cesar", "Baila baila baila", "Hasta cansar"],
    tempo: 1400,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" // Placeholder rítmico
  }
];

const KaraokeGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [volumes, setVolumes] = useState<number[]>(new Array(10).fill(0));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = songs[level - 1];

  useEffect(() => {
    startMic();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicActive(average > 10);
        setVolumes(prev => [...prev.slice(1), average / 2]);
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.error("No se pudo acceder al micrófono", err);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentLine(prev => {
          if (prev >= currentSong.lyrics.length - 1) {
            clearInterval(timer);
            setTimeout(() => {
              setIsPlaying(false);
              if (audioRef.current) audioRef.current.pause();
              finishLevel();
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, currentSong.tempo);
      return () => clearInterval(timer);
    }
  }, [isPlaying, level]);

  const finishLevel = () => {
    playTone('win');
    if (level < 3) {
      setTimeout(() => {
        setLevel(l => l + 1);
        setCurrentLine(0);
      }, 2000);
    } else {
      setTimeout(() => onFinish(100), 2000);
    }
  };

  const startSinging = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentSong.audioUrl);
      audioRef.current.volume = 0.4;
    } else {
      audioRef.current.src = currentSong.audioUrl;
    }

    audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    setIsPlaying(true);
    setCurrentLine(0);
    playTone('click');
    speak(`¡Canta conmigo ${currentSong.title}!`);
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Karaoke Top" instruction="¡Canta fuerte frente al micrófono!">
      <div className="flex flex-col items-center gap-6 w-full h-full p-4 justify-between">
        {/* Visualizador de Voz */}
        <div className="flex items-end gap-1 h-20 w-full justify-center">
          {volumes.map((v, i) => (
            <div 
              key={i} 
              className={`w-4 bg-purple-500 rounded-t-lg transition-all duration-75 ${micActive ? 'opacity-100' : 'opacity-30'}`}
              style={{ height: `${Math.max(10, v)}%` }}
            />
          ))}
          <div className="text-4xl ml-2">{micActive ? '🎤' : '😶'}</div>
        </div>

        {/* Pantalla de Letras */}
        <div className="flex-1 w-full flex flex-col items-center justify-center bg-tv-black rounded-3xl border-8 border-tv-orange p-6 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,_#ffffff_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
          
          {!isPlaying ? (
            <div className="text-center z-10">
              <h3 className="text-tv-yellow text-4xl font-black mb-4 uppercase">{currentSong.title}</h3>
              <IconButton onClick={startSinging} emoji="▶️" color="bg-tv-yellow" size="lg" />
              <p className="mt-4 text-white font-bold animate-pulse">Toca para empezar la música</p>
            </div>
          ) : (
            <div className="text-center z-10 animate-fade-in">
               {currentSong.lyrics.map((line, i) => (
                 <p 
                   key={i} 
                   className={`text-3xl md:text-5xl font-black uppercase transition-all duration-500 ${
                     i === currentLine ? 'text-tv-yellow scale-110 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'text-gray-700 scale-90 opacity-40'
                   }`}
                 >
                   {line}
                 </p>
               ))}
            </div>
          )}
        </div>

        <div className="text-purple-700 font-bold uppercase tracking-widest text-sm italic bg-purple-100 px-4 py-1 rounded-full border border-purple-200">
          {isPlaying ? "🎶 ¡TE ESCUCHO EXCELENTE! 🎶" : "¡Policarpo está esperando su ranking!"}
        </div>
      </div>
    </GameContainer>
  );
};

// --- Veo Animation Game ---
const VeoAnimationGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
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
        speak("¡Imagen cargada! Ahora dime qué quieres que pase.");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;
    setIsGenerating(true);
    setStatus("Juanín está preparando las cámaras...");
    try {
      // @ts-ignore
      if (!(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Hacer que la imagen cobre vida al estilo 31 minutos",
        image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
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
    } catch (error) {
      console.error(error);
      setStatus("Error en la transmisión...");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GameContainer level={1} maxLevels={1} title="Cine Mágico" instruction="¡Anima tus fotos!">
      {!videoUrl ? (
        <div className="flex flex-col items-center gap-4 w-full px-4">
          {!image ? (
            <IconButton onClick={() => fileInputRef.current?.click()} emoji="📷" color="bg-tv-yellow" label="Subir foto" />
          ) : (
            <div className="w-full max-w-xs flex flex-col gap-3">
              <div className="relative">
                <img src={image} className="rounded-2xl border-4 border-tv-orange shadow-lg" alt="Preview" />
                <button onClick={() => setImage(null)} className="absolute -top-3 -right-3 bg-red-600 text-white w-8 h-8 rounded-full border-2 border-white font-bold">X</button>
              </div>
              <textarea 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                placeholder="¿Qué debe pasar en el video?" 
                className="p-3 border-2 border-gray-200 rounded-xl focus:border-tv-orange outline-none font-bold"
              />
              <button 
                onClick={generateVideo} 
                disabled={isGenerating} 
                className="bg-tv-orange text-white py-3 rounded-2xl font-black uppercase shadow-lg active:translate-y-1 transition-all"
              >
                {isGenerating ? status : "🎬 ¡ANIMAR!"}
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 px-4">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-tv-orange bg-black shadow-2xl">
            <video src={videoUrl} controls autoPlay loop className="w-full" />
          </div>
          <div className="flex gap-4 w-full max-w-sm">
             <button onClick={() => setVideoUrl(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold uppercase">🔄 Otro</button>
             <button onClick={() => onFinish(100)} className="flex-1 bg-tv-yellow py-3 rounded-xl font-bold uppercase">✅ Listo</button>
          </div>
        </div>
      )}
    </GameContainer>
  );
};

// --- Math Game ---
const MathGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState({ a: 0, b: 0, ans: 0 });
  const [options, setOptions] = useState<number[]>([]);
  useEffect(() => {
    const a = Math.floor(Math.random() * (level * 3)) + 1;
    const b = Math.floor(Math.random() * (level * 3)) + 1;
    const ans = a + b;
    setProblem({ a, b, ans });
    setOptions([ans, ans + 1, Math.max(0, ans - 1), ans + 2].sort(() => Math.random() - 0.5));
  }, [level]);
  const handleChoice = (v: number) => {
    if (v === problem.ans) {
      playTone('correct');
      if (level < 3) setLevel(l => l + 1); else onFinish(100);
    } else playTone('wrong');
  };
  return (
    <GameContainer level={level} maxLevels={3} title="Números" instruction="¡Suma los puntos!">
      <div className="text-6xl font-black mb-8 p-6 bg-white rounded-3xl border-4 border-dashed border-gray-200">{problem.a} + {problem.b} = ?</div>
      <div className="grid grid-cols-2 gap-4">
        {options.map(o => <button key={o} onClick={() => handleChoice(o)} className="bg-tv-yellow p-6 rounded-3xl text-4xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all border-b-4 border-yellow-600">{o}</button>)}
      </div>
    </GameContainer>
  );
};

// --- Vowel Game ---
const VowelGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const currentVowel = vowels[level - 1];
  const words = { 'A': ['🍎', '🚗', '🐝'], 'E': ['🐘', '⭐', '🪜'], 'I': ['🏝️', '⛪', '🦎'], 'O': ['🐻', '👁️', '🐑'], 'U': ['🍇', '🦄', '💅'] };
  const others = ['🐱', '🐶', '🍕', '⚽', '🎸'];
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    // @ts-ignore
    const correct = words[currentVowel][Math.floor(Math.random() * 3)];
    const shuffled = [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  }, [level]);
  return (
    <GameContainer level={level} maxLevels={5} title="Vocales" instruction={`Toca lo que empieza con ${currentVowel}`}>
      <div className="text-9xl font-black mb-8 text-tv-orange drop-shadow-lg">{currentVowel}</div>
      <div className="grid grid-cols-2 gap-6">
        {options.map(o => <button key={o} onClick={() => {
          // @ts-ignore
          if (words[currentVowel].includes(o)) { playTone('correct'); if (level < 5) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong');
        }} className="bg-white border-4 border-tv-orange p-6 rounded-3xl text-7xl shadow-xl hover:bg-orange-50 active:scale-90 transition-all">{o}</button>)}
      </div>
    </GameContainer>
  );
};

// --- Reflex Game ---
const ReflexGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [pos, setPos] = useState({ top: '50%', left: '50%' });
  const [score, setScore] = useState(0);
  const move = () => {
    setPos({ top: `${Math.random() * 70 + 10}%`, left: `${Math.random() * 70 + 10}%` });
  };
  useEffect(() => { if (score < 5) move(); }, [score]);
  return (
    <GameContainer level={score + 1} maxLevels={5} title="Fotos" instruction="¡Atrapa a los perros de Mario Hugo!">
      <div className="w-full h-full relative overflow-hidden bg-green-50 rounded-2xl">
        <button onClick={() => { playTone('correct'); if (score < 4) setScore(s => s + 1); else onFinish(100); }} 
          className="absolute text-8xl transition-all duration-300 transform hover:scale-125 cursor-pointer" style={pos}>🐶</button>
      </div>
    </GameContainer>
  );
};

// --- Memory Game ---
const MemoryGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const icons = ['🎸', '🎹', '🥁', '🎺', '🎻', '🎤'];
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  useEffect(() => {
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5).map((icon, id) => ({ id, icon }));
    setCards(deck);
  }, []);
  const handleFlip = (id: number) => {
    if (flipped.length === 2 || solved.includes(id) || flipped.includes(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].icon === cards[newFlipped[1]].icon) {
        playTone('correct');
        const nextSolved = [...solved, ...newFlipped];
        setSolved(nextSolved);
        setFlipped([]);
        if (nextSolved.length === cards.length) setTimeout(() => onFinish(100), 1000);
      } else {
        setTimeout(() => { playTone('wrong'); setFlipped([]); }, 1000);
      }
    }
  };
  return (
    <GameContainer level={solved.length / 2} maxLevels={6} title="Memoria" instruction="¡Encuentra los pares!">
      <div className="grid grid-cols-4 gap-3 p-4">
        {cards.map(c => (
          <button key={c.id} onClick={() => handleFlip(c.id)} 
            className={`w-16 h-20 md:w-24 md:h-32 rounded-2xl text-4xl flex items-center justify-center transition-all duration-500 transform ${flipped.includes(c.id) || solved.includes(c.id) ? 'bg-white border-4 border-tv-orange rotate-y-180' : 'bg-tv-orange text-white shadow-lg rotate-0'}`}>
            {(flipped.includes(c.id) || solved.includes(c.id)) ? c.icon : '❔'}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Simon Game ---
const SimonGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const [seq, setSeq] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const playSeq = (s: number[]) => {
    s.forEach((c, i) => setTimeout(() => { setActive(c); setTimeout(() => setActive(null), 500); }, (i + 1) * 800));
  };
  useEffect(() => { const newSeq = [Math.floor(Math.random() * 4)]; setSeq(newSeq); playSeq(newSeq); }, []);
  const handleColor = (idx: number) => {
    const nextUserSeq = [...userSeq, idx];
    setUserSeq(nextUserSeq);
    if (seq[userSeq.length] !== idx) { playTone('wrong'); setUserSeq([]); playSeq(seq); return; }
    playTone('click');
    if (nextUserSeq.length === seq.length) {
      playTone('correct');
      if (seq.length < 4) {
        const nextSeq = [...seq, Math.floor(Math.random() * 4)];
        setSeq(nextSeq);
        setUserSeq([]);
        setTimeout(() => playSeq(nextSeq), 1000);
      } else onFinish(100);
    }
  };
  return (
    <GameContainer level={seq.length} maxLevels={4} title="Música" instruction="¡Repite el ritmo!">
      <div className="grid grid-cols-2 gap-6">
        {colors.map((c, i) => (
          <button 
            key={i} 
            onClick={() => handleColor(i)} 
            className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl border-8 border-black shadow-xl transition-all duration-300 ${c} ${active === i ? 'brightness-150 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.8)]' : 'brightness-75'}`} 
          />
        ))}
      </div>
    </GameContainer>
  );
};

// --- Healthy Game ---
const HealthyGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const options = [{ emoji: '🍎', good: true }, { emoji: '🍩', good: false }, { emoji: '🥦', good: true }, { emoji: '🍔', good: false }, { emoji: '🍌', good: true }, { emoji: '🍭', good: false }];
  const [current, setCurrent] = useState<any[]>([]);
  useEffect(() => { setCurrent(options.sort(() => Math.random() - 0.5).slice(0, 2)); }, [level]);
  return (
    <GameContainer level={level} maxLevels={3} title="Vida Sana" instruction="¡Elige la comida saludable!">
      <div className="flex gap-12">
        {current.map((o, i) => (
          <button key={i} onClick={() => {
            if (o.good) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong');
          }} className="bg-white p-10 rounded-[3rem] text-8xl shadow-2xl border-4 border-tv-orange hover:scale-110 active:scale-90 transition-all">
            {o.emoji}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Magic Camera Game ---
const MagicCameraGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if (videoRef.current) videoRef.current.srcObject = s; });
  }, []);
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0, 400, 300);
    const data = canvasRef.current.toDataURL('image/jpeg');
    setImage(data); setIsProcessing(true);
    const result = await editImageWithGemini(data, "Ponle una nariz de payaso y orejas de conejo como un títere de 31 Minutos");
    if (result) setImage(result); setIsProcessing(false); playTone('win');
  };
  return (
    <GameContainer level={1} maxLevels={1} title="Cámara Mágica" instruction="¡Tómate una foto divertida!">
      {!image ? (
        <div className="flex flex-col items-center gap-6">
          <div className="relative border-8 border-tv-black rounded-[2rem] overflow-hidden bg-black shadow-2xl">
            <video ref={videoRef} autoPlay className="w-full max-w-sm aspect-video object-cover" />
          </div>
          <canvas ref={canvasRef} width="400" height="300" className="hidden" />
          <IconButton onClick={takePhoto} emoji="📸" color="bg-tv-yellow" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative border-8 border-tv-orange rounded-[2rem] overflow-hidden bg-black shadow-2xl">
            <img src={image} className="w-full max-w-sm" alt="Magic" />
          </div>
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 border-8 border-tv-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-tv-orange text-2xl uppercase tracking-widest">¡MAGIA EN PROCESO!</p>
            </div>
          ) : (
            <IconButton onClick={() => onFinish(100)} emoji="✅" color="bg-green-500" />
          )}
        </div>
      )}
    </GameContainer>
  );
};

// --- Countdown Game ---
const CountdownGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [target, setTarget] = useState(5);
  return (
    <GameContainer level={6 - target} maxLevels={5} title="Explosión" instruction="¡Cuenta hacia atrás!">
      <div className="text-center flex flex-col items-center gap-8">
        <div className="text-9xl font-black text-red-600 animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.4)]">{target}</div>
        <button 
          onClick={() => { playTone('click'); if (target > 1) setTarget(t => t - 1); else { playTone('win'); onFinish(100); } }} 
          className="bg-tv-black text-white px-16 py-8 rounded-[2rem] text-4xl font-black border-b-8 border-gray-700 hover:scale-105 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
        >
          ¡BOMBA! 💣
        </button>
      </div>
    </GameContainer>
  );
};

// --- Sounds Game ---
const SoundsGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const types = ['click', 'correct', 'wrong'] as const;
  const current = types[level - 1];
  return (
    <GameContainer level={level} maxLevels={3} title="Sonidos" instruction="¡Adivina el sonido!">
      <div className="flex flex-col items-center gap-12">
        <IconButton onClick={() => playTone(current)} emoji="🔊" color="bg-tv-yellow" label="Escuchar de nuevo" />
        <div className="grid grid-cols-3 gap-4">
          {types.map(t => (
            <button key={t} onClick={() => { if (t === current) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong'); }} 
              className="bg-white border-4 border-tv-orange px-6 py-4 rounded-2xl text-lg font-black uppercase shadow-lg hover:bg-orange-50 active:scale-95 transition-all">{t}</button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
};

// --- Hidden Object Game ---
const HiddenObjGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [grid, setGrid] = useState<string[]>([]);
  useEffect(() => { setGrid(new Array(11).fill('🍎').concat('🤡').sort(() => Math.random() - 0.5)); }, []);
  return (
    <GameContainer level={1} maxLevels={1} title="Favorito" instruction="¡Busca al payaso entre las frutas!">
      <div className="grid grid-cols-4 gap-6 p-4 bg-white/50 rounded-[2rem] border-4 border-dashed border-gray-200">
        {grid.map((item, i) => (
          <button key={i} onClick={() => { if (item === '🤡') { playTone('win'); onFinish(100); } else playTone('wrong'); }} 
            className="text-6xl p-2 transform hover:scale-125 transition-transform duration-200">{item}</button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Colors Game ---
const ColorsGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const groups = [{ c: '🔴', color: 'rojo' }, { c: '🔵', color: 'azul' }, { c: '🟢', color: 'verde' }];
  const current = groups[level - 1];
  const options = ['🔴', '🔵', '🟢', '🟡', '🟣'];
  return (
    <GameContainer level={level} maxLevels={3} title="El Museo" instruction={`Toca el color ${current.color}`}>
      <div className="flex gap-6 p-8 bg-white rounded-[3rem] shadow-xl border-4 border-gray-100">
        {options.map(o => (
          <button key={o} onClick={() => { if (o === current.c) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong'); }} 
            className="text-8xl p-2 hover:scale-110 active:scale-90 transition-all drop-shadow-md">{o}</button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Rhymes Game ---
const RhymesGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const pairs = [{ word: 'Gato', rhyme: 'Pato' }, { word: 'Botón', rhyme: 'Ratón' }, { word: 'Fresa', rhyme: 'Mesa' }];
  const [level, setLevel] = useState(1);
  const current = pairs[level - 1];
  const others = ['Sol', 'Luna', 'Flor', 'Pan'];
  const [opts, setOpts] = useState<string[]>([]);
  useEffect(() => { setOpts([current.rhyme, ...others.sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5)); }, [level]);
  return (
    <GameContainer level={level} maxLevels={3} title="Rimas" instruction={`¿Qué rima con ${current.word}?`}>
      <div className="flex flex-col items-center gap-10 w-full px-6">
        <div className="text-7xl font-black p-8 bg-white rounded-[2rem] border-8 border-tv-orange shadow-2xl text-tv-black uppercase tracking-tighter transform -rotate-2">{current.word}</div>
        <div className="grid grid-cols-3 gap-6 w-full">
          {opts.map(o => (
            <button key={o} onClick={() => { if (o === current.rhyme) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong'); }} 
              className="bg-white border-4 border-tv-orange py-6 rounded-3xl text-3xl font-black shadow-lg hover:bg-orange-50 active:translate-y-1 transition-all uppercase">{o}</button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
};

// --- Shapes Game ---
const ShapesGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const shapes = [{ s: '🟦', n: 'Cuadrado' }, { s: '🔴', n: 'Círculo' }, { s: '🔺', n: 'Triángulo' }];
  const [level, setLevel] = useState(1);
  const current = shapes[level - 1];
  return (
    <GameContainer level={level} maxLevels={3} title="Formas" instruction={`Busca el ${current.n}`}>
      <div className="flex gap-10 p-10 bg-white rounded-[3rem] shadow-2xl">
        {shapes.map(s => (
          <button key={s.n} onClick={() => { if (s.n === current.n) { playTone('correct'); if (level < 3) setLevel(l => l + 1); else onFinish(100); } else playTone('wrong'); }} 
            className="text-9xl p-2 hover:scale-110 active:scale-95 transition-all drop-shadow-xl">{s.s}</button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Puzzles Game ---
const PuzzlesGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [parts, setParts] = useState([1, 2, 3, 4].sort(() => Math.random() - 0.5));
  const [solved, setSolved] = useState<number[]>([]);
  const check = (p: number) => {
    if (p === solved.length + 1) {
      playTone('correct');
      setSolved(prev => [...prev, p]);
      if (solved.length === 3) onFinish(100);
    } else playTone('wrong');
  };
  return (
    <GameContainer level={solved.length + 1} maxLevels={4} title="Puzzles" instruction="¡Arma el rompecabezas en orden!">
      <div className="grid grid-cols-2 gap-8 p-10 bg-gray-100 rounded-[3rem] border-4 border-dashed border-gray-300 shadow-inner">
        {parts.map(p => (
          <button key={p} onClick={() => check(p)} 
            className={`w-32 h-32 md:w-40 md:h-40 rounded-[2rem] text-6xl flex items-center justify-center font-black transition-all duration-300 shadow-xl ${solved.includes(p) ? 'bg-green-500 text-white scale-95 opacity-50' : 'bg-tv-orange text-white hover:scale-105 active:scale-90'}`}>
            {p}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- Recycle Game ---
const allRecycleItems = [
  { name: 'Botella', type: 'plastico', emoji: '🥤' },
  { name: 'Manzana', type: 'organico', emoji: '🍎' },
  { name: 'Lata', type: 'metal', emoji: '🥫' },
  { name: 'Papel', type: 'papel', emoji: '📄' },
  { name: 'Banana', type: 'organico', emoji: '🍌' },
];

const RecycleGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState<typeof allRecycleItems>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  useEffect(() => { setItems([...allRecycleItems].sort(() => Math.random() - 0.5).slice(0, level + 1)); setIdx(0); }, [level]);
  const handleSort = (binType: 'green' | 'blue') => {
    const isOrganic = items[idx].type === 'organico';
    const isCorrect = (binType === 'green' && isOrganic) || (binType === 'blue' && !isOrganic);
    if (isCorrect) { playTone('correct'); setScore(s => s + 10); } else playTone('wrong');
    if (idx < items.length - 1) setIdx(prev => prev + 1);
    else if (level < 3) setLevel(l => l + 1);
    else onFinish(score + (isCorrect ? 10 : 0));
  };
  if (items.length === 0) return <div>Cargando...</div>;
  return (
    <GameContainer level={level} maxLevels={3} title="Basura" instruction="Verde para comida, azul para lo demás.">
      <div className="mb-10 p-10 bg-white rounded-full shadow-2xl border-4 border-gray-100 animate-bounce text-9xl">{items[idx]?.emoji}</div>
      <div className="flex gap-12">
        <IconButton onClick={() => handleSort('green')} emoji="🍏" color="bg-green-500" label="Orgánico" />
        <IconButton onClick={() => handleSort('blue')} emoji="♻️" color="bg-blue-500" label="Reciclaje" />
      </div>
    </GameContainer>
  );
};

// --- ActiveGame Selector ---
export const ActiveGame: React.FC<GameProps> = ({ type, onFinish }) => {
  switch (type) {
    case GameType.KARAOKE: return <KaraokeGame onFinish={onFinish} />;
    case GameType.VEO_ANIMATION: return <VeoAnimationGame onFinish={onFinish} />;
    case GameType.RECYCLING: return <RecycleGame onFinish={onFinish} />;
    case GameType.MATH: return <MathGame onFinish={onFinish} />;
    case GameType.REFLEX: return <ReflexGame onFinish={onFinish} />;
    case GameType.MEMORY: return <MemoryGame onFinish={onFinish} />;
    case GameType.VOWELS: return <VowelGame onFinish={onFinish} />;
    case GameType.SIMON: return <SimonGame onFinish={onFinish} />;
    case GameType.HEALTHY: return <HealthyGame onFinish={onFinish} />;
    case GameType.MAGIC_CAMERA: return <MagicCameraGame onFinish={onFinish} />;
    case GameType.COUNTDOWN: return <CountdownGame onFinish={onFinish} />;
    case GameType.SOUNDS: return <SoundsGame onFinish={onFinish} />;
    case GameType.HIDDEN_OBJ: return <HiddenObjGame onFinish={onFinish} />;
    case GameType.COLORS: return <ColorsGame onFinish={onFinish} />;
    case GameType.RHYMES: return <RhymesGame onFinish={onFinish} />;
    case GameType.SHAPES: return <ShapesGame onFinish={onFinish} />;
    case GameType.PUZZLES: return <PuzzlesGame onFinish={onFinish} />;
    default: return <div>Juego no encontrado</div>;
  }
};
