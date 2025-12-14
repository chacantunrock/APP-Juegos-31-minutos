import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import { playTone, speak } from '../services/audio';
import { editImageWithGemini } from '../services/geminiService';
import { CHARACTERS } from '../constants';

interface GameProps {
  type: GameType;
  onFinish: (score: number) => void;
}

// --- Shared UI ---
interface GameContainerProps {
  children: React.ReactNode;
  title: string;
  instruction: string;
}

const GameContainer: React.FC<GameContainerProps> = ({ children, title, instruction }) => {
  useEffect(() => {
    // Speak instruction on mount
    const timer = setTimeout(() => {
      speak(instruction);
    }, 500);
    return () => clearTimeout(timer);
  }, [instruction]);

  return (
    <div className="flex flex-col items-center w-full h-full p-2 bg-white/90 rounded-3xl border-4 border-tv-orange shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center w-full px-4 pt-2 mb-4 border-b-2 border-dashed border-gray-300 pb-2">
         <h2 className="text-2xl font-black uppercase text-tv-orange">{title}</h2>
         <button 
           onClick={() => speak(instruction)}
           className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg active:scale-90 transition-transform"
           aria-label="Repetir instrucciones"
         >
           🔊
         </button>
      </div>
      <div className="w-full h-full flex flex-col items-center justify-center flex-1">
        {children}
      </div>
    </div>
  );
};

interface IconButtonProps {
  onClick: () => void;
  emoji: string;
  color: string;
  label?: string; // Optional for accessibility, not display
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, emoji, color, label }) => (
  <button
    onClick={() => {
      playTone('click');
      onClick();
    }}
    className={`${color} w-32 h-32 md:w-40 md:h-40 rounded-3xl flex flex-col items-center justify-center shadow-[0_8px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all border-4 border-white ring-4 ring-black/10`}
  >
    <span className="text-6xl md:text-7xl drop-shadow-md">{emoji}</span>
    {label && <span className="sr-only">{label}</span>}
  </button>
);

// --- 1. Recycling Game (Icon based) ---
const recycleItems = [
  { id: 1, name: 'Botella', type: 'plastico', emoji: '🥤' },
  { id: 2, name: 'Manzana', type: 'organico', emoji: '🍎' },
  { id: 3, name: 'Lata', type: 'metal', emoji: '🥫' },
  { id: 4, name: 'Papel', type: 'papel', emoji: '📄' },
  { id: 5, name: 'Banana', type: 'organico', emoji: '🍌' },
];

const RecycleGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const handleSort = (binType: 'green' | 'blue') => {
    const item = recycleItems[idx];
    const isOrganic = item.type === 'organico';
    const isCorrect = (binType === 'green' && isOrganic) || (binType === 'blue' && !isOrganic);

    if (isCorrect) {
      playTone('correct');
      speak("¡Bien!");
      setScore(s => s + 20);
    } else {
      playTone('wrong');
      speak("¡Oh no!");
    }

    if (idx < recycleItems.length - 1) {
      setIdx(prev => prev + 1);
    } else {
      setTimeout(() => onFinish(score + (isCorrect ? 20 : 0)), 1000);
    }
  };

  return (
    <GameContainer title="Basura" instruction="Toca el basurero verde para la comida, y el azul para lo demás.">
      <div className="mb-8 p-6 bg-white rounded-full shadow-xl border-4 border-gray-100 animate-bounce">
        <span className="text-8xl">{recycleItems[idx].emoji}</span>
      </div>
      <div className="flex gap-8">
        <IconButton onClick={() => handleSort('green')} emoji="🍏" color="bg-green-500" label="Orgánico" />
        <IconButton onClick={() => handleSort('blue')} emoji="♻️" color="bg-blue-500" label="Reciclaje" />
      </div>
    </GameContainer>
  );
};

