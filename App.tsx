import React, { useState, useEffect } from 'react';
import { CHARACTERS, GAMES } from './constants';
import { Character, CharacterId, GameType } from './types';
import { ActiveGame } from './components/Games';
import { getCharacterFeedback } from './services/geminiService';
import { speak, playTone, stopSpeech } from './services/audio';

enum AppView {
  MENU,
  CHARACTER_SELECT,
  GAME,
  RESULT
}

// Component to handle character avatar with fallback
const CharacterAvatar = ({ character, className }: { character: Character | null, className: string }) => {
  const [error, setError] = useState(false);
  
  if (!character) return null;

  const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${character.name}&mouth=smile,bigSmile,laughing`;

  return (
    <img 
      src={error ? fallbackUrl : character.avatarUrl} 
      alt={character.name} 
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.MENU);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Stop speech when unmounting or changing views drastically
  useEffect(() => {
    return () => stopSpeech();
  }, [view]);

  // --- Handlers ---
  const handleGameSelect = (gameId: GameType) => {
    playTone('click');
    speak("Elige tu personaje");
    setSelectedGame(gameId);
    setView(AppView.CHARACTER_SELECT);
  };

  const handleCharacterSelect = (char: Character) => {
    playTone('click');
    speak(`¡Hola soy ${char.name}!`, char.voicePitch, char.voiceRate);
    setSelectedCharacter(char);
    setTimeout(() => setView(AppView.GAME), 1000); // Delay for greeting
  };

  const handleGameFinish = async (finalScore: number) => {
    setScore(finalScore);
    setView(AppView.RESULT);
    setLoadingFeedback(true);
    playTone('win');
    
    if (selectedCharacter && selectedGame) {
      const msg = await getCharacterFeedback(
        selectedCharacter.id,
        finalScore,
        selectedGame
      );
      setFeedback(msg);
      // Speak the feedback in character's voice settings
      setTimeout(() => {
        speak(msg, selectedCharacter.voicePitch, selectedCharacter.voiceRate);
      }, 500);
    }
    setLoadingFeedback(false);
  };

  const goHome = () => {
    stopSpeech();
    playTone('click');
    setView(AppView.MENU);
    setSelectedGame(null);
    setSelectedCharacter(null);
    setScore(0);
    setFeedback("");
    speak("Menú principal");
  };

  // --- Views ---

  const renderMenu = () => (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 animate-fade-in h-full">
      <header className="mb-4 text-center bg-tv-black text-white px-8 py-4 rounded-3xl border-b-8 border-tv-orange shadow-2xl w-full flex justify-between items-center">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-tv-yellow transform -rotate-2">
          31 Juegos
        </h1>
        <button onClick={() => speak("Bienvenido a 31 Juegos. Toca un dibujo para jugar.")} className="text-4xl bg-white/20 rounded-full p-2">
            🔊
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full h-full pb-4 overflow-y-auto">
        {GAMES.map((game) => {
          const gameChar = CHARACTERS.find(c => c.id === game.characterId);
          return (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              onMouseEnter={() => speak(game.title)}
              className="group relative bg-white border-4 border-black rounded-3xl p-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-between h-40 md:h-48"
            >
               {/* Character Host Badge */}
               {gameChar && (
                 <div className={`absolute -top-3 -right-3 w-16 h-16 rounded-full border-4 border-black ${gameChar.color} z-10 flex items-center justify-center overflow-hidden shadow-md transform group-hover:scale-110 transition-transform`}>
                    <CharacterAvatar character={gameChar} className="w-full h-full object-cover" />
                 </div>
               )}

               <div className="flex-1 flex items-center justify-center">
                  <div className="text-6xl md:text-7xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>
               </div>
               
               <div className="w-full bg-tv-black rounded-xl py-1 md:py-2">
                 <h3 className="text-lg md:text-xl font-black text-tv-yellow uppercase leading-none text-center px-1">
                   {game.title}
                 </h3>
               </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCharacterSelect = () => (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 h-full">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <h2 className="text-3xl md:text-5xl font-black text-white bg-tv-black px-8 py-4 rounded-full border-b-8 border-tv-orange transform -rotate-2 shadow-2xl">
          ¿QUIÉN ERES?
        </h2>
        <button onClick={() => speak("¿Quién quieres ser?")} className="text-4xl bg-white rounded-full p-3 border-4 border-black shadow-lg hover:scale-110 transition-transform">🔊</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full overflow-y-auto pb-24 px-2">
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => handleCharacterSelect(char)}
            className="group relative flex items-center w-full h-32 md:h-40 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all overflow-visible"
          >
            {/* Pastel Background Tint */}
            <div className={`absolute inset-0 rounded-[1.8rem] ${char.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
            
            {/* Image Circle Container - Overlapping left */}
            <div className={`relative -ml-4 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black ${char.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform z-10`}>
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white border-2 border-black/10">
                 <CharacterAvatar character={char} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Name Text */}
            <div className="flex-1 text-center pr-4 z-0">
              <span className="block font-black text-2xl md:text-4xl uppercase text-tv-black drop-shadow-sm group-hover:scale-105 transition-transform">
                {char.name}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <button onClick={goHome} className="fixed bottom-6 left-6 bg-red-600 text-white font-bold w-20 h-20 rounded-full border-4 border-white ring-4 ring-black text-4xl shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
        🔙
      </button>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 text-center animate-fade-in">
       <div className="bg-white border-8 border-black p-8 rounded-[3rem] shadow-2xl relative w-full">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-tv-orange text-white px-8 py-2 font-black text-3xl uppercase border-4 border-black -rotate-2 rounded-xl">
             🏆 {score} 🏆
          </div>
          
          <div className="mt-12 mb-8 p-4 bg-gray-100 rounded-3xl border-4 border-dashed border-gray-400 flex flex-col items-center">
             <div className={`w-32 h-32 rounded-full border-4 border-black overflow-hidden mb-4 ${selectedCharacter?.color}`}>
                 <CharacterAvatar character={selectedCharacter} className="w-full h-full object-contain p-1" />
             </div>
             {loadingFeedback ? (
               <div className="text-4xl animate-pulse">💬 ...</div>
             ) : (
               <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-black italic">"{feedback}"</p>
                  <button onClick={() => speak(feedback, selectedCharacter?.voicePitch, selectedCharacter?.voiceRate)} className="text-3xl ml-2 bg-yellow-300 rounded-full p-2">🔊</button>
               </div>
             )}
          </div>

          <div className="flex gap-6 justify-center">
            <button 
              onClick={goHome}
              className="bg-gray-200 text-black w-24 h-24 rounded-2xl font-bold text-4xl hover:bg-gray-300 border-b-8 border-gray-400 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center"
              aria-label="Inicio"
            >
              🏠
            </button>
            <button 
              onClick={() => setView(AppView.GAME)}
              className="bg-tv-orange text-white w-24 h-24 rounded-2xl font-bold text-4xl hover:bg-orange-600 border-b-8 border-red-800 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center"
              aria-label="Jugar de nuevo"
            >
              🔄
            </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-news-pattern bg-[length:40px_40px] flex items-center justify-center p-2 relative overflow-hidden">
       <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-0 pointer-events-none"></div>
       
       <div className="z-10 w-full h-full max-w-6xl flex flex-col">
        {view === AppView.MENU && renderMenu()}
        {view === AppView.CHARACTER_SELECT && renderCharacterSelect()}
        {view === AppView.GAME && selectedGame && (
          <div className="flex-1 flex flex-col h-full py-4">
            <div className="mb-2 flex justify-between items-center bg-black text-white px-4 py-2 rounded-full border-2 border-white shadow-lg mx-2">
               <div className="flex items-center gap-2">
                 <div className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden ${selectedCharacter?.color}`}>
                    <CharacterAvatar character={selectedCharacter} className="w-full h-full object-contain" />
                 </div>
                 <span className="font-bold">{selectedCharacter?.name}</span>
               </div>
               <button onClick={goHome} className="bg-red-600 px-4 py-1 rounded-full font-bold border-2 border-red-800">X</button>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <ActiveGame type={selectedGame} onFinish={handleGameFinish} />
            </div>
          </div>
        )}
        {view === AppView.RESULT && renderResult()}
       </div>
    </div>
  );
}