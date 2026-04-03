import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import '../App.css';
import type { UserInfo, Step, GameMode } from '../types';
import { questions, enneagramTypes, getGuildName } from '../data/enneagram';
import { supabase } from '../lib/supabase';

function Game() {
  const [step, setStep] = useState<Step>('mode_select');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [dbId, setDbId] = useState<string>(''); // 저장된 DB 행의 ID

  const [info, setInfo] = useState<UserInfo>({ name: '', age: '', job: '', hobby: '', defense: '실없는 농담하기' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [choiceHistory, setChoiceHistory] = useState<{q: number, type: number}[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 미니게임 상태들
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState('');
  const timerRef = useRef<number | null>(null);
  // ... (마탑, 교단 상태는 지면상 간소화하여 테스트 시 사자길드 로직 활용)
  
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    setStep('start');
  };

  const handleInfoSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep('test'); };

  const handleAnswer = async (type: number) => {
    const newAnswers = { ...answers, [type]: (answers[type] || 0) + 1 };
    setAnswers(newAnswers);
    setChoiceHistory(prev => [...prev, { q: questions[currentQ].id, type }]);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // 결과 도출 및 DB 저장
      const finalType = Number(Object.keys(newAnswers).reduce((a, b) => newAnswers[Number(a)] > newAnswers[Number(b)] ? a : b) || 9);
      
      const { data, error } = await supabase.from('heroes').insert([
        {
          mode: gameMode, name: info.name, age: info.age, job: info.job, hobby: info.hobby, defense: info.defense,
          enneagram_type: finalType, choices: choiceHistory
        }
      ]).select();

      if (data) setDbId(data[0].id);
      setStep('result');
    }
  };

  const getResultType = (): number => {
    if (Object.keys(answers).length === 0) return 9; 
    return Number(Object.keys(answers).reduce((a, b) => answers[Number(a)] > answers[Number(b)] ? a : b));
  };

  const stopMinigame = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const diff = Math.abs((time / 1000) - 7.77);
    
    if (diff === 0) {
      // 🌟 7.77초 팡파레 애니메이션
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setGameResultMsg('🎉 완벽합니다! 전설의 사자 전사! 🎉');
    } else if (diff <= 0.1) setGameResultMsg('대단합니다! 간발의 차이!');
    else setGameResultMsg('훈련이 더 필요하겠군요.');
  };

  const handleWakeUp = () => {
    if (gameMode === 'npc') setStep('wakeup');
    else alert('차원의 문이 열렸습니다. 다음 스테이지로 이동하세요.');
  };

  const submitPhoneNumber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phone = new FormData(e.currentTarget).get('phone') as string;
    await supabase.from('heroes').update({ phone_number: phone }).eq('id', dbId);
    alert('정보가 기록되었습니다. 현실 세계에서 뵙겠습니다!');
    window.location.reload();
  };

  // --- 화면 렌더링 ---
  if (step === 'mode_select') {
    return (
      <div className="game-container start-screen">
        <h1 className="pixel-text title">접속 모드 선택</h1>
        <p className="subtitle">어떤 환경에서 접속하셨나요?</p>
        <div className="answer-buttons">
          <button onClick={() => selectMode('npc')} className="pixel-button pink">📱 길거리 NPC 모드 (모바일)</button>
          <button onClick={() => selectMode('arcade')} className="pixel-button">💻 게임장 모드 (PC/태블릿)</button>
        </div>
      </div>
    );
  }

  if (step === 'start') {
    return (
      <div className="game-container start-screen">
        <h1 className="pixel-text title">나만의<br/>용사 전설</h1>
        <button onClick={() => setStep('info')} className="pixel-button">게임 시작</button>
      </div>
    );
  }

  // ... (info, test 화면은 기존과 동일) ...
  if (step === 'info') {
    return (
      <div className="game-container info-screen">
        <h2 className="pixel-text">모험가 등록</h2>
        <form onSubmit={handleInfoSubmit} className="info-form">
          <input placeholder="이름 (예: 용사)" required onChange={e => setInfo({...info, name: e.target.value})} />
          <input placeholder="나이" type="number" required onChange={e => setInfo({...info, age: e.target.value})} />
          <input placeholder="직업" required onChange={e => setInfo({...info, job: e.target.value})} />
          <input placeholder="취미 (당신의 무기)" required onChange={e => setInfo({...info, hobby: e.target.value})} />
          <button type="submit" className="pixel-button">모험 시작</button>
        </form>
      </div>
    );
  }

  if (step === 'test') {
    return (
      <div className="game-container test-screen">
        <div className="progress-bar">Quest {currentQ + 1} / {questions.length}</div>
        <div className="question-box"><p className="question-text">{questions[currentQ].text}</p></div>
        <div className="answer-buttons">
          {questions[currentQ].options.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(opt.type)} className="pixel-button option-btn">{opt.text}</button>
          ))}
        </div>
      </div>
    );
  }

  const finalType = getResultType();
  
  if (step === 'result') {
    return (
      <div className="game-container result-screen" style={{ position: 'relative' }}>
        {/* 🌟 이세계에서 깨어나기 화살표 버튼 */}
        <button className="wakeup-arrow" onClick={handleWakeUp} title="이세계에서 깨어나기">↪</button>
        
        <h2 className="pixel-text">🎉 용사 탄생! 🎉</h2>
        <div className="character-card">
          <p className="guild-name">[{getGuildName(finalType)} 소속]</p>
          <div className="pixel-avatar">🧑‍🎤</div>
          <h3 className="hero-title">{enneagramTypes[finalType]}<br/>{info.job}</h3>
          <p className="char-name">Lv.{info.age} {info.name}</p>
          
          <button onClick={() => setStep('minigame_lion')} className="pixel-button guild-btn lion-btn">🦁 미니게임 입장</button>
        </div>
      </div>
    );
  }

  if (step === 'minigame_lion') {
    return (
      <div className="game-container minigame-screen" style={{ position: 'relative' }}>
        <button className="wakeup-arrow" onClick={handleWakeUp}>↪</button>
        <h2 className="pixel-text">사자 길드 훈련장</h2>
        <div className="timer-box">
           <div className="timer-display" style={{ color: time/1000 === 7.77 ? '#f1c40f' : '#2ecc71' }}>
             {(time / 1000).toFixed(2)}
           </div>
           <p className="game-msg">{gameResultMsg}</p>
        </div>
        <div className="answer-buttons">
          {!isRunning ? 
            <button onClick={() => { setTime(0); setIsRunning(true); timerRef.current = window.setInterval(() => setTime(prev => prev + 10), 10); }} className="pixel-button start-btn">START</button> 
            : <button onClick={stopMinigame} className="pixel-button stop-btn">STOP</button>}
          <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
        </div>
      </div>
    );
  }

  if (step === 'wakeup') {
    return (
      <div className="game-container wakeup-screen">
        <h2 className="pixel-text" style={{ color: '#9b59b6' }}>이세계에서 깨어나기</h2>
        <div className="lore-box" style={{ borderColor: '#9b59b6', marginTop: '20px' }}>
          당신은 지금 용사로 살아가고 있나요, 마왕으로 살아가고 있나요?<br/><br/>
          우리는 현재 레벨도, 직업도, 스탯도 보이지 않는 세상에서 <strong>'내 길은 잘 가고 있는걸까'</strong>라는 질문을 던지게 됩니다.<br/><br/>
          지금, 당신의 선택과 성향을 통해 숨겨진 현실의 인생 캐릭터를 발견하세요.
        </div>
        <form onSubmit={submitPhoneNumber} style={{ marginTop: '30px' }}>
          <input name="phone" placeholder="010-XXXX-XXXX" required pattern="[0-9\-]+" />
          <button type="submit" className="pixel-button" style={{ background: '#8e44ad', borderBottomColor: '#5b2c6f' }}>
            현실 세계로 귀환하기
          </button>
        </form>
      </div>
    );
  }

  return null;
}

export default Game;