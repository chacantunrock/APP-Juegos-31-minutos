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

// Component to handle character avatar with custom tooltip
const CharacterAvatar = ({ character, className, showTooltip = true }: { character: Character | null, className: string, showTooltip?: boolean }) => {
  const [error, setError] = useState(false);
  
  if (!character) return null;

  const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${character.name}&mouth=smile,bigSmile,laughing`;

  return (
    <div className="relative group/avatar w-full h-full flex items-center justify-center">
      <img 
        src={error ? fallbackUrl : character.avatarUrl} 
        alt={character.name} 
        className={`${className} object-cover w-full h-full`}
        style={{ objectPosition: 'center top' }}
        onError={() => setError(true)}
      />
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover/avatar:block bg-white border-2 border-black px-3 py-1 rounded-xl text-[10px] md:text-xs font-black uppercase text-tv-black z-[100] whitespace-nowrap shadow-[3px_3px_0px_rgba(0,0,0,1)] pointer-events-none transition-all">
          {character.name}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-black rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.MENU);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // State for custom voice configurations
  const [voiceConfigs, setVoiceConfigs] = useState<Record<string, { pitch: number, rate: number }>>(() => {
    const initialConfigs: Record<string, { pitch: number, rate: number }> = {};
    CHARACTERS.forEach(char => {
      initialConfigs[char.id] = { pitch: char.voicePitch, rate: char.voiceRate };
    });
    return initialConfigs;
  });

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

  const handleVoiceConfigChange = (charId: string, type: 'pitch' | 'rate', value: number) => {
    setVoiceConfigs(prev => ({
      ...prev,
      [charId]: { ...prev[charId], [type]: value }
    }));
  };

  const handleCharacterSelect = (char: Character) => {
    const config = voiceConfigs[char.id];
    const customizedChar = { 
      ...char, 
      voicePitch: config.pitch, 
      voiceRate: config.rate 
    };
    
    playTone('click');
    speak(`¡Hola soy ${customizedChar.name}!`, customizedChar.voicePitch, customizedChar.voiceRate);
    setSelectedCharacter(customizedChar);
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
      // Speak using the customized voice settings stored in selectedCharacter
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
      <header className="mb-4 text-center bg-tv-black text-white px-8 py-4 rounded-3xl border-b-8 border-tv-orange shadow-2xl w-full flex justify-between items-center shrink-0">
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
               {gameChar && (
                 <div className={`absolute -top-3 -right-3 w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black ${gameChar.color} z-10 flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform bg-white`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <CharacterAvatar character={gameChar} className="w-full h-full" />
                    </div>
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
        <button onClick={() => speak("Personaliza tu voz y elige un personaje.")} className="text-4xl bg-white rounded-full p-3 border-4 border-black shadow-lg hover:scale-110 transition-transform">🔊</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full overflow-y-auto pb-24 px-2">
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => handleCharacterSelect(char)}
            className="group relative flex items-center w-full h-auto min-h-[10rem] bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all overflow-visible p-4"
          >
            {/* Pastel Background Tint */}
            <div className={`absolute inset-0 rounded-[1.8rem] ${char.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
            
            {/* Image Circle Container */}
            <div className={`relative -ml-6 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-black ${char.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform z-10 bg-white overflow-visible`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                <CharacterAvatar character={char} className="w-full h-full" />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 pl-4 z-0">
              <span className="block font-black text-xl md:text-3xl uppercase text-tv-black drop-shadow-sm group-hover:scale-105 transition-transform mb-2">
                {char.name}
              </span>

              {/* Voice Controls - Retro Knobs/Sliders */}
              <div className="w-full max-w-[150px] flex flex-col gap-2 bg-black/10 p-2 rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col w-full">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-tv-black">Tono</label>
                      <span className="text-[10px] font-bold text-tv-orange">{voiceConfigs[char.id].pitch.toFixed(1)}</span>
                   </div>
                   <input 
                    type="range" min="0.5" max="2.0" step="0.1" 
                    value={voiceConfigs[char.id].pitch}
                    onChange={(e) => handleVoiceConfigChange(char.id, 'pitch', parseFloat(e.target.value))}
                    className="w-full h-2 bg-tv-black rounded-lg appearance-none cursor-pointer accent-tv-orange"
                   />
                </div>
                <div className="flex flex-col w-full">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-tv-black">Velocidad</label>
                      <span className="text-[10px] font-bold text-tv-orange">{voiceConfigs[char.id].rate.toFixed(1)}</span>
                   </div>
                   <input 
                    type="range" min="0.5" max="2.5" step="0.1" 
                    value={voiceConfigs[char.id].rate}
                    onChange={(e) => handleVoiceConfigChange(char.id, 'rate', parseFloat(e.target.value))}
                    className="w-full h-2 bg-tv-black rounded-lg appearance-none cursor-pointer accent-tv-orange"
                   />
                </div>
              </div>
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
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 text-center animate-fade-in overflow-y-auto">
       <div className="bg-white border-8 border-black p-8 rounded-[3rem] shadow-2xl relative w-full my-12">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-tv-orange text-white px-8 py-2 font-black text-3xl uppercase border-4 border-black -rotate-2 rounded-xl">
             🏆 {score} 🏆
          </div>
          
          <div className="mt-12 mb-8 p-4 bg-gray-100 rounded-3xl border-4 border-dashed border-gray-400 flex flex-col items-center">
             <div className={`w-32 h-32 rounded-full border-4 border-black overflow-visible mb-4 ${selectedCharacter?.color} bg-white`}>
                <div className="w-full h-full rounded-full overflow-hidden">
                  <CharacterAvatar character={selectedCharacter} className="w-full h-full" />
                </div>
             </div>
             {loadingFeedback ? (
               <div className="text-4xl animate-pulse">💬 ...</div>
             ) : (
               <div className="flex items-center gap-2 flex-wrap justify-center">
                  <p className="text-2xl md:text-3xl font-bold text-black italic">"{feedback}"</p>
                  <button onClick={() => speak(feedback, selectedCharacter?.voicePitch, selectedCharacter?.voiceRate)} className="text-3xl ml-2 bg-yellow-300 rounded-full p-2 hover:scale-110 transition-transform">🔊</button>
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
            <div className="mb-2 flex justify-between items-center bg-black text-white px-4 py-2 rounded-full border-2 border-white shadow-lg mx-2 shrink-0">
               <div className="flex items-center gap-2">
                 <div className={`w-10 h-10 rounded-full border-2 border-white overflow-visible ${selectedCharacter?.color} bg-white`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <CharacterAvatar character={selectedCharacter} className="w-full h-full" />
                    </div>
                 </div>
                 <span className="font-bold hidden sm:inline">{selectedCharacter?.name}</span>
               </div>
               <button onClick={goHome} className="bg-red-600 px-4 py-1 rounded-full font-bold border-2 border-red-800 hover:bg-red-700 transition-colors">SALIR</button>
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