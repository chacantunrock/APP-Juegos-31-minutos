import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  level: number;
  maxLevels: number;
}

const GameContainer: React.FC<GameContainerProps> = ({ children, title, instruction, level, maxLevels }) => {
  useEffect(() => {
    // Speak instruction on mount or level change
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
      <div className="w-full h-full flex flex-col items-center justify-center flex-1 relative">
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

// --- 1. Recycling Game (Icon based with Levels) ---
const allRecycleItems = [
  { name: 'Botella', type: 'plastico', emoji: '🥤' },
  { name: 'Manzana', type: 'organico', emoji: '🍎' },
  { name: 'Lata', type: 'metal', emoji: '🥫' },
  { name: 'Papel', type: 'papel', emoji: '📄' },
  { name: 'Banana', type: 'organico', emoji: '🍌' },
  { name: 'Pescado', type: 'organico', emoji: '🐟' },
  { name: 'Caja', type: 'papel', emoji: '📦' },
  { name: 'Pila', type: 'metal', emoji: '🔋' },
  { name: 'Hueso', type: 'organico', emoji: '🍖' },
];

const RecycleGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState<typeof allRecycleItems>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Level 1: 3 items
    // Level 2: 5 items
    // Level 3: 7 items
    const count = level * 2 + 1;
    const shuffled = [...allRecycleItems].sort(() => Math.random() - 0.5).slice(0, count);
    setItems(shuffled);
    setIdx(0);
  }, [level]);

  const handleSort = (binType: 'green' | 'blue') => {
    if (!items[idx]) return;
    
    const item = items[idx];
    const isOrganic = item.type === 'organico';
    const isCorrect = (binType === 'green' && isOrganic) || (binType === 'blue' && !isOrganic);

    if (isCorrect) {
      playTone('correct');
      speak("¡Bien!");
      setScore(s => s + 10);
    } else {
      playTone('wrong');
      speak("¡Oh no!");
    }

    if (idx < items.length - 1) {
      setIdx(prev => prev + 1);
    } else {
        if (level < 3) {
            playTone('win');
            speak(`¡Nivel ${level} completado!`);
            setTimeout(() => setLevel(l => l + 1), 1500);
        } else {
            setTimeout(() => onFinish(score + (isCorrect ? 10 : 0)), 1000);
        }
    }
  };

  if (items.length === 0) return <div>Cargando...</div>;

  return (
    <GameContainer level={level} maxLevels={3} title="Basura" instruction="Verde para comida, azul para lo demás.">
      <div className="mb-4 md:mb-8 p-6 bg-white rounded-full shadow-xl border-4 border-gray-100 animate-bounce">
        <span className="text-8xl">{items[idx]?.emoji}</span>
      </div>
      <div className="flex gap-4 md:gap-8">
        <IconButton onClick={() => handleSort('green')} emoji="🍏" color="bg-green-500" label="Orgánico" />
        <IconButton onClick={() => handleSort('blue')} emoji="♻️" color="bg-blue-500" label="Reciclaje" />
      </div>
    </GameContainer>
  );
};

