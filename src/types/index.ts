export interface UserInfo {
  name: string;
  age: string;
  job: string;
  hobby: string;
  defense: string;
}

export interface Option {
  text: string;
  type: number;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

// 모드 선택 및 깨어나기 단계 추가
export type Step = 'mode_select' | 'start' | 'info' | 'test' | 'loading' | 'result' | 'minigame_lion' | 'minigame_magic' | 'minigame_priest' | 'wakeup';
export type GameMode = 'npc' | 'arcade' | null;