/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import Playfield from './components/Playfield';
import GameOver from './components/GameOver';
import { GameStage, Difficulty, GameStats, GameSettings } from './types';

export default function App() {
  const [stage, setStage] = useState<GameStage>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [settings, setSettings] = useState<GameSettings>({
    startLevel: 1,
    shrinkDuration: 1100,
  });
  const [finalStats, setFinalStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    level: 1,
    combo: 0,
    maxCombo: 0,
    hp: 100,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    totalNotesSpawned: 0,
  });

  const handleStartGame = (selectedDiff: Difficulty, soundOn: boolean, customSettings: GameSettings) => {
    setDifficulty(selectedDiff);
    setSoundEnabled(soundOn);
    setSettings(customSettings);
    setStage('PLAYING');
  };


  const handleGameOver = (stats: GameStats) => {
    setFinalStats(stats);
    setStage('GAMEOVER');
  };

  const handleRestart = () => {
    setStage('PLAYING');
  };

  const handleBackToMenu = () => {
    setStage('MENU');
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 bg-radial-gradient flex items-center justify-center p-4 md:p-8 font-sans antialiased text-slate-200 select-none overflow-x-hidden">
      {/* Background ambient lighting blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[25%] -translate-x-1/2 w-[35rem] h-[35rem] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[25%] translate-x-1/2 w-[35rem] h-[35rem] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl z-10">
        {stage === 'MENU' && (
          <MainMenu
            initialDifficulty={difficulty}
            initialSoundEnabled={soundEnabled}
            initialSettings={settings}
            onStartGame={handleStartGame}
          />
        )}

        {stage === 'PLAYING' && (
          <Playfield
            difficulty={difficulty}
            soundEnabled={soundEnabled}
            settings={settings}
            onGameOver={handleGameOver}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {stage === 'GAMEOVER' && (
          <GameOver
            stats={finalStats}
            difficulty={difficulty}
            onRestart={handleRestart}
            onGoToMenu={handleBackToMenu}
          />
        )}
      </div>
    </main>
  );
}