// --- 2. Math Game (Generative Levels) ---
const MathGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  
  // Generate question based on level
  const currentQuestion = useMemo(() => {
      let a, b, op, ans;
      
      if (level === 1) {
          // Sums up to 5
          a = Math.floor(Math.random() * 3) + 1;
          b = Math.floor(Math.random() * 3) + 1;
          op = '+';
          ans = a + b;
      } else if (level === 2) {
          // Subtraction or Sums up to 9
          if (Math.random() > 0.5) {
              a = Math.floor(Math.random() * 4) + 5;
              b = Math.floor(Math.random() * 4) + 1;
              op = '-';
              ans = a - b;
          } else {
              a = Math.floor(Math.random() * 5) + 1;
              b = Math.floor(Math.random() * 4) + 1;
              op = '+';
              ans = a + b;
          }
      } else {
          // Sums up to 15 or harder subtraction
          if (Math.random() > 0.5) {
              a = Math.floor(Math.random() * 8) + 1;
              b = Math.floor(Math.random() * 7) + 1;
              op = '+';
              ans = a + b;
          } else {
              a = Math.floor(Math.random() * 9) + 6;
              b = Math.floor(Math.random() * 5) + 1;
              op = '-';
              ans = a - b;
          }
      }

      // Generate options
      const opts = new Set([ans]);
      while(opts.size < 3) {
          const fake = Math.max(0, ans + Math.floor(Math.random() * 5) - 2);
          if(fake !== ans) opts.add(fake);
      }

      return {
          text: `${a} ${op} ${b}`,
          spoken: `${a} ${op === '+' ? 'más' : 'menos'} ${b}`,
          ans,
          opts: Array.from(opts).sort(() => Math.random() - 0.5)
      };
  }, [level]);

  useEffect(() => {
    speak(currentQuestion.spoken);
  }, [currentQuestion]);

  const handleAnswer = (ans: number) => {
    const correct = ans === currentQuestion.ans;
    if (correct) {
      playTone('correct');
      setScore(s => s + 33);
      if (level < 3) {
          setTimeout(() => setLevel(l => l + 1), 1000);
      } else {
          setTimeout(() => onFinish(score + 33), 1000);
      }
    } else {
      playTone('wrong');
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Números" instruction="¿Cuánto es? Toca el número correcto.">
      <div className="text-6xl md:text-8xl font-black mb-8 md:mb-12 text-tv-black flex items-center justify-center gap-4 bg-gray-100 px-8 py-4 rounded-3xl border-4 border-dashed border-gray-300">
        {currentQuestion.text} <span>=</span> <span className="text-tv-orange">?</span>
      </div>
      <div className="flex gap-4 flex-wrap justify-center">
        {currentQuestion.opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="w-24 h-24 md:w-32 md:h-32 bg-tv-yellow text-4xl md:text-5xl font-black rounded-2xl border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 transition-all shadow-lg"
          >
            {opt}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- 3. Vowels Game (Progressive) ---
const allWords = [
  { emoji: "✈️", word: "Avión", answer: "A" },
  { emoji: "🐘", word: "Elefante", answer: "E" },
  { emoji: "⛪", word: "Iglesia", answer: "I" },
  { emoji: "🐻", word: "Oso", answer: "O" },
  { emoji: "🦄", word: "Unicornio", answer: "U" },
  { emoji: "🕷️", word: "Araña", answer: "A" },
  { emoji: "⭐", word: "Estrella", answer: "E" },
  { emoji: "🏝️", word: "Isla", answer: "I" },
  { emoji: "👀", word: "Ojo", answer: "O" },
  { emoji: "🍇", word: "Uva", answer: "U" },
];

const VowelGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [currentWord, setCurrentWord] = useState(allWords[0]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Pick a random word that hasn't been used ideally, simple random for now
    const random = allWords[Math.floor(Math.random() * allWords.length)];
    setCurrentWord(random);
    speak(random.word);
  }, [level]);

  const handleGuess = (vowel: string) => {
    const isCorrect = vowel === currentWord.answer;
    if (isCorrect) {
      playTone('correct');
      speak(`¡Sí! ${currentWord.word} empieza con ${vowel}`);
      setScore(s => s + 33);
      
      if (level < 3) {
          setTimeout(() => setLevel(l => l + 1), 1500);
      } else {
          setTimeout(() => onFinish(score + 33), 1000);
      }
    } else {
      playTone('wrong');
      speak("Intenta otra vez");
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Vocales" instruction="¿Con qué letra empieza este dibujo?">
      <button onClick={() => speak(currentWord.word)} className="mb-8 transform hover:scale-110 transition-transform bg-white p-6 rounded-3xl border-4 border-gray-100 shadow-xl">
        <div className="text-8xl md:text-9xl drop-shadow-2xl">{currentWord.emoji}</div>
      </button>
      
      <div className="flex gap-2 md:gap-4 flex-wrap justify-center max-w-lg">
        {['A', 'E', 'I', 'O', 'U'].map((v) => (
          <button 
            key={v} 
            onClick={() => handleGuess(v)}
            className="w-16 h-16 md:w-20 md:h-20 bg-purple-500 text-white rounded-xl text-3xl md:text-4xl font-bold border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all shadow-lg"
          >
            {v}
          </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- 4. Reflex Game (Speed increase) ---
const ReflexGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [pos, setPos] = useState({ top: 40, left: 40 });
  const [visible, setVisible] = useState(true);
  const [score, setScore] = useState(0);
  const [catchesNeeded, setCatchesNeeded] = useState(3);

  useEffect(() => {
      // Reset needed catches per level
      setCatchesNeeded(3);
  }, [level]);

  const handleClick = () => {
    playTone('click');
    setScore(s => s + 10);
    setVisible(false);
    
    const nextCatches = catchesNeeded - 1;
    setCatchesNeeded(nextCatches);

    if (nextCatches <= 0) {
        if (level < 3) {
            playTone('win');
            speak(`¡Nivel ${level} superado!`);
            setTimeout(() => setLevel(l => l + 1), 1000);
            // Wait before showing next target
            setTimeout(() => setVisible(true), 2000);
        } else {
            setTimeout(() => onFinish(score + 10), 500);
        }
    } else {
        // Respawn logic based on level speed
        const respawnTime = level === 1 ? 1000 : level === 2 ? 700 : 400;
        setTimeout(() => {
          setPos({ top: Math.random() * 60 + 10, left: Math.random() * 60 + 10 });
          setVisible(true);
        }, respawnTime); 
    }
  };

  // Determine size based on level
  const sizeClass = level === 1 ? 'text-8xl' : level === 2 ? 'text-6xl' : 'text-5xl';

  return (
    <GameContainer level={level} maxLevels={3} title="Fotos" instruction="¡Toca la cámara antes que se vaya!">
      <div className="absolute top-4 w-full px-4 flex justify-between text-xl font-bold text-gray-600">
        <div>⭐ {score}</div>
        <div>Faltan: {catchesNeeded}</div>
      </div>
      
      {visible && (
        <button
          onClick={handleClick}
          style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
          className={`absolute ${sizeClass} animate-pulse transition-all duration-100`}
        >
          📷
        </button>
      )}
    </GameContainer>
  );
};

// --- 5. Memory Game (Grid size increase) ---
const cardIconsPool = ['🎸', '🎤', '🎹', '🎷', '🥁', '🎻', '🎧', '💿'];

const MemoryGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<{id: number, icon: string, flipped: boolean, solved: boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    // L1: 4 cards (2 pairs)
    // L2: 6 cards (3 pairs)
    // L3: 8 cards (4 pairs)
    const pairsCount = level + 1;
    const icons = cardIconsPool.slice(0, pairsCount);
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, i) => ({ id: i, icon, flipped: false, solved: false }));
    
    setCards(deck);
    setFlipped([]);
    setMatches(0);
  }, [level]);

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
        playTone('correct');
        const nextMatches = matches + 1;
        setMatches(nextMatches);
        
        setTimeout(() => {
            const matchedCards = [...newCards];
            matchedCards[first].solved = true;
            matchedCards[second].solved = true;
            setCards(matchedCards);
            setFlipped([]);

            // Check level completion
            const pairsNeeded = level + 1;
            if (nextMatches >= pairsNeeded) {
                if (level < 3) {
                    playTone('win');
                    setTimeout(() => setLevel(l => l + 1), 1000);
                } else {
                    setTimeout(() => onFinish(100), 1000);
                }
            }
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

  // Dynamic grid cols
  const gridCols = level === 1 ? 'grid-cols-2' : level === 2 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <GameContainer level={level} maxLevels={3} title="Memoria" instruction="Encuentra los pares.">
       <div className={`grid ${gridCols} gap-2 md:gap-4 p-2 transition-all duration-500`}>
         {cards.map((card, i) => (
           <button
            key={i}
            onClick={() => handleCardClick(i)}
            className={`w-20 h-28 md:w-24 md:h-32 text-4xl md:text-5xl rounded-xl border-4 transition-all duration-300 transform ${
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

// --- 6. Music Sequence Game (Simon - Length increase) ---
const simonColors = [
  { id: 0, color: 'bg-red-500', active: 'bg-red-300', icon: '🥁' },
  { id: 1, color: 'bg-blue-500', active: 'bg-blue-300', icon: '🎺' },
  { id: 2, color: 'bg-green-500', active: 'bg-green-300', icon: '🎸' },
  { id: 3, color: 'bg-yellow-500', active: 'bg-yellow-200', icon: '🎹' },
];

const SimonGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Start round
  useEffect(() => {
    startRound();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const startRound = () => {
      // L1: 3 notes, L2: 4 notes, L3: 5 notes
      const length = level + 2;
      const newSeq = Array.from({length}, () => Math.floor(Math.random() * 4));
      setSequence(newSeq);
      setPlayerSeq([]);
      setPlaying(true);
      playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    await new Promise(r => setTimeout(r, 1000));
    for (const id of seq) {
      setActiveBtn(id);
      playTone('click'); 
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

    // Wrong note
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      playTone('wrong');
      speak("¡Casi! Intenta de nuevo.");
      // Retry same level logic or finish? Let's finish for simplicity or restart level
      setTimeout(() => startRound(), 1500);
      return;
    }

    // Sequence complete
    if (newPlayerSeq.length === sequence.length) {
      playTone('correct');
      setScore(s => s + 33);
      if (level < 3) {
          playTone('win');
          speak("¡Excelente!");
          setTimeout(() => setLevel(l => l + 1), 1000);
      } else {
          setTimeout(() => onFinish(score + 33), 1000);
      }
    }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Música" instruction="Repite la canción.">
       <div className="grid grid-cols-2 gap-4">
         {simonColors.map((btn) => (
           <button
             key={btn.id}
             onClick={() => handlePress(btn.id)}
             className={`${activeBtn === btn.id ? btn.active : btn.color} w-32 h-32 rounded-2xl text-6xl shadow-xl transition-all border-4 border-black/20 transform active:scale-95`}
           >
             {btn.icon}
           </button>
         ))}
       </div>
    </GameContainer>
  );
};

// --- 7. Healthy Habits Game ---
const habits = [
  { good: { icon: '🍎', name: 'Manzana' }, bad: { icon: '🍬', name: 'Dulce' } }, // L1
  { good: { icon: '🥦', name: 'Verdura' }, bad: { icon: '🍔', name: 'Hamburguesa' } }, // L1 variant
  { good: { icon: '💧', name: 'Agua' }, bad: { icon: '🥤', name: 'Refresco' } }, // L2
  { good: { icon: '⚽', name: 'Deporte' }, bad: { icon: '📺', name: 'Televisión' } }, // L2 variant
  { good: { icon: '🦷', name: 'Cepillarse' }, bad: { icon: '🦠', name: 'Suciedad' } }, // L3
  { good: { icon: '🛌', name: 'Dormir' }, bad: { icon: '🎮', name: 'Videojuegos noche' } } // L3 variant
];

const HealthyGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [shuffled, setShuffled] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Select habit pair based on level (simplified mapping)
    const habitIndex = (level - 1) * 2 + Math.floor(Math.random() * 2); 
    const current = habits[Math.min(habitIndex, habits.length - 1)];
    
    const pair = Math.random() > 0.5 
      ? [current.good, current.bad] 
      : [current.bad, current.good];
    setShuffled(pair);
  }, [level]);

  const handleChoice = (item: any) => {
    // Logic: Good items are even index in habits array if flattened, but easier to just check name list
    const goodNames = habits.map(h => h.good.name);
    const isGood = goodNames.includes(item.name);
    
    if (isGood) {
      playTone('correct');
      speak("¡Muy saludable!");
      setScore(s => s + 33);
      if (level < 3) {
          setTimeout(() => setLevel(l => l + 1), 1500);
      } else {
          setTimeout(() => onFinish(score + 33), 1000);
      }
    } else {
      playTone('wrong');
      speak("Eso no hace bien.");
    }
  };

  if (shuffled.length === 0) return null;

  return (
    <GameContainer level={level} maxLevels={3} title="Vida Sana" instruction="Elige lo saludable.">
      <div className="flex gap-4 md:gap-8 items-center justify-center">
        {shuffled.map((item, i) => (
           <button
             key={i}
             onClick={() => handleChoice(item)}
             className="w-32 h-32 md:w-48 md:h-48 bg-white border-4 border-gray-200 rounded-3xl shadow-lg flex flex-col items-center justify-center active:scale-90 transition-transform hover:bg-green-50"
           >
             <span className="text-6xl md:text-8xl mb-2">{item.icon}</span>
           </button>
        ))}
      </div>
    </GameContainer>
  );
};

// --- 8. Magic Camera Game (Gemini Nano Banana) ---
// Since this is creative, "Levels" act as "Prompts/Missions"
const MagicCameraGame: React.FC<{ onFinish: (s: number) => void }> = ({ onFinish }) => {
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState<'capture' | 'edit'>('capture');
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [listening, setListening] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const missions = [
      "¡Pon tu mejor sonrisa!",
      "¡Haz una cara de sorpresa!",
      "¡Haz una cara divertida!"
  ];

  // Start Camera
  useEffect(() => {
    if (step === 'capture') {
      speak(missions[level-1]);
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera error:", err));
    }
  }, [step, level]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        setStep('edit');
        playTone('click');
        speak("¡Genial! Ahora transfórmate.");
        
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
      speak(`Dijiste: ${command}. ¡Magia!`);
      await processImage(command);
    };

    recognition.onerror = () => {
      setListening(false);
      speak("No te escuché bien.");
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
      speak("¡Mira qué divertido!");
    } else {
      playTone('wrong');
    }
    setProcessing(false);
  };

  const applyCharacterFilter = (char: typeof CHARACTERS[0]) => {
     playTone('click');
     speak(`Modo ${char.name}`);
     const prompt = `Transform person into a puppet looking like ${char.visualDescription}. Colorful and funny.`;
     processImage(prompt);
  };

  const nextLevel = () => {
      if (level < 3) {
          playTone('win');
          setLevel(l => l + 1);
          setStep('capture');
          setImage(null);
      } else {
          onFinish(100);
      }
  };

  return (
    <GameContainer level={level} maxLevels={3} title="Cámara Mágica" instruction={missions[level-1]}>
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
        <div className="flex flex-col items-center gap-2 w-full h-full">
           <div className="relative border-8 border-tv-orange rounded-lg overflow-hidden bg-black shadow-xl shrink-0 h-48 md:h-60">
             {processing && (
               <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                 <span className="text-4xl animate-spin">✨</span>
               </div>
             )}
             {image && <img src={image} alt="Captured" className="h-full object-cover" />}
           </div>
           
           <div className="flex-1 w-full overflow-y-auto px-2">
             <p className="text-center font-bold text-gray-500 mb-2 text-sm">¡Elige un efecto!</p>
             <div className="grid grid-cols-4 gap-2 justify-items-center">
               {CHARACTERS.map(char => (
                 <button 
                   key={char.id}
                   onClick={() => applyCharacterFilter(char)}
                   disabled={processing}
                   className="w-14 h-14 rounded-full overflow-hidden border-2 border-black hover:scale-110 transition-transform"
                 >
                   <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                 </button>
               ))}
               <button
                 onClick={startListening}
                 disabled={processing}
                 className="w-14 h-14 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-xl hover:scale-110 transition-transform text-white"
               >
                 🎤
               </button>
             </div>
           </div>

           <div className="flex gap-4 items-center shrink-0 mt-2 pb-2">
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
                onClick={nextLevel}
                className="w-16 h-16 bg-yellow-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce"
             >
                <span className="text-3xl">➡️</span>
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