// --- 2. Math Game (Visual) ---
const MathGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const questions = [
    { q: "2 + 2", a: 4, opts: [3, 4, 5], spoken: "Dos más dos" },
    { q: "5 - 3", a: 2, opts: [2, 8, 1], spoken: "Cinco menos tres" },
    { q: "1 + 1", a: 2, opts: [2, 3, 1], spoken: "Uno más uno" },
  ];

  useEffect(() => {
    speak(questions[qIndex].spoken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  const handleAnswer = (ans: number) => {
    const correct = ans === questions[qIndex].a;
    if (correct) {
      playTone('correct');
      setScore(s => s + 33);
    } else {
      playTone('wrong');
    }
    
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setTimeout(() => onFinish(score + (correct ? 33 : 0)), 500);
    }
  };

  return (
    <GameContainer title="Números" instruction="¿Cuánto es? Toca el número correcto.">
      <div className="text-7xl font-black mb-12 text-tv-black flex items-center justify-center gap-4">
        {questions[qIndex].q} <span>=</span> <span className="text-tv-orange">?</span>
      </div>
      <div className="flex gap-4">
        {questions[qIndex].opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="w-24 h-24 bg-tv-yellow text-4xl font-black rounded-2xl border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- 3. Vowels Game (Replaces Spelling) ---
const VowelGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);

  const words = [
    { emoji: "✈️", word: "Avión", answer: "A" },
    { emoji: "🐘", word: "Elefante", answer: "E" },
    { emoji: "⛪", word: "Iglesia", answer: "I" },
    { emoji: "🐻", word: "Oso", answer: "O" },
    { emoji: "🦄", word: "Unicornio", answer: "U" },
  ];

  useEffect(() => {
    speak(words[qIndex].word);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  const handleGuess = (vowel: string) => {
    const isCorrect = vowel === words[qIndex].answer;
    if (isCorrect) {
      playTone('correct');
      speak(`¡Sí! ${words[qIndex].word} empieza con ${vowel}`);
      setScore(s => s + 20);
    } else {
      playTone('wrong');
      speak("Intenta otra vez");
      return;
    }

    if (qIndex < words.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      setTimeout(() => onFinish(score + (isCorrect ? 20 : 0)), 1000);
    }
  };

  return (
    <GameContainer title="Vocales" instruction="¿Con qué letra empieza este dibujo?">
      <button onClick={() => speak(words[qIndex].word)} className="mb-8 transform hover:scale-110 transition-transform">
        <div className="text-9xl drop-shadow-2xl">{words[qIndex].emoji}</div>
      </button>
      
      <div className="flex gap-2 flex-wrap justify-center">
        {['A', 'E', 'I', 'O', 'U'].map((v) => (
          <button 
            key={v} 
            onClick={() => handleGuess(v)}
            className="w-16 h-16 bg-purple-500 text-white rounded-xl text-3xl font-bold border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
          >
            {v}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- 4. Reflex Game (Icon stats) ---
const ReflexGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [pos, setPos] = useState({ top: 40, left: 40 });
  const [visible, setVisible] = useState(true);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else {
      playTone('win');
      onFinish(score);
    }
  }, [timeLeft, score, onFinish]);

  const handleClick = () => {
    playTone('click');
    setScore(s => s + 10);
    setVisible(false);
    setTimeout(() => {
      setPos({ top: Math.random() * 60 + 10, left: Math.random() * 60 + 10 });
      setVisible(true);
    }, 400); // Slower for kids
  };

  return (
    <GameContainer title="Fotos" instruction="¡Toca la cámara antes que se vaya!">
      <div className="absolute top-4 w-full px-4 flex justify-between text-2xl font-bold text-gray-600">
        <div className="flex items-center gap-2"><span className="text-3xl">⭐</span> {score}</div>
        <div className="flex items-center gap-2"><span className="text-3xl">⏳</span> {timeLeft}</div>
      </div>
      
      {visible && (
        <button
          onClick={handleClick}
          style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
          className="absolute text-6xl animate-pulse"
        >
          📷
        </button>
      )}
    </GameContainer>
  );
};

// --- 5. Memory Game (Purely Visual) ---
const cardIcons = ['🎸', '🎤', '🎹', '🎷', '🎸', '🎤', '🎹', '🎷'];

const MemoryGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [cards, setCards] = useState<{id: number, icon: string, flipped: boolean, solved: boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    const shuffled = [...cardIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, i) => ({ id: i, icon, flipped: false, solved: false }));
    setCards(shuffled);
  }, []);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || cards[index].flipped || cards[index].solved) return;

    playTone('click');
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        // Match
        playTone('correct');
        speak("¡Pareja!", 1.2, 1.2, false);
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].solved = true;
          matchedCards[second].solved = true;
          setCards(matchedCards);
          setFlipped([]);
          setMatches(m => {
             const newM = m + 1;
             if (newM === 4) {
                playTone('win');
                setTimeout(() => onFinish(100), 1000);
             }
             return newM;
          });
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <GameContainer title="Memoria" instruction="Encuentra dos dibujos iguales.">
       <div className="grid grid-cols-4 gap-2 md:gap-4 p-2">
         {cards.map((card, i) => (
           <button
            key={i}
            onClick={() => handleCardClick(i)}
            className={`w-14 h-20 md:w-20 md:h-28 text-3xl md:text-5xl rounded-xl border-4 transition-all duration-300 transform ${
              card.flipped || card.solved 
                ? 'bg-white border-tv-orange rotate-0' 
                : 'bg-tv-check border-black rotate-y-180'
            }`}
           >
             {(card.flipped || card.solved) ? card.icon : <span className="text-2xl text-white opacity-50">?</span>}
           </button>
         ))}
       </div>
    </GameContainer>
  );
};

