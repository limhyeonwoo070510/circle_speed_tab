/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, VolumeX, Trophy, Sparkles, HelpCircle, Settings, ArrowLeft } from 'lucide-react';
import { Difficulty, GameSettings } from '../types';
import { audioService } from '../utils/audio';
import SettingsPreview from './SettingsPreview';

interface MainMenuProps {
  initialDifficulty: Difficulty;
  initialSoundEnabled: boolean;
  initialSettings: GameSettings;
  onStartGame: (difficulty: Difficulty, soundEnabled: boolean, settings: GameSettings) => void;
}

type MenuScreen = 'MAIN' | 'SETTINGS';

export default function MainMenu({ 
  initialDifficulty, 
  initialSoundEnabled, 
  initialSettings, 
  onStartGame 
}: MainMenuProps) {
  const [activeScreen, setActiveScreen] = useState<MenuScreen>('MAIN');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSoundEnabled);
  const [highScore, setHighScore] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Custom Settings state
  const [startLevel, setStartLevel] = useState<number>(initialSettings.startLevel || 1);
  const [shrinkDuration, setShrinkDuration] = useState<number>(initialSettings.shrinkDuration);
  const [speedUpEffectEnabled, setSpeedUpEffectEnabled] = useState<boolean>(
    initialSettings.speedUpEffectEnabled !== false
  );

  useEffect(() => {
    // Load local high scores
    const savedScore = localStorage.getItem('circle_rhythm_high_score');
    const savedCombo = localStorage.getItem('circle_rhythm_max_combo');
    if (savedScore) setHighScore(parseInt(savedScore, 10));
    if (savedCombo) setMaxCombo(parseInt(savedCombo, 10));
  }, []);

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
    audioService.play('good');
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    audioService.setMute(!nextVal);
    if (nextVal) {
      audioService.play('perfect');
    }
  };

  const handleStart = () => {
    audioService.setMute(!soundEnabled);
    audioService.play('start');
    
    onStartGame(difficulty, soundEnabled, {
      startLevel,
      shrinkDuration,
      speedUpEffectEnabled,
    });
  };

  return (
    <div id="main-menu-container" className="w-full max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-md text-white overflow-hidden relative min-h-[500px] flex flex-col justify-between">
      {/* Absolute Background Accent Elements */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {activeScreen === 'MAIN' ? (
          <motion.div
            key="main-screen"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Title Header */}
              <div className="text-center mb-6 relative z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto rounded-full border-4 border-dashed border-cyan-500/40 p-1 flex items-center justify-center mb-3"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                  CIRCLE SPEED TAP
                </h1>
              </div>

              {/* High Score Panel */}
              {(highScore > 0 || maxCombo > 0) && (
                <div className="mb-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex justify-around text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-[11px] font-medium mb-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>최고 점수</span>
                    </div>
                    <span className="text-lg font-bold font-mono text-slate-100">{highScore.toLocaleString()}</span>
                  </div>
                  <div className="w-px bg-slate-800/80" />
                  <div>
                    <div className="flex items-center justify-center gap-1.5 text-orange-400 text-[11px] font-medium mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>최고 콤보</span>
                    </div>
                    <span className="text-lg font-bold font-mono text-slate-100">{maxCombo} Combo</span>
                  </div>
                </div>
              )}

              {/* Difficulty Selector (Determines circle sizing) */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-xs font-medium text-slate-300">
                    노트 크기 설정
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map((diff) => {
                    const isActive = difficulty === diff;
                    let activeStyle = '';
                    let labelText = '';
                    let labelDesc = '';
                    
                    if (diff === 'EASY') {
                      activeStyle = isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/80 shadow-emerald-500/10' : 'hover:bg-slate-800/50 hover:border-slate-700';
                      labelText = 'EASY (큼)';
                    } else if (diff === 'NORMAL') {
                      activeStyle = isActive ? 'bg-sky-500/20 text-sky-300 border-sky-500/80 shadow-sky-500/10' : 'hover:bg-slate-800/50 hover:border-slate-700';
                      labelText = 'NORMAL';
                    } else {
                      activeStyle = isActive ? 'bg-rose-500/20 text-rose-300 border-rose-500/80 shadow-rose-500/10' : 'hover:bg-slate-800/50 hover:border-slate-700';
                      labelText = 'HARD (작음)';
                    }

                    return (
                      <button
                        key={diff}
                        id={`btn-diff-${diff.toLowerCase()}`}
                        onClick={() => handleDifficultyChange(diff)}
                        className={`py-2 px-1.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          isActive ? 'border-2 font-bold' : 'border-slate-800 bg-slate-950/20 text-slate-400'
                        } ${activeStyle}`}
                      >
                        <div className="text-xs tracking-wide font-semibold">{labelText}</div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">{labelDesc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Settings & Help Actions / Custom settings page gate */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  id="btn-sound-toggle"
                  onClick={toggleSound}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-800/50 hover:border-slate-700 transition cursor-pointer text-slate-300 text-xs"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>소리 지연 켜짐</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span>소리 지연 꺼짐</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-tutorial-toggle"
                  onClick={() => {
                    setShowTutorial(!showTutorial);
                    audioService.play('good');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border transition cursor-pointer text-xs ${
                    showTutorial 
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold' 
                      : 'border-slate-800 bg-slate-950/30 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>게임 규칙 {showTutorial ? '닫기' : '보기'}</span>
                </button>
              </div>

              {/* Tutorial panel */}
              {showTutorial && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 p-3.5 bg-slate-950/80 rounded-2xl border border-purple-900/30 text-[11px] font-sans text-slate-300 leading-relaxed space-y-2 relative"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold shrink-0 text-[10px]">1</span>
                    <p>화면의 랜덤 위치에 수축 완료 시점까지 남은 시간(초)이 적힌 <strong className="text-cyan-300">타격 동그라미</strong>가 출현합니다.</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold shrink-0 text-[10px]">2</span>
                    <p>안쪽 방향으로 외곽 <strong className="text-sky-300">수축 원</strong>이 점차 쪼그라듭니다.</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold shrink-0 text-[10px]">3</span>
                    <p>외곽 원 수축이 완료되는 시점을 기준으로 <strong className="text-yellow-300">정확한 판정선(Perfect ±75ms / Good ±200ms)</strong>에 맞춰 클릭하세요!</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold shrink-0 text-[10px]">4</span>
                    <p>연속 판정에 성공할 때마다 <strong className="text-amber-400">콤보가 쌓여</strong> HP가 회복되고 점수가 누적됩니다.</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold shrink-0 text-[10px]">5</span>
                    <p>시간이 경과할수록 <strong className="text-cyan-400">속도가 빨라집니다</strong>. 속도가 빠를수록 성공 시 획득하는 <strong className="text-purple-400">점수 증가 폭도 대폭 증가</strong>합니다!</p>
                  </div>
                  <p className="text-[9.5px] text-slate-500 border-t border-slate-800/60 pt-2.5 text-right">
                    ※ 빈 바닥을 잘못 클릭하면 백파이어(HP 하락) 및 콤보 초기화가 발생합니다.
                  </p>
                </motion.div>
              )}

              {/* Settings Toggle Trigger Button */}
              <button
                id="btn-goto-settings"
                onClick={() => {
                  setActiveScreen('SETTINGS');
                  audioService.play('good');
                }}
                className="w-full mb-5 py-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-cyan-400"
              >
                <Settings className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                사용자 설정 및 프리뷰
              </button>
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="btn-game-start"
              onClick={handleStart}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-2xl font-bold tracking-wider text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              시작하기 (GAME START)
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="settings-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Settings Header bar containing Back button */}
              <div className="flex items-center justify-between mb-5">
                <button
                  id="btn-settings-back"
                  onClick={() => {
                    setActiveScreen('MAIN');
                    audioService.play('good');
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950/50 hover:bg-slate-850 border border-slate-800 text-xs text-slate-400 transition cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>돌아가기</span>
                </button>
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider">GAME SETTINGS</span>
              </div>

              {/* Title inside settings */}
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" /> 
                  사용자 정의 시작 속도 설정
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  노트의 초기 속도 레벨과 수축 시간을 미세 조정하여 취향에 맞게 커스텀해보세요.
                </p>
              </div>

              {/* Sliders Area */}
              <div className="space-y-4 mb-5 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                {/* Slider 1: Starting Speed Level */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">1. 시작 속도 레벨 (Starting Speed Level)</span>
                    <span className="text-cyan-400 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Lv.{startLevel}</span>
                  </div>
                  <input
                    type="range"
                    id="slider-start-level"
                    min={1}
                    max={10}
                    step={1}
                    value={startLevel}
                    onChange={(e) => setStartLevel(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Lv.1 (기본)</span>
                    <span>Lv.5 (숙련)</span>
                    <span>Lv.10 (극한 특수)</span>
                  </div>
                </div>

                {/* Slider 2: Shrink contracts duration */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">2. 윤곽선 수축 소요 시간 (Shrink Duration)</span>
                    <span className="text-orange-400 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{shrinkDuration}ms</span>
                  </div>
                  <input
                    type="range"
                    id="slider-shrink-duration"
                    min={250}
                    max={2000}
                    step={50}
                    value={shrinkDuration}
                    onChange={(e) => setShrinkDuration(parseInt(e.target.value, 10))}
                    className="w-full accent-orange-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>250ms (빛의 수축)</span>
                    <span>1100ms (기본)</span>
                    <span>2000ms (여유로운 박자)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal pt-1 flex items-start gap-1">
                    <span className="text-orange-400 shrink-0">※</span>
                    <span>설정된 속도 레벨에서부터 게임이 시작되며 시간이 흐를 수록 속도 레벨이 계속해서 상승합니다.</span>
                  </p>
                </div>

                {/* Switch Row: Speed-Up Notification Overlay */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-300 font-medium">3. 속도 레벨업 효과 보이기 (Show Speed-Up Alert)</span>
                    <span className="text-[10px] text-slate-500">비활성화 시 12초마다 진행되는 속도 가속음 및 화면 중앙 배너를 숨깁니다.</span>
                  </div>
                  <button
                    type="button"
                    id="toggle-speedup-effect"
                    onClick={() => {
                      setSpeedUpEffectEnabled(!speedUpEffectEnabled);
                      audioService.play('good');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold tracking-wider transition-all border text-xs cursor-pointer ${
                      speedUpEffectEnabled
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-500'
                    }`}
                  >
                    {speedUpEffectEnabled ? '표시함 (ON)' : '숨김 (OFF)'}
                  </button>
                </div>
              </div>

              {/* Dynamic Visual Live Demonstration Area */}
              <div className="mb-5">
                <SettingsPreview 
                  startLevel={startLevel} 
                  shrinkDuration={shrinkDuration} 
                  difficulty={difficulty} 
                />
              </div>
            </div>

            {/* Back & Apply button combined at bottom */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="btn-save-settings"
              onClick={() => {
                setActiveScreen('MAIN');
                audioService.play('perfect');
              }}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold tracking-wide text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40"
            >
              설정값 적용 후 메인으로
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
