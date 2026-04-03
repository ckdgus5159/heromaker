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

// 'minigame_priest' 단계 추가
export type Step = 'start' | 'info' | 'test' | 'result' | 'minigame_lion' | 'minigame_magic' | 'minigame_priest';