// --- 6. Music Sequence Game (Simon Says) ---
const colors = [
  { id: 0, color: 'bg-red-500', active: 'bg-red-300', icon: '🥁' },
  { id: 1, color: 'bg-blue-500', active: 'bg-blue-300', icon: '🎺' },
  { id: 2, color: 'bg-green-500', active: 'bg-green-300', icon: '🎸' },
  { id: 3, color: 'bg-yellow-500', active: 'bg-yellow-200', icon: '🎹' },
];

const SimonGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Start game
  useEffect(() => {
    addToSequence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToSequence = () => {
    const next = Math.floor(Math.random() * 4);
    const newSeq = [...sequence, next];
    setSequence(newSeq);
    setPlayerSeq([]);
    setPlaying(true);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    // Small delay before starting
    await new Promise(r => setTimeout(r, 1000));
    
    for (const id of seq) {
      setActiveBtn(id);
      playTone('click'); // Can differentiate tones in future
      await new Promise(r => setTimeout(r, 600));
      setActiveBtn(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setPlaying(false);
  };

  const handlePress = (id: number) => {
    if (playing) return;

    playTone('click');
    const newPlayerSeq = [...playerSeq, id];
    setPlayerSeq(newPlayerSeq);

    // Check last input
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      playTone('wrong');
      speak("¡Casi! Intenta de nuevo.");
      setTimeout(() => onFinish(score), 1000);
      return;
    }

    // Sequence complete?
    if (newPlayerSeq.length === sequence.length) {
      playTone('correct');
      setScore(s => s + 10);
      setTimeout(addToSequence, 500);
    }
  };

  return (
    <GameContainer title="Música" instruction="Repite los sonidos del ranking.">
       <div className="grid grid-cols-2 gap-4">
         {colors.map((btn) => (
           <button
             key={btn.id}
             onClick={() => handlePress(btn.id)}
             className={`${activeBtn === btn.id ? btn.active : btn.color} w-32 h-32 rounded-2xl text-6xl shadow-xl transition-all border-4 border-black/20`}
           >
             {btn.icon}
           </button>
         ))}
       </div>
       <div className="mt-8 text-2xl font-bold text-gray-500">
         Ronda: {sequence.length}
       </div>
    </GameContainer>
  );
};

// --- 7. Healthy Habits Game ---
const habits = [
  { good: { icon: '🍎', name: 'Manzana' }, bad: { icon: '🍬', name: 'Dulce' } },
  { good: { icon: '🥦', name: 'Verdura' }, bad: { icon: '🍔', name: 'Hamburguesa' } },
  { good: { icon: '💧', name: 'Agua' }, bad: { icon: '🥤', name: 'Refresco' } },
  { good: { icon: '⚽', name: 'Deporte' }, bad: { icon: '📺', name: 'Televisión' } },
  { good: { icon: '🦷', name: 'Cepillarse' }, bad: { icon: '🦠', name: 'Suciedad' } },
];

const HealthyGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState<any[]>([]);

  useEffect(() => {
    // Shuffle items left/right on mount/idx change
    const current = habits[idx];
    const pair = Math.random() > 0.5 
      ? [current.good, current.bad] 
      : [current.bad, current.good];
    setShuffled(pair);
  }, [idx]);

  const handleChoice = (item: any) => {
    const isGood = item.name === habits[idx].good.name;
    
    if (isGood) {
      playTone('correct');
      speak("¡Muy saludable!");
      setScore(s => s + 20);
    } else {
      playTone('wrong');
      speak("¡Oh no!");
    }

    if (idx < habits.length - 1) {
      setTimeout(() => setIdx(prev => prev + 1), 1000);
    } else {
      setTimeout(() => onFinish(score + (isGood ? 20 : 0)), 1000);
    }
  };

  if (shuffled.length === 0) return null;

  return (
    <GameContainer title="Vida Sana" instruction="Toca el dibujo que es bueno para tu salud.">
      <div className="flex gap-8 items-center justify-center">
        {shuffled.map((item, i) => (
           <button
             key={i}
             onClick={() => handleChoice(item)}
             className="w-32 h-32 md:w-40 md:h-40 bg-white border-4 border-gray-200 rounded-3xl shadow-lg flex items-center justify-center text-7xl active:scale-90 transition-transform hover:bg-green-50"
           >
             {item.icon}
           </button>
        ))}
      </div>
      <div className="mt-8 text-xl font-bold text-gray-400">
        {score} Puntos
      </div>
    </GameContainer>
  );
};

// --- 8. Magic Camera Game (Gemini Nano Banana) ---
const MagicCameraGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [listening, setListening] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start Camera
  useEffect(() => {
    if (step === 'capture') {
      speak("¡Vamos a tomar una foto! Sonríe.");
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera error:", err));
    }
  }, [step]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        setStep('edit');
        playTone('click');
        speak("¡Linda foto! Elige un personaje para transformarte.");
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta voz. Intenta en Chrome.");
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    playTone('click');

    recognition.onresult = async (event: any) => {
      const command = event.results[0][0].transcript;
      setListening(false);
      speak(`Dijiste: ${command}. ¡Haciendo magia!`);
      await processImage(command);
    };

    recognition.onerror = () => {
      setListening(false);
      speak("No te escuché bien. Intenta de nuevo.");
    };

    recognition.start();
  };

  const processImage = async (prompt: string) => {
    if (!image) return;
    setProcessing(true);
    
    const newImage = await editImageWithGemini(image, prompt);
    
    if (newImage) {
      setImage(newImage);
      playTone('win');
      speak("¡Listo! Mira qué divertido.");
    } else {
      playTone('wrong');
      speak("La magia falló un poquito. Intenta otra cosa.");
    }
    setProcessing(false);
  };

  const applyCharacterFilter = (char: typeof CHARACTERS[0]) => {
     playTone('click');
     speak(`Transformando en ${char.name}`);
     // Prompt for Gemini 2.5 Flash Image
     const prompt = `Transform the person in the photo into a puppet style similar to ${char.visualDescription}. Keep it funny and colorful.`;
     processImage(prompt);
  };

  return (
    <GameContainer title="Cámara Mágica" instruction="Toma una foto y conviértete en títere.">
      {step === 'capture' ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative border-8 border-tv-black rounded-lg overflow-hidden bg-black shadow-xl">
             <video ref={videoRef} autoPlay playsInline className="w-80 h-60 object-cover transform scale-x-[-1]" />
             <canvas ref={canvasRef} width="320" height="240" className="hidden" />
          </div>
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse"
          >
            <span className="text-4xl">📸</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full h-full">
           <div className="relative border-8 border-tv-orange rounded-lg overflow-hidden bg-black shadow-xl shrink-0">
             {processing && (
               <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                 <span className="text-4xl animate-spin">✨</span>
               </div>
             )}
             {image && <img src={image} alt="Captured" className="w-64 h-48 object-cover" />}
           </div>
           
           <div className="flex-1 w-full overflow-y-auto px-2">
             <p className="text-center font-bold text-gray-500 mb-2">¡Elige un personaje!</p>
             <div className="grid grid-cols-4 gap-2 justify-items-center">
               {CHARACTERS.map(char => (
                 <button 
                   key={char.id}
                   onClick={() => applyCharacterFilter(char)}
                   disabled={processing}
                   className="w-16 h-16 rounded-full overflow-hidden border-2 border-black hover:scale-110 transition-transform"
                 >
                   <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                 </button>
               ))}
               <button
                 onClick={startListening}
                 disabled={processing}
                 className="w-16 h-16 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-2xl hover:scale-110 transition-transform text-white"
               >
                 🎤
               </button>
             </div>
           </div>

           <div className="flex gap-4 items-center shrink-0 mt-2">
             <button
               onClick={() => {
                   setStep('capture');
                   setImage(null);
               }}
               className="w-16 h-16 bg-gray-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
             >
               <span className="text-2xl">🔄</span>
             </button>
             <button
                onClick={() => onFinish(100)}
                className="w-16 h-16 bg-yellow-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
             >
                <span className="text-2xl">💾</span>
             </button>
           </div>
        </div>
      )}
    </GameContainer>
  );
};

export const ActiveGame: React.FC<GameProps> = ({ type, onFinish }) => {
  switch (type) {
    case GameType.RECYCLING: return <RecycleGame onFinish={onFinish} />;
    case GameType.MATH: return <MathGame onFinish={onFinish} />;
    case GameType.REFLEX: return <ReflexGame onFinish={onFinish} />;
    case GameType.MEMORY: return <MemoryGame onFinish={onFinish} />;
    case GameType.VOWELS: return <VowelGame onFinish={onFinish} />;
    case GameType.SIMON: return <SimonGame onFinish={onFinish} />;
    case GameType.HEALTHY: return <HealthyGame onFinish={onFinish} />;
    case GameType.MAGIC_CAMERA: return <MagicCameraGame onFinish={onFinish} />;
    default: return <div>Juego no encontrado</div>;
  }
};