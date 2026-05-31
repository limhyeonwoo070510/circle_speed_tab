/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty } from '../types';

interface SettingsPreviewProps {
  startLevel: number;
  shrinkDuration: number;
  difficulty: Difficulty;
}

interface PreviewCircle {
  id: string;
  createdAt: number;
  targetTime: number;
}

export default function SettingsPreview({ startLevel, shrinkDuration, difficulty }: SettingsPreviewProps) {
  const getSpawnInterval = (lvl: number): number => {
    const multiplier = Math.max(0.06, Math.pow(0.82, lvl - 1));
    return Math.max(120, Math.round(1200 * multiplier));
  };

  const spawnInterval = getSpawnInterval(startLevel);

  const [circles, setCircles] = useState<PreviewCircle[]>([]);
  const [pulse, setPulse] = useState<boolean>(false);
  const activeIntervalRef = useRef<number>(spawnInterval);
  const activeDurationRef = useRef<number>(shrinkDuration);

  // Keep refs in sync for the interval loop
  useEffect(() => {
    activeIntervalRef.current = spawnInterval;
    activeDurationRef.current = shrinkDuration;
  }, [spawnInterval, shrinkDuration]);

  // Handle periodic spawn of preview elements
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const spawnAndSchedule = () => {
      const now = Date.now();
      const id = `${now}-${Math.random()}`;
      
      const newCircle: PreviewCircle = {
        id,
        createdAt: now,
        targetTime: now + activeDurationRef.current,
      };

      setCircles(prev => [...prev.slice(-3), newCircle]); // Keep at most 4 circles max in preview queue in case of fast intervals

      // At exactly targetTime, trigger a subtle pulse on the preview card
      setTimeout(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
      }, activeDurationRef.current);

      // Schedule next
      timeoutId = setTimeout(spawnAndSchedule, activeIntervalRef.current);
    };

    timeoutId = setTimeout(spawnAndSchedule, activeIntervalRef.current);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [startLevel]); // Retrigger when user updates startLevel directly

  // Handle note cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCircles(prev => prev.filter(c => now < c.targetTime + 400));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Sizing definitions matching the game
  const sizeConfig = {
    EASY: "w-[66px] h-[66px]",
    NORMAL: "w-[54px] h-[54px]",
    HARD: "w-[44px] h-[44px]",
  };
  const activeSizeClass = sizeConfig[difficulty] || sizeConfig.NORMAL;

  return (
    <div className="w-full h-44 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic playfield grid layout backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30" />
      
      {/* Pulse overlay indicating perfect matching target flash cues */}
      {pulse && (
        <div className="absolute inset-0 bg-cyan-500/5 duration-200 transition-colors pointer-events-none" />
      )}

      <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-500 tracking-wider uppercase">
        실시간 속도 프리뷰 (Real-time Preview)
      </div>

      {/* Target Preview Node Container (Anchored at center of container) */}
      <div className="relative w-full h-full flex items-center justify-center">
        {circles.map((circle) => {
          const now = Date.now();
          const remaining = circle.targetTime - now;
          const initialDelay = activeDurationRef.current;
          
          if (remaining < -100) return null; // already fully align animated

          return (
            <div
              key={circle.id}
              className={`absolute flex items-center justify-center pointer-events-none ${activeSizeClass}`}
            >
              {/* Outer shrink indicator circular helper */}
              <motion.div
                initial={{ scale: 3.5, opacity: 0.2 }}
                animate={{ scale: 1.0, opacity: 1.0 }}
                transition={{ duration: initialDelay / 1000, ease: "linear" }}
                className="absolute inset-[1px] rounded-full border-2 border-dashed border-cyan-400"
                style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)' }}
              />

              {/* Central static anchor sphere */}
              <div
                className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-950 to-slate-900 border-2 border-cyan-400/80 flex items-center justify-center shadow-lg relative"
                style={{ boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)' }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              {/* Ripple wave flash showing perfect accuracy sync alignment */}
              {remaining <= 100 && remaining >= -100 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-[-4px] rounded-full border border-teal-400"
                />
              )}
            </div>
          );
        })}

        {circles.length === 0 && (
          <span className="text-xs text-slate-500 font-mono tracking-wide animate-pulse">
            프리뷰 생성 대기 중...
          </span>
        )}
      </div>

      <div className="absolute bottom-2 font-mono text-[9px] text-slate-400 flex gap-4 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800/40">
        <span>출현: <strong className="text-cyan-300">{(1000 / spawnInterval).toFixed(1)}개 / 초</strong></span>
        <span>수축 속도: <strong className="text-orange-300">{shrinkDuration}ms</strong></span>
      </div>
    </div>
  );
}
