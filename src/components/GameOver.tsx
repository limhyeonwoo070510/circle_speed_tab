/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCw, Home, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { GameStats, Difficulty } from '../types';
import { audioService } from '../utils/audio';

interface GameOverProps {
  stats: GameStats;
  difficulty: Difficulty;
  onRestart: () => void;
  onGoToMenu: () => void;
}

export default function GameOver({ stats, difficulty, onRestart, onGoToMenu }: GameOverProps) {
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isNewMaxCombo, setIsNewMaxCombo] = useState<boolean>(false);

  // Evaluate Accuracy Grade
  const totalJudgments = stats.perfectCount + stats.goodCount + stats.missCount;
  const accuracy = totalJudgments > 0 
    ? Math.round(((stats.perfectCount * 100 + stats.goodCount * 50) / (totalJudgments * 100)) * 100)
    : 0;

  let grade = 'D';
  let gradeColor = 'text-rose-400';
  let gradeBg = 'bg-rose-500/15 border-rose-500/30';
  let evaluationText = '속도가 빨라질 땐 흥분하지 않고 침착하게 누르는 게 비법입니다.';

  if (stats.score >= 1000000) {
    grade = 'S';
    gradeColor = 'text-amber-400 font-extrabold drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    gradeBg = 'bg-amber-400/15 border-amber-400/40';
    evaluationText = '압도적인 반응 속도! 피지컬의 신이시군요 백만 점 돌파!';
  } else if (stats.score >= 750000) {
    grade = 'A';
    gradeColor = 'text-purple-400 font-bold';
    gradeBg = 'bg-purple-500/15 border-purple-500/40';
    evaluationText = '정말 훌륭한 타이밍 감각과 집중력입니다! 75만 점 고지를 돌파하셨습니다!';
  } else if (stats.score >= 500000) {
    grade = 'B';
    gradeColor = 'text-cyan-400';
    gradeBg = 'bg-cyan-500/15 border-cyan-500/40';
    evaluationText = '좋은 실력입니다! 조금만 더 피버를 활성화하면 A도 거뜬해요!';
  } else if (stats.score >= 250000) {
    grade = 'C';
    gradeColor = 'text-sky-300';
    gradeBg = 'bg-sky-500/15 border-sky-500/30';
    evaluationText = '준수하지만, 윤곽선과 원이 겹쳐지는 순간에 집중해봐요!';
  }

  useEffect(() => {
    // Check and save High Score
    const savedScoreStr = localStorage.getItem('circle_rhythm_high_score');
    const savedComboStr = localStorage.getItem('circle_rhythm_max_combo');
    
    const savedScore = savedScoreStr ? parseInt(savedScoreStr, 10) : 0;
    const savedCombo = savedComboStr ? parseInt(savedComboStr, 10) : 0;

    if (stats.score > savedScore) {
      localStorage.setItem('circle_rhythm_high_score', stats.score.toString());
      setIsNewHighScore(true);
    }
    
    if (stats.maxCombo > savedCombo) {
      localStorage.setItem('circle_rhythm_max_combo', stats.maxCombo.toString());
      setIsNewMaxCombo(true);
    }

    // Play GameOver chime
    audioService.play('gameover');
  }, [stats.score, stats.maxCombo]);

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-md text-white overflow-hidden relative">
      {/* Visual background rings */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Game Over Title */}
      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex py-1.5 px-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-mono font-medium tracking-wide mb-3">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-400" />
          GAME OVER
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-500 bg-clip-text text-transparent">
          게임이 종료되었습니다
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-mono">난이도: {difficulty}</p>
      </div>

      {/* High Score Celebration Badge */}
      {isNewHighScore && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="mb-5 p-3.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-2xl flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-200 font-bold text-sm">🎉 개인 새로운 최고 점수 달성! 🎉</span>
        </motion.div>
      )}

      {/* Score Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-center">
          <div className="text-slate-400 text-[11px] mb-1">최종 점수</div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">{stats.score.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-center">
          <div className="text-slate-400 text-[11px] mb-1">최대 콤보</div>
          <div className="text-2xl font-black font-mono tracking-tight text-teal-300">
            {stats.maxCombo} <span className="text-xs font-normal text-slate-500">Combo</span>
          </div>
        </div>
      </div>

      {/* Grade / Rank Badge */}
      <div className={`p-5 rounded-2xl border ${gradeBg} mb-6 flex items-center gap-5`}>
        <div className={`w-16 h-16 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-center text-4xl font-black ${gradeColor} shrink-0`}>
          {grade}
        </div>
        <div className="flex-1 text-left">
          <p className="text-slate-300 font-sans text-xs leading-relaxed">{evaluationText}</p>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="mb-6 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2.5">
        <h4 className="text-xs font-mono tracking-wider text-slate-400 border-b border-slate-800/50 pb-1.5 mb-2.5">
          타격 세부 판정 정보
        </h4>
        
        <div className="flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
            Perfect
          </span>
          <span className="text-cyan-300 font-bold font-mono text-sm">{stats.perfectCount}</span>
        </div>

        <div className="flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
            Good
          </span>
          <span className="text-emerald-300 font-bold font-mono text-sm">{stats.goodCount}</span>
        </div>

        <div className="flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
            Miss
          </span>
          <span className="text-rose-400 font-bold font-mono text-sm">{stats.missCount}</span>
        </div>

        <div className="border-t border-slate-800/40 pt-2.5 flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400">총 생성된 동그라미</span>
          <span className="text-slate-300 font-mono font-medium">{stats.totalNotesSpawned}</span>
        </div>

        <div className="flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400">최대 스피드 레벨</span>
          <span className="text-indigo-300 font-bold font-mono">Lv.{stats.level}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
        >
          <RotateCw className="w-4 h-4 animate-spin-hover" />
          다시 하기
        </button>
        <button
          onClick={onGoToMenu}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          메인화면으로
        </button>
      </div>
    </div>
  );
}
