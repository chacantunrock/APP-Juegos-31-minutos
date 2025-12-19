
import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS, GAMES, NEWS_PHRASES } from './constants';
import { Character, CharacterId, GameType } from './types';
import { ActiveGame } from './components/Games';
import { getCharacterFeedback } from './services/geminiService';
import { speak, playTone, stopSpeech, setGlobalVolume } from './services/audio';

enum AppView {
  MENU,
  CHARACTER_SELECT,
  GAME,
  RESULT
}

const CharacterAvatar = ({ character, className, isAnimated = true }: { character: Character | null, className: string, isAnimated?: boolean }) => {
  const [error, setError] = useState(false);
  if (!character) return null;

  const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${character.name}`;

  return (
    <div className={`w-full h-full flex items-center justify-center bg-white overflow-hidden rounded-full border-2 border-black shadow-inner ${isAnimated ? 'animate-puppet' : ''}`}>
      <img 
        src={error ? fallbackUrl : character.avatarUrl} 
        alt={character.name} 
        className={`${className} object-cover w-full h-full p-1`}
        style={{ objectPosition: 'center top' }}
        onError={() => setError(true)}
      />
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
  const [volume, setVolume] = useState(0.5);

  const [voiceConfigs, setVoiceConfigs] = useState<Record<string, { pitch: number, rate: number }>>(() => {
    const initialConfigs: Record<string, { pitch: number, rate: number }> = {};
    CHARACTERS.forEach(char => {
      initialConfigs[char.id] = { pitch: char.voicePitch, rate: char.voiceRate };
    });
    return initialConfigs;
  });

  useEffect(() => {
    return () => stopSpeech();
  }, [view]);

  useEffect(() => {
    setGlobalVolume(volume);
  }, [volume]);

  const handleGameSelect = (gameId: GameType) => {
    playTone('click');
    speak("Elige tu personaje para empezar la transmisión");
    setSelectedGame(gameId);
    setView(AppView.CHARACTER_SELECT);
  };

  const handleCharacterSelect = (char: Character) => {
    const config = voiceConfigs[char.id];
    const customizedChar = { ...char, voicePitch: config.pitch, voiceRate: config.rate };
    playTone('click');
    speak(`¡Hola soy ${customizedChar.name}! Preparados para la acción.`, customizedChar.voicePitch, customizedChar.voiceRate);
    setSelectedCharacter(customizedChar);
    setTimeout(() => setView(AppView.GAME), 1200);
  };

  const handleGameFinish = async (finalScore: number) => {
    setScore(finalScore);
    setView(AppView.RESULT);
    setLoadingFeedback(true);
    playTone('win');
    if (selectedCharacter && selectedGame) {
      const msg = await getCharacterFeedback(selectedCharacter.id, finalScore, selectedGame);
      setFeedback(msg);
      setTimeout(() => speak(msg, selectedCharacter.voicePitch, selectedCharacter.voiceRate), 500);
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
  };

  const VolumeControl = () => (
    <div className="flex items-center gap-3 bg-tv-black/90 px-5 py-2 rounded-full border-2 border-white/30 shadow-xl">
      <span className="text-white font-black text-xs uppercase tracking-tighter">Audio</span>
      <input 
        type="range" min="0" max="1" step="0.1" 
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-24 md:w-32 h-2 accent-tv-yellow bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center w-full h-full relative">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10"></div>
      
      <header className="pt-6 pb-4 text-center w-full flex flex-col items-center z-20 px-4 shrink-0">
        <div className="bg-tv-black text-white px-8 py-3 rounded-[2rem] border-[6px] border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] transform -rotate-1">
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
             <span className="text-tv-yellow">31</span> <span className="text-tv-orange">JUEGOS</span>
           </h1>
           <p className="text-[10px] font-bold tracking-[0.5em] text-tv-orange mt-1">ESTUDIO DE TELEVISIÓN</p>
        </div>
        <div className="mt-4">
           <VolumeControl />
        </div>
      </header>

      <div className="flex-1 w-full overflow-y-auto pb-28 pt-10 px-6 scrollbar-hide">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-12 max-w-6xl mx-auto items-start justify-items-center">
          {GAMES.map((game) => {
            const gameChar = CHARACTERS.find(c => c.id === game.characterId);
            return (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="group relative bg-white border-[4px] border-tv-black rounded-[2rem] flex flex-col items-center justify-center w-[130px] h-[100px] shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-visible"
              >
                <div className="absolute inset-1 rounded-[1.5rem] tv-monitor-overlay pointer-events-none z-10"></div>
                {gameChar && (
                  <div className="absolute -top-10 -right-4 w-16 h-16 z-30 group-hover:scale-110 transition-transform">
                    <CharacterAvatar character={gameChar} className="w-full h-full" />
                  </div>
                )}
                <div className="flex-1 flex items-center justify-center mb-4 relative z-0">
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{game.icon}</span>
                </div>
                <div className="absolute -bottom-4 left-2 right-2 h-10 bg-tv-black rounded-xl border-[4px] border-black flex items-center justify-center shadow-lg group-hover:bg-tv-blue transition-colors">
                  <h3 className="text-[10px] font-black text-tv-yellow uppercase tracking-tighter leading-none px-1 text-center truncate">{game.title}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 w-full h-14 bg-tv-red border-t-[6px] border-black z-40 flex items-center overflow-hidden">
        <div className="bg-tv-black text-white font-black px-4 h-full flex items-center border-r-[6px] border-black z-50">Urgente</div>
        <div className="news-ticker text-white font-bold text-xl uppercase tracking-wider flex items-center gap-10">
           {NEWS_PHRASES.map((phrase, i) => (
             <span key={i} className="flex items-center gap-10">{phrase} <span className="text-tv-yellow">★</span></span>
           ))}
        </div>
      </footer>
    </div>
  );

  const renderCharacterSelect = () => (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 h-full relative">
      <div className="z-10 mt-10 text-center">
        <div className="bg-tv-black text-white px-12 py-5 rounded-[3rem] border-[8px] border-black shadow-2xl uppercase tracking-tighter transform -rotate-1 inline-block">
          <h2 className="text-4xl md:text-6xl font-black italic">¿QUIÉN ERES?</h2>
          <p className="text-tv-yellow text-xs font-bold mt-1 tracking-[0.3em]">CASTING DE PERSONAJES</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full overflow-y-auto pb-40 pt-16 px-6 scrollbar-hide">
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => handleCharacterSelect(char)}
            className="group relative flex flex-col items-center gap-2 bg-white border-[6px] border-tv-black rounded-[2.5rem] p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="w-20 h-20 md:w-28 md:h-28 relative z-10">
              <CharacterAvatar character={char} className="w-full h-full" />
            </div>
            <span className="font-black text-sm md:text-lg uppercase text-tv-black tracking-tighter italic z-10 truncate w-full text-center">{char.name}</span>
          </button>
        ))}
      </div>
      <button onClick={goHome} className="fixed bottom-20 left-10 bg-tv-red text-white font-black px-10 py-5 rounded-full border-[8px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all text-xl uppercase italic tracking-tighter z-50">Cancelar</button>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto p-4 text-center animate-fade-in">
       <div className="bg-white border-[10px] border-tv-black p-12 rounded-[5rem] shadow-[25px_25px_0px_rgba(0,0,0,1)] relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-tv-yellow/10 to-transparent pointer-events-none"></div>
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-tv-blue text-white px-14 py-4 font-black text-4xl uppercase border-[8px] border-black rounded-3xl shadow-2xl rotate-1">¡TOP TOP TOP!</div>
          <div className="mt-12 mb-10 flex flex-col items-center">
             <div className="w-40 h-40 md:w-56 md:h-56 mb-8 transform hover:rotate-6 transition-transform">
                <CharacterAvatar character={selectedCharacter} className="w-full h-full" />
             </div>
             <div className="bg-gray-100 p-8 rounded-[3rem] border-4 border-dashed border-gray-400 max-w-2xl">
                <p className="text-3xl md:text-5xl font-black text-tv-black uppercase tracking-tighter leading-none italic">
                  "{feedback || '¡Excelente transmisión!'}"
                </p>
             </div>
             <div className="mt-8 text-6xl font-black text-tv-orange bg-tv-black px-10 py-3 rounded-2xl border-4 border-black shadow-xl">
                {score} <span className="text-sm uppercase tracking-widest align-middle">Pts</span>
             </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <button 
              onClick={() => { playTone('click'); setView(AppView.GAME); }} 
              className="bg-tv-orange text-white px-12 py-6 rounded-3xl font-black text-3xl border-[8px] border-black hover:scale-105 transition-all shadow-[10px_10px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none uppercase italic italic"
            >
              REINTENTAR
            </button>
            <button 
              onClick={goHome} 
              className="bg-tv-black text-white px-12 py-6 rounded-3xl font-black text-3xl border-[8px] border-black hover:scale-105 transition-all shadow-[10px_10px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none uppercase italic"
            >
              MENÚ INICIO
            </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-news-pattern bg-[length:80px_80px] flex items-center justify-center relative overflow-hidden">
       <div className="absolute inset-0 tv-static z-[100] pointer-events-none"></div>
       <div className="absolute inset-0 pointer-events-none z-[90] bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>
       <div className="z-10 w-full h-full flex flex-col overflow-hidden">
        {view === AppView.MENU && renderMenu()}
        {view === AppView.CHARACTER_SELECT && renderCharacterSelect()}
        {view === AppView.GAME && selectedGame && (
          <div className="flex-1 flex flex-col h-full py-4 px-4 overflow-hidden">
            <div className="mb-4 flex justify-between items-center bg-tv-black text-white px-6 py-2 rounded-[1.5rem] border-[4px] border-white shadow-2xl mx-2 shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8">
                     <CharacterAvatar character={selectedCharacter} className="w-full h-full" isAnimated={false} />
                  </div>
                  <span className="font-black uppercase tracking-tighter text-sm text-tv-yellow truncate max-w-[100px]">{selectedGame}</span>
               </div>
               <div className="flex items-center gap-4">
                 <VolumeControl />
                 <button onClick={goHome} className="bg-tv-red px-4 py-1 rounded-full font-black text-[10px] border-[2px] border-white uppercase italic tracking-tighter hover:scale-105 transition-transform">Salir</button>
               </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <div className="absolute inset-0 tv-monitor-overlay pointer-events-none z-20 rounded-[3rem]"></div>
               <ActiveGame type={selectedGame} onFinish={handleGameFinish} volume={volume} />
            </div>
          </div>
        )}
        {view === AppView.RESULT && renderResult()}
       </div>
    </div>
  );
}
