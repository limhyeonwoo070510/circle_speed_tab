/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Volume2, VolumeX, Pause, Play, RotateCw } from 'lucide-react';
import { GameNote, HitEffect, GameStats, Difficulty, GameSettings } from '../types';
import { audioService } from '../utils/audio';

interface PlayfieldProps {
  difficulty: Difficulty;
  soundEnabled: boolean;
  settings: GameSettings;
  onGameOver: (finalStats: GameStats) => void;
  onBackToMenu: () => void;
}

export default function Playfield({ difficulty, soundEnabled, settings, onGameOver, onBackToMenu }: PlayfieldProps) {
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    level: settings.startLevel || 1,
    combo: 0,
    maxCombo: 0,
    hp: 100,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    totalNotesSpawned: 0,
  });

  const [feverLevel, setFeverLevel] = useState<number>(1);
  const [feverGauge, setFeverGauge] = useState<number>(0);
  const [notes, setNotes] = useState<GameNote[]>([]);
  const [effects, setEffects] = useState<HitEffect[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [localMute, setLocalMute] = useState<boolean>(!soundEnabled);
  
  // Countdown settings
  const [countdown, setCountdown] = useState<number | string>(3);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
  
  const [misfireFlash, setMisfireFlash] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());
  
  // Safe refs to avoid stale closures in listeners
  const statsRef = useRef<GameStats>(stats);
  const notesRef = useRef<GameNote[]>(notes);
  const feverLevelRef = useRef<number>(1);
  const feverGaugeRef = useRef<number>(0);
  const noteCounterRef = useRef<number>(1);
  const timerRef = useRef<number>(0); // keeps track of play elapsed time

  // Keep refs up-to-date
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    feverLevelRef.current = feverLevel;
  }, [feverLevel]);

  useEffect(() => {
    feverGaugeRef.current = feverGauge;
  }, [feverGauge]);

  const handleRestart = () => {
    setStats({
      score: 0,
      coins: 0,
      level: settings.startLevel || 1,
      combo: 0,
      maxCombo: 0,
      hp: 100,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      totalNotesSpawned: 0,
    });
    setFeverLevel(1);
    setFeverGauge(0);
    setNotes([]);
    setEffects([]);
    setIsPaused(false);
    setCountdown(3);
    setIsCountingDown(true);
    noteCounterRef.current = 1;
    audioService.play('start');
  };

  // Handle local mute mutations
  const toggleMute = () => {
    const nextMute = !localMute;
    setLocalMute(nextMute);
    audioService.setMute(nextMute);
    if (!nextMute) {
      audioService.play('perfect');
    }
  };

  // Helper to spawn visual feedback text floating up
  const spawnHitEffect = (x: number, y: number, type: 'perfect' | 'good' | 'miss' | 'early' | 'late', text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setEffects(prev => [...prev, { id, x, y, type, text, createdAt: Date.now() }]);
    
    // Auto-remove effect after 600ms (1200ms for prominent FEVER or SPEED UP announcements)
    const isSpecial = text.includes('FEVER') || text.includes('SPEED UP');
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, isSpecial ? 1200 : 600);
  };

  // 1. STAGE PREPARATION - COUNTDOWN EFFECT
  useEffect(() => {
    if (!isCountingDown) return;
    
    // Play start click
    audioService.play('good');
    
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 3) {
          audioService.play('good');
          return 2;
        }
        if (prev === 2) {
          audioService.play('good');
          return 1;
        }
        if (prev === 1) {
          audioService.play('start');
          return 'START!';
        }
        // If 'START!', finish countdown
        clearInterval(countInterval);
        setIsCountingDown(false);
        return 0;
      });
    }, 900);

    return () => clearInterval(countInterval);
  }, [isCountingDown]);

  // 2. MAIN RUNTIME TICK LOOP (checks for missed expired circles)
  useEffect(() => {
    if (isCountingDown || isPaused) return;

    let animFrame: number;
    const updateLoop = () => {
      const now = Date.now();
      setNowTime(now);
      
      setNotes(prevNotes => {
        let hpDeduction = 0;
        let expiredCount = 0;
        
        const filtered = prevNotes.filter(note => {
          // Timeout tolerance of 300ms matching the extra duration (LATE tolerance of +300ms)
          if (!note.clicked && now > note.targetTime + 300) {
            hpDeduction += 15; // Miss penalty
            expiredCount++;
            
            // Spawn float MISS effect
            spawnHitEffect(note.x, note.y, 'miss', 'MISS!');
            return false; // Filter out expired notes
          }
          return true;
        });

        if (expiredCount > 0) {
          audioService.play('miss');
          setFeverLevel(prev => Math.max(1, prev - 1));
          setFeverGauge(0);
          setStats(prev => {
            const nextHp = Math.max(0, prev.hp - hpDeduction);
            return {
              ...prev,
              hp: nextHp,
              combo: 0, // Lose combo
              missCount: prev.missCount + expiredCount,
            };
          });
        }

        return filtered;
      });

      animFrame = requestAnimationFrame(updateLoop);
    };

    animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [isCountingDown, isPaused]);

  // 3. HP HEALTH-BAR GAMEOVER CHECKER
  useEffect(() => {
    if (stats.hp <= 0 && !isCountingDown) {
      onGameOver(stats);
    }
  }, [stats.hp, isCountingDown]);

  // 4. LEVEL & GAME PROGRESS SPEED TIGHTENER (Speed increases every 12 seconds)
  useEffect(() => {
    if (isCountingDown || isPaused) return;

    const levelTimer = setInterval(() => {
      setStats(prev => {
        const nextLevel = prev.level + 1;
        // Play indicator cue for leveling up
        if (settings.speedUpEffectEnabled !== false) {
          audioService.play('combo');
          // Spawn center screen SPEED UP announcement
          spawnHitEffect(50, 50, 'perfect', `⚡ SPEED UP! Lv.${nextLevel} ⚡`);
        }
        return {
          ...prev,
          level: nextLevel,
        };
      });
    }, 12000);

    return () => clearInterval(levelTimer);
  }, [isCountingDown, isPaused, settings.speedUpEffectEnabled]);

  // 5. NOTE GENERATOR / SPAWNING SEQUENCE
  const spawnNote = () => {
    // Determine minimum distance threshold by difficulty to make sure notes don't overlap
    let minDistance = 14; 
    if (difficulty === 'EASY') {
      minDistance = 18;
    } else if (difficulty === 'HARD') {
      minDistance = 11;
    }

    let x = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    let y = Math.floor(Math.random() * 65) + 15; // 15% to 80%

    // Get current unclicked notes
    const activeNotes = notesRef.current.filter(n => !n.clicked);

    if (activeNotes.length > 0) {
      let bestX = x;
      let bestY = y;
      let maxMinDist = -1;

      // Try multiple times to find a completely safe space
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidateX = Math.floor(Math.random() * 70) + 15;
        const candidateY = Math.floor(Math.random() * 65) + 15;
        
        let minDistToAny = Infinity;
        for (const note of activeNotes) {
          const dx = candidateX - note.x;
          const dy = candidateY - note.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistToAny) {
            minDistToAny = dist;
          }
        }

        // If the position is safe (does not overlap), we can select it immediately
        if (minDistToAny >= minDistance) {
          bestX = candidateX;
          bestY = candidateY;
          maxMinDist = minDistToAny;
          break;
        }

        // Keep track of the candidate position that is the furthest away from existing ones
        if (minDistToAny > maxMinDist) {
          maxMinDist = minDistToAny;
          bestX = candidateX;
          bestY = candidateY;
        }
      }

      x = bestX;
      y = bestY;
    }
    
    // Choose specific duration based on user Settings - CONSTANT throughout
    const duration = settings.shrinkDuration;

    const now = Date.now();
    const id = `${now}-${Math.random()}`;
    const number = noteCounterRef.current;
    
    // Loop sequence 1-4 for clarity
    noteCounterRef.current = (noteCounterRef.current % 4) + 1;

    const newNote: GameNote = {
      id,
      x,
      y,
      createdAt: now,
      targetTime: now + duration,
      duration,
      number,
      clicked: false,
    };

    setNotes(prev => [...prev, newNote]);
    setStats(prev => ({
      ...prev,
      totalNotesSpawned: prev.totalNotesSpawned + 1,
    }));
  };

  // Return spawning delay based on level progression with an aggressive decrease curve
  const getSpawnInterval = (lvl: number): number => {
    // Continuous speed tightening without cap: uses exponential decay (decreases by 18% per level)
    const multiplier = Math.max(0.06, Math.pow(0.82, lvl - 1));
    return Math.max(120, Math.round(1200 * multiplier));
  };

  useEffect(() => {
    if (isCountingDown || isPaused) return;

    let spawnTimeout: NodeJS.Timeout;

    const runSpawning = () => {
      spawnNote();
      const currentInterval = getSpawnInterval(stats.level);
      spawnTimeout = setTimeout(runSpawning, currentInterval);
    };

    // Begin sequence
    const currentInterval = getSpawnInterval(stats.level);
    spawnTimeout = setTimeout(runSpawning, currentInterval);

    return () => clearTimeout(spawnTimeout);
  }, [isCountingDown, isPaused, stats.level, difficulty]);

  // 6. TARGET NOTE TAP / CLICK RESOLVER
  const handleNoteHit = (e: React.PointerEvent, hitNoteId: string) => {
    e.stopPropagation(); // critical: prevents leaking coordinates to empty background playfield click
    if (isPaused || isCountingDown) return;

    const now = Date.now();
    const clickedNote = notesRef.current.find(n => n.id === hitNoteId);
    if (!clickedNote || clickedNote.clicked) return;

    // Calculate latency offset from perfect alignment targetTime
    const diff = now - clickedNote.targetTime;
    const absDiff = Math.abs(diff);

    // Filter clicked note immediately from display
    setNotes(prev => prev.filter(n => n.id !== hitNoteId));

    if (absDiff <= 200) {
      // SUCCESSFUL HIT (within ±200ms tolerance)
      const isPerfect = absDiff <= 75; // Perfect is within ±75ms
      const rating = isPerfect ? 'perfect' : 'good';
      const judgmentText = isPerfect ? 'PERFECT!' : 'GOOD!';
      
      // HP Recovery multipliers. "콤보를 이어갈수록 hp가 조금씩 회복되게 해줘."
      // Reward combo strings: base recovery is 3. Add 1 extra recovery for every 10 combos.
      const comboBonus = Math.floor(statsRef.current.combo / 10);
      const hpRecovery = isPerfect 
        ? Math.min(15, 6 + comboBonus) 
        : Math.min(10, 3 + comboBonus);

      audioService.play(rating);

      const activeFeverLevel = feverLevelRef.current;
      const comboIncrement = activeFeverLevel;

      // Raise Fever gauge on PERFECT hit
      if (isPerfect) {
        const nextGauge = feverGaugeRef.current + 20;
        if (nextGauge >= 100) {
          if (activeFeverLevel < 5) {
            const nextLvl = activeFeverLevel + 1;
            setFeverLevel(nextLvl);
            setFeverGauge(0);
            audioService.play('combo');
          } else {
            setFeverGauge(100); // capped
          }
        } else {
          setFeverGauge(nextGauge);
        }
      }

      // Difficulty Score Multiplier (EASY: 0.7x, NORMAL: 1.0x, HARD: 1.4x)
      const diffMultiplier = difficulty === 'EASY' ? 0.7 : difficulty === 'NORMAL' ? 1.0 : 1.4;
      const currentInterval = getSpawnInterval(stats.level);
      // Faster interval reward: higher speed multipliers (e.g., 1200 / 400ms = x3.0 score!)
      const speedMultiplier = Math.max(0.4, Number((1200 / currentInterval).toFixed(2)));
      // Multiplier bonus: 1.5% increase per combo point to make scoring rewarding as combo mounts (capped at 100 combo max)
      const cappedCombo = Math.min(100, stats.combo);
      const comboMultiplier = 1 + (cappedCombo * 0.015);
      const basePoints = isPerfect ? 300 : 100;
      const addedScore = Math.round(basePoints * stats.level * speedMultiplier * comboMultiplier * diffMultiplier);

      setStats(prev => {
        const nextCombo = prev.combo + comboIncrement;
        const nextMaxCombo = Math.max(prev.maxCombo, nextCombo);
        const nextHp = Math.min(100, prev.hp + hpRecovery);

        return {
          ...prev,
          score: prev.score + addedScore,
          hp: nextHp,
          combo: nextCombo,
          maxCombo: nextMaxCombo,
          perfectCount: prev.perfectCount + (isPerfect ? 1 : 0),
          goodCount: prev.goodCount + (isPerfect ? 0 : 1),
        };
      });

      spawnHitEffect(
        clickedNote.x, 
        clickedNote.y, 
        rating, 
        judgmentText
      );
    } else {
      // FAULTY TIMING - TOO EARLY CLICK
      audioService.play('miss');
      
      // Reduce Fever level on timing failure (combo break)
      setFeverLevel(prev => Math.max(1, prev - 1));
      setFeverGauge(0);

      setStats(prev => ({
        ...prev,
        hp: Math.max(0, prev.hp - 15),
        combo: 0,
        missCount: prev.missCount + 1,
      }));

      const isEarly = diff < 0;
      spawnHitEffect(
        clickedNote.x, 
        clickedNote.y, 
        isEarly ? 'early' : 'late', 
        isEarly ? 'TOO EARLY!' : 'TOO LATE!'
      );
    }
  };

  // 7. EMPTY AREA MISFIRE CLICK DETECTOR
  const handleEmptyPlayfieldClick = (e: React.PointerEvent) => {
    if (isPaused || isCountingDown) return;

    // If there are zero active notes on screen, ignore misfire (perfect safety grace window)
    if (notesRef.current.length === 0) {
      return;
    }

    // Trigger error sound and flash
    audioService.play('miss');
    setMisfireFlash(true);
    setTimeout(() => setMisfireFlash(false), 120);

    // Reduce Fever level on misfire combo penalty
    setFeverLevel(prev => Math.max(1, prev - 1));
    setFeverGauge(0);

    // Identify the absolute oldest note currently on screen (the one they should have pressed)
    const oldestNote = [...notesRef.current].sort((a, b) => a.targetTime - b.targetTime)[0];

    // Instantly delete this note from active lists
    setNotes(prev => prev.filter(n => n.id !== oldestNote.id));

    // Deduct standard miss HP (15 HP) and cancel current combo
    setStats(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - 15),
      combo: 0,
      missCount: prev.missCount + 1,
    }));

    // Convert click client coordinates back to percentage playfield relative position
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    
    spawnHitEffect(px, py, 'early', 'MISFIRE!');
    
    // Play a secondary visual "MISS!" precisely on the vanished note coordinates for intuitive feedback
    spawnHitEffect(oldestNote.x, oldestNote.y, 'miss', 'MISS!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* 1. HUD STATUS PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white z-10 shadow-lg">
        {/* Left Side: Basic Statistics */}
        <div className="flex items-center gap-5 justify-between md:justify-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">SCORE</span>
            <motion.div 
              key={stats.score}
              animate={{ scale: [1, 1.15, 1] }}
              className="text-2xl font-black font-mono bg-gradient-to-r from-cyan-400 to-sky-200 bg-clip-text text-transparent"
            >
              {stats.score.toLocaleString()}
            </motion.div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">SPEED</span>
            <span className="text-lg font-bold font-mono text-pink-400 flex items-center gap-1">
              Lv.{stats.level} 
              <span className="text-[10px] font-sans font-normal text-slate-500">
                ({difficulty})
              </span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">MAX COMBO</span>
            <span className="text-lg font-bold font-mono text-teal-300">{stats.maxCombo}x</span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col min-w-[120px] md:min-w-[130px]">
            <div className="flex justify-between items-center text-[10px] font-mono text-amber-400 tracking-wider font-bold">
              <span className="flex items-center gap-1">
                <span>🔥 FEVER Lv.{feverLevel}</span>
              </span>
              <span className="text-[9px] text-amber-300">+{feverLevel} Combo/hit</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden mt-1 relative p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feverGauge}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>
          </div>
        </div>

        {/* HP Health Bar Indicator */}
        <div className="flex-1 md:max-w-xs flex items-center gap-3">
          <motion.div
            animate={stats.hp < 30 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className={`${stats.hp < 30 ? 'text-rose-500' : 'text-cyan-400'}`}
          >
            <Heart className="w-5 h-5 fill-current" />
          </motion.div>
          
          <div className="flex-grow bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ 
                width: `${stats.hp}%`,
                backgroundColor: stats.hp < 30 ? '#ef4444' : stats.hp < 60 ? '#f59e0b' : '#06b6d4'
              }}
              className="h-full rounded-full shadow-inner transition-colors duration-300"
            />
          </div>
          <span className="font-mono text-sm font-bold text-slate-300 min-w-[2.5rem] text-right">{stats.hp}%</span>
        </div>

        {/* Action controllers (Pause, Mute, Exit) */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={isCountingDown}
            className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition border border-slate-700/50 cursor-pointer disabled:opacity-40"
            title={isPaused ? '이어하기' : '일시정지'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition border border-slate-700/50 cursor-pointer"
            title="소리 설정"
          >
            {localMute ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              audioService.play('miss');
              onGameOver(statsRef.current);
            }}
            className="px-3.5 py-2.5 bg-rose-550/15 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 rounded-xl text-xs font-bold font-sans transition cursor-pointer"
          >
            종료
          </button>
        </div>
      </div>

      {/* 2. CENTRAL ACTIVE PLAYFIELD BOARD */}
      <div 
        onPointerDown={handleEmptyPlayfieldClick}
        className={`w-full h-[62vh] min-h-[400px] md:h-[550px] rounded-3xl bg-slate-950 relative overflow-hidden select-none shadow-2xl transition-all duration-150 border-2 ${
          misfireFlash 
            ? 'border-rose-500 shadow-rose-500/10' 
            : stats.hp < 30 
              ? 'border-rose-900/60 animate-pulse' 
              : 'border-slate-800/80 shadow-cyan-500/5'
        }`}
        style={{ cursor: 'crosshair' }}
      >
        {/* Subtle grid pattern background alignment */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />

        {/* Preparation startup screen cover */}
        <AnimatePresence>
          {isCountingDown && (
            <motion.div 
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="max-w-xs space-y-3">
                <span className="text-xs font-mono text-cyan-400 tracking-widest block">READY PLAYER ONE</span>
                <h3 className="text-white text-sm font-sans text-slate-400 leading-relaxed">
                  화면 전체를 활용합니다. 마음의 준비를 하세요...
                </h3>
              </div>
              
              <motion.div
                key={countdown}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 2.0, opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="text-7xl font-extrabold font-mono mt-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paused state dialog cover */}
        {isPaused && !isCountingDown && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-4">
            <h3 className="text-2xl font-black text-white tracking-wide mb-2">게임 일시중지됨</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6">여유를 갖고 박자를 고른 뒤 계속 진행해보세요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-3 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                계속 하기
              </button>
              <button
                onClick={() => {
                  if (confirm('처음부터 다시 즐길까요?')) {
                    handleRestart();
                  }
                }}
                className="px-5 py-3 bg-slate-800 text-slate-200 border border-slate-700/80 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                다시 시작
              </button>
            </div>
          </div>
        )}

        {/* Combo Overlay displayed right in the background */}
        {stats.combo > 0 && !isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <motion.div 
              key={stats.combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ 
                scale: [0.85, 1.12, 1],
                opacity: Math.min(0.35, 0.15 + stats.combo * 0.005)
              }}
              transition={{ duration: 0.2 }}
              className="text-center font-sans"
            >
              <span className="text-8xl font-black font-mono tracking-tighter text-cyan-500 block">
                {stats.combo}
              </span>
              <span className="text-[11px] font-mono tracking-[0.35em] text-cyan-300/80 font-semibold block">
                COMBO
              </span>

              {/* Fever level indicator under combo */}
              <div className="text-sm font-sans font-bold text-amber-400 mt-2 tracking-wide flex items-center justify-center gap-1.5">
                <span>🔥 FEVER Lv.{feverLevel}</span>
              </div>
              
              {stats.combo >= 10 && (
                <div className="text-[10px] font-sans text-amber-300 font-bold tracking-wider mt-1.5 animate-pulse">
                  HP 회복 보너스 +{Math.floor(stats.combo / 10)}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 3. ACTIVE SCROLLABLE CIRCLES LAYOVER */}
        <div className="absolute inset-0 z-10">
          {notes.map((note) => {
            // Dynamic Sizing Configurations: Difficulty decides physical note dimensions
            const sizeConfig = {
              EASY: {
                wrapperClass: "w-[96px] h-[96px] -ml-[48px] -mt-[48px]",
                innerClass: "w-[80px] h-[80px]",
              },
              NORMAL: {
                wrapperClass: "w-[76px] h-[76px] -ml-[38px] -mt-[38px]",
                innerClass: "w-[60px] h-[60px]",
              },
              HARD: {
                wrapperClass: "w-[56px] h-[56px] -ml-[28px] -mt-[28px]",
                innerClass: "w-11 h-11",
              },
            };
            const activeSize = sizeConfig[difficulty] || sizeConfig.NORMAL;

            const isVisualExpired = nowTime > note.targetTime + 100;

            return (
              <div
                key={note.id}
                className={`absolute flex items-center justify-center transition-transform hover:scale-102 active:scale-95 touch-none ${activeSize.wrapperClass}`}
                style={{
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  zIndex: (1000 - note.number) + 10,
                }}
              >
                {/* 1.1x transparent hitbox overlay zone */}
                <div
                  onPointerDown={(e) => handleNoteHit(e, note.id)}
                  className="absolute w-[110%] h-[110%] rounded-full cursor-pointer z-35 bg-transparent"
                />

                {!isVisualExpired && (
                  <>
                    {/* 1. Target timing outer ring (shrinking approach circle) */}
                    <motion.div
                      initial={{ scale: 3.2, opacity: 0.4 }}
                      animate={{ scale: 1.0, opacity: 1.0 }}
                      transition={{ duration: note.duration / 1000, ease: "linear" }}
                      className="absolute inset-[1px] rounded-full border-2 border-dashed border-cyan-400 pointer-events-none"
                      style={{
                        boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)',
                      }}
                    />

                    {/* Perfect flash ring marker inside */}
                    <div className="absolute inset-[-1px] rounded-full border border-teal-500/30 animate-ping pointer-events-none" />

                    {/* 2. Core inner Target Circle */}
                    <div 
                      className={`rounded-full bg-gradient-to-tr from-cyan-950 via-cyan-850 to-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-lg relative overflow-hidden select-none ${activeSize.innerClass}`}
                      style={{
                        boxShadow: '0 0 14px rgba(6, 182, 212, 0.5), inset 0 0 10px rgba(6, 182, 212, 0.2)',
                      }}
                    >
                      <span className="text-white font-extrabold font-mono text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {Math.max(0, (note.targetTime - nowTime) / 1000).toFixed(1)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. PERFORMANCE COMMENTS & JUDGMENT FLOATERS MAP */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <AnimatePresence>
            {effects.map((fx) => {
              const isFever = fx.text.includes('FEVER');
              const isSpeedUp = fx.text.includes('SPEED UP');
              const isSpecial = isFever || isSpeedUp;

              if (isSpecial) {
                const gradientClass = isFever
                  ? "from-amber-600 via-orange-500 to-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                  : "from-cyan-600 via-sky-500 to-indigo-500 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]";

                // Slightly separate them vertically in case they occur together
                const marginClass = isFever ? "-mt-[60px]" : "mt-[10px]";

                return (
                  <motion.div
                    key={fx.id}
                    initial={{ opacity: 0, scale: 0.5, y: 30 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.2, 1.2, 1], y: [30, 0, 0, -30] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, times: [0, 0.15, 0.85, 1] }}
                    className={`absolute left-1/2 top-1/2 -ml-[150px] ${marginClass} w-[300px] text-center pointer-events-none select-none z-40`}
                  >
                    <span className={`inline-block px-5 py-3 rounded-2xl bg-gradient-to-r ${gradientClass} border-2 text-base sm:text-lg font-black text-white tracking-widest`}>
                      {fx.text}
                    </span>
                  </motion.div>
                );
              }

              let textColors = 'text-white';
              let textShadow = '0 0 8px rgba(255,255,255,0.6)';

              if (fx.type === 'perfect') {
                textColors = 'text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]';
                textShadow = '0 0 12px rgba(234,179,8,0.7)';
              } else if (fx.type === 'good') {
                textColors = 'text-green-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]';
                textShadow = '0 0 8px rgba(34,197,94,0.6)';
              } else if (fx.type === 'miss' || fx.type === 'early' || fx.type === 'late') {
                textColors = 'text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.8)]';
                textShadow = '0 0 8px rgba(220,38,38,0.5)';
              }

              return (
                <motion.div
                  key={fx.id}
                  initial={{ opacity: 1, y: 15, scale: 0.7 }}
                  animate={{ opacity: 0, y: -45, scale: 1.15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute -ml-[80px] w-[160px] text-center font-black font-sans text-xs tracking-wide pointer-events-none select-none z-30"
                  style={{
                    left: `${fx.x}%`,
                    top: `${fx.y}%`,
                  }}
                >
                  <span className={`inline-block px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800/40 text-xs ${textColors}`}>
                    {fx.text}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Level stats guides details displayed at bottom of screen */}
      <div className="text-slate-500 font-sans text-[11px] text-center px-4 flex justify-between">
        <span>※ 정확하게 원이 겹쳐지는 순간 마우스 클릭이나 손가락 터치!</span>
        <span>콤보 유지시 HP가 회복되고, 속도는 점차 증가합니다.</span>
      </div>
    </div>
  );
}
