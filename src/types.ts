/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameSettings {
  startLevel: number;           // starts at 1, max 10
  shrinkDuration: number;       // ms (how fast target approach circle contracts, remains constant)
  speedUpEffectEnabled: boolean; // whether to show Level Up Speed Up effects (visual text and cue sound)
}

export type GameStage = 'MENU' | 'PLAYING' | 'GAMEOVER';


export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface GameNote {
  id: string;
  x: number; // percentage coordinate (10% to 90%)
  y: number; // percentage coordinate (10% to 90%)
  createdAt: number; // timestamp when spawned
  targetTime: number; // timestamp when ring should align perfectly
  duration: number; // approach time in milliseconds
  number: number; // sequence number displayed inside the circle (e.g. 1-4)
  clicked: boolean;
}

export interface HitEffect {
  id: string;
  x: number;
  y: number;
  type: 'perfect' | 'good' | 'miss' | 'early' | 'late';
  text: string;
  createdAt: number;
}

export interface GameStats {
  score: number;
  coins: number;
  level: number;
  combo: number;
  maxCombo: number;
  hp: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  totalNotesSpawned: number;
}
