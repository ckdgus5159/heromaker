import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import '../App.css';
import type { UserInfo, Step, GameMode } from '../types';
import { questions, enneagramTypes, getGuildName } from '../data/enneagram';
import { supabase } from '../lib/supabase';

function Game() {
  const [step, setStep] = useState<Step>('mode_select');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [dbId, setDbId] = useState<string>(''); 

  const [info, setInfo] = useState<UserInfo>({ name: '', age: '', job: '', hobby: '', defense: '실없는 농담하기' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [choiceHistory, setChoiceHistory] = useState<{q: number, type: number}[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 커스텀 팝업 메시지 상태
  const [customPopup, setCustomPopup] = useState<string | null>(null);

  // --- 🦁 사자 길드 미니게임 변수 ---
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState('');
  const timerRef = useRef<number | null>(null);

  // --- 🔮 마탑 길드 미니게임 변수 ---
  const [magicTime, setMagicTime] = useState(10.0);
  const [magicPower, setMagicPower] = useState(0); 
  const [magicStatus, setMagicStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const magicTimerRef = useRef<number | null>(null);

  // --- 🌙 신성 교단 미니게임 변수 ---
  const [priestTime, setPriestTime] = useState(10.0);
  const [priestScore, setPriestScore] = useState(0);
  const [priestStatus, setPriestStatus] = useState<'idle' | 'playing' | 'end'>('idle');
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const priestTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current);
      if (magicTimerRef.current) clearInterval(magicTimerRef.current);
      if (priestTimerRef.current) clearInterval(priestTimerRef.current);
    };
  }, []);

  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    setStep('start');
  };

  const handleInfoSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep('test'); };

  const handleAnswer = (type: number) => {
    const newAnswers = { ...answers, [type]: (answers[type] || 0) + 1 };
    setAnswers(newAnswers);
    setChoiceHistory(prev => [...prev, { q: questions[currentQ].id, type }]);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('loading');
      
      setTimeout(async () => {
        const finalType = Number(Object.keys(newAnswers).reduce((a, b) => newAnswers[Number(a)] > newAnswers[Number(b)] ? a : b) || 9);
        
        const { data, error } = await supabase.from('heroes').insert([
          {
            mode: gameMode, name: info.name, age: info.age, job: info.job, hobby: info.hobby, defense: info.defense,
            enneagram_type: finalType, choices: choiceHistory
          }
        ]).select();

        if (error) console.error("DB 저장 에러:", error);
        if (data) setDbId(data[0].id);
        
        setStep('result');
      }, 1500);
    }
  };

  const getResultType = (): number => {
    if (Object.keys(answers).length === 0) return 9; 
    return Number(Object.keys(answers).reduce((a, b) => answers[Number(a)] > answers[Number(b)] ? a : b));
  };

  const startWithCountdown = (startGameFn: () => void) => {
    setCountdown(3);
    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) { setCountdown(currentCount); } 
      else { clearInterval(interval); setCountdown(null); startGameFn(); }
    }, 1000);
  };

  // --- 미니게임 로직들 ---
  const startMinigame = () => {
    setTime(0); setIsRunning(true); setGameResultMsg('');
    const start = Date.now();
    timerRef.current = window.setInterval(() => setTime(Date.now() - start), 10);
  };

  const stopMinigame = () => {
    setIsRunning(false); if (timerRef.current) clearInterval(timerRef.current);
    const diff = Math.abs((time / 1000) - 7.77);
    if (diff === 0) { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); setGameResultMsg('🎉 완벽합니다! 전설의 사자 전사! 🎉'); } 
    else if (diff <= 0.1) setGameResultMsg('대단합니다! 간발의 차이!');
    else setGameResultMsg('훈련이 더 필요하겠군요.');
  };

  const resetMinigame = () => { setTime(0); setIsRunning(false); setGameResultMsg(''); if (timerRef.current) clearInterval(timerRef.current); };

  const startMagicGame = () => {
    setMagicTime(10.0); setMagicPower(0); setMagicStatus('playing');
    magicTimerRef.current = window.setInterval(() => {
      setMagicTime((prev) => {
        if (prev <= 0.1) { clearInterval(magicTimerRef.current!); setMagicStatus('lose'); return 0; }
        return prev - 0.1;
      });
      setMagicPower((prev) => Math.max(0, prev - 0.5));
    }, 100);
  };

  const handleChantClick = () => {
    if (magicStatus !== 'playing') return;
    setMagicPower((prev) => {
      const nextPower = prev + 1; 
      if (nextPower >= 50) { clearInterval(magicTimerRef.current!); setMagicStatus('win'); }
      return nextPower;
    });
  };

  const resetMagicGame = () => { setMagicTime(10.0); setMagicPower(0); setMagicStatus('idle'); setCountdown(null); if (magicTimerRef.current) clearInterval(magicTimerRef.current); };

  const startPriestGame = () => {
    setPriestTime(10.0); setPriestScore(0); setPriestStatus('playing'); setActiveTile(null);
    priestTimerRef.current = window.setInterval(() => {
      setPriestTime(prev => {
        if (prev <= 0.1) { clearInterval(priestTimerRef.current!); setPriestStatus('end'); setActiveTile(null); return 0; }
        return prev - 0.1;
      });
    }, 100);
  };

  useEffect(() => {
    let spawnInterval: number;
    if (priestStatus === 'playing') {
      spawnInterval = window.setInterval(() => {
        const randomTile = Math.floor(Math.random() * 16);
        setActiveTile(randomTile);
        setTimeout(() => setActiveTile(current => current === randomTile ? null : current), 500);
      }, 600); 
    }
    return () => clearInterval(spawnInterval);
  }, [priestStatus]);

  const handleTileClick = (index: number) => {
    if (priestStatus !== 'playing') return;
    if (activeTile === index) { setPriestScore(prev => prev + 1); setActiveTile(null); }
  };

  const resetPriestGame = () => { setPriestTime(10.0); setPriestScore(0); setPriestStatus('idle'); setActiveTile(null); setCountdown(null); if (priestTimerRef.current) clearInterval(priestTimerRef.current); };

  const handleWakeUp = () => {
    if (gameMode === 'npc') setStep('wakeup');
    else setCustomPopup('차원의 문이 열렸습니다. \n 다음 스테이지로 이동하세요.');
  };

  const submitPhoneNumber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phone = new FormData(e.currentTarget).get('phone') as string;
    const { error } = await supabase.from('heroes').update({ phone_number: phone }).eq('id', dbId);
    
    if (error) {
      console.error("DB 업데이트 에러:", error);
      setCustomPopup('기록 중 오류가 발생했습니다. \n 다시 시도해주세요.');
    } else {
      setCustomPopup('정보가 성공적으로 기록되었습니다. \n 현실 세계에서 뵙겠습니다!');
    }
  };

  const closePopupAndReload = () => {
    setCustomPopup(null);
    window.location.reload();
  };

  // --- 화면 렌더링 도우미 ---
  const renderScreen = () => {
    if (step === 'mode_select') {
      return (
        <div className="game-container start-screen">
          <h1 className="pixel-text title">모드 선택</h1>
          <p className="subtitle">어떤 환경에서 접속하셨나요?</p>
          <div className="answer-buttons">
            <button onClick={() => selectMode('npc')} className="pixel-button pink">📱 길거리 NPC 모드</button>
            <button onClick={() => selectMode('arcade')} className="pixel-button">💻 게임장 모드</button>
          </div>
        </div>
      );
    }

    if (step === 'start') {
      return (
        <div className="game-container start-screen">
          <h1 className="pixel-text title">나만의<br/>용사 전설</h1>
          <div className="hero-graphic"><div className="main-emoji">🗡️🛡️</div><p className="lore-text">평화롭던 마을에 드리운 어둠...<br/>세계의 운명이 당신의 선택에 달렸다.<br/><br/>자신만의 무기와 방어구를 갖추고<br/>운명의 길드로 향하라!</p></div>
          <button onClick={() => setStep('info')} className="pixel-button">게임 시작</button>
        </div>
      );
    }

    if (step === 'info') {
      return (
        <div className="game-container info-screen">
          <h2 className="pixel-text">모험가 등록</h2>
          <form onSubmit={handleInfoSubmit} className="info-form">
            <input placeholder="이름 (예: 용사)" required onChange={e => setInfo({...info, name: e.target.value})} />
            <input placeholder="나이" type="number" required onChange={e => setInfo({...info, age: e.target.value})} />
            <input placeholder="직업" required onChange={e => setInfo({...info, job: e.target.value})} />
            <input placeholder="취미 (무기)" required onChange={e => setInfo({...info, hobby: e.target.value})} />
            <select value={info.defense} onChange={e => setInfo({...info, defense: e.target.value})}>
              <option value="실없는 농담하기">실없는 농담으로 넘기기</option>
              <option value="일단 잠자기">일단 침대에 눕기</option>
              <option value="합리화하기">그럴싸한 핑계 대기</option>
              <option value="맛있는 거 먹기">폭식으로 잊어버리기</option>
            </select>
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

    if (step === 'loading') {
        return (
            <div className="game-container loading-screen" style={{ justifyContent: 'center' }}>
            <div className="pixel-avatar bounce-anim">✨</div>
            <h2 className="pixel-text" style={{ fontSize: '24px' }}>용사 기운 충전 중!</h2>
            <p style={{ color: '#636e72' }}>조금만 기다려주세요!</p>
            </div>
      );
    }

    const finalType = getResultType();
    const isLionGuild = [8, 9, 1].includes(finalType);
    const isMageGuild = [5, 6, 7].includes(finalType);
    const isPriestGuild = [2, 3, 4].includes(finalType);

    if (step === 'result') {
      return (
        <div className="game-container result-screen">
          <h2 className="pixel-text">🎉 용사 탄생! 🎉</h2>
          <div className="character-card">
            <p className="guild-name">[{getGuildName(finalType)} 소속]</p>
            <div className="pixel-avatar">🧑‍🎤</div>
            <h3 className="hero-title">{enneagramTypes[finalType]}<br/>{info.job || '떠돌이'}</h3>
            <p className="char-name">Lv.{info.age || '1'} {info.name || '용사'}</p>
            <div className="card-info-box">
              <div className="stat-row"><span className="stat-label">⚔️ 무기</span><span className="stat-value">{info.hobby || '맨주먹'}</span></div>
              <div className="stat-row"><span className="stat-label">🛡️ 방어구</span><span className="stat-value">{info.defense || '맨몸'}</span></div>
            </div>
            {isLionGuild && <button onClick={() => { setStep('minigame_lion'); resetMinigame(); }} className="pixel-button guild-btn lion-btn">🦁 사자 길드 훈련장</button>}
            {isMageGuild && <button onClick={() => { setStep('minigame_magic'); resetMagicGame(); }} className="pixel-button guild-btn mage-btn">🔮 지혜 마탑 훈련장</button>}
            {isPriestGuild && <button onClick={() => { setStep('minigame_priest'); resetPriestGame(); }} className="pixel-button guild-btn priest-btn">🌙 신성 교단 훈련장</button>}
          </div>
          <button onClick={() => window.location.reload()} className="pixel-button retry-btn">다시 만들기</button>
        
        </div>
      );
    }

    if (step === 'minigame_lion') {
      return (
        <div className="game-container minigame-screen">
          <h2 className="pixel-text">사자 길드 훈련장</h2>
          <div className="lore-box"><p><strong>7.77초</strong>의 타이밍을 노려 일격을 가하라!</p></div>
          <div className="timer-box"><div className="timer-display">{(time / 1000).toFixed(2)}</div><p className="game-msg">{gameResultMsg || 'STOP 타이밍을 노리세요!'}</p></div>
          <div className="answer-buttons">
            {!isRunning ? <button onClick={startMinigame} className="pixel-button start-btn">START</button> : <button onClick={stopMinigame} className="pixel-button stop-btn">STOP</button>}
            <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
          </div>
        </div>
      );
    }

    if (step === 'minigame_magic') {
      return (
        <div className="game-container minigame-screen">
          <h2 className="pixel-text">지혜 마탑 훈련장</h2>
          <div className="timer-box mage-theme">
            <div className="magic-time">{magicTime.toFixed(1)}초</div>
            <div className="power-bar-container"><div className="power-bar-fill" style={{ width: `${Math.min(100, (magicPower / 50) * 100)}%` }}></div></div>
            <p className="game-msg">50회 영창하세요!</p>
          </div>
          <div className="answer-buttons">
            {countdown !== null ? ( <div className="countdown-display">{countdown}</div> ) : (
              <>
                {magicStatus === 'idle' && <button onClick={() => startWithCountdown(startMagicGame)} className="pixel-button start-btn">영창 시작</button>}
                {magicStatus !== 'idle' && <button onClick={handleChantClick} className={`pixel-button chant-btn ${magicStatus !== 'playing' ? 'disabled' : ''}`} disabled={magicStatus !== 'playing'}>영창 연타!</button>}
                {(magicStatus === 'win' || magicStatus === 'lose') && <button onClick={resetMagicGame} className="pixel-button start-btn">다시 도전</button>}
              </>
            )}
            <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
          </div>
        </div>
      );
    }

    if (step === 'minigame_priest') {
      return (
        <div className="game-container minigame-screen">
          <h2 className="pixel-text">신성 교단 훈련장</h2>
          <div className="timer-box priest-theme">
            <div className="priest-header"><span>{priestTime.toFixed(1)}초</span><span>✨ 점수: {priestScore}</span></div>
            <div className="tile-grid">{Array.from({ length: 16 }).map((_, idx) => ( <div key={idx} className={`tile ${activeTile === idx ? 'active' : ''}`} onMouseDown={() => handleTileClick(idx)} onTouchStart={(e) => { e.preventDefault(); handleTileClick(idx); }}></div> ))}</div>
          </div>
          <div className="answer-buttons">
            {countdown !== null ? ( <div className="countdown-display">{countdown}</div> ) : (
              <>
                {priestStatus === 'idle' && <button onClick={() => startWithCountdown(startPriestGame)} className="pixel-button start-btn">훈련 시작</button>}
                {priestStatus === 'end' && <button onClick={resetPriestGame} className="pixel-button start-btn">다시 훈련</button>}
              </>
            )}
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
            <input name="phone" placeholder="010-XXXX-XXXX" required pattern="[0-9\-]+" style={{ textAlign: 'center' }} />
            <button type="submit" className="pixel-button" style={{ background: '#8e44ad', borderBottomColor: '#5b2c6f' }}>
              현실 세계로 귀환하기
            </button>
          </form>
        </div>
      );
    }
    return null;
  };

return (
    <>
      {/* 👑 상단 상태창 (main-content-wrapper 바깥 상단에 배치) */}
      <div className="header-status-bar">
        <div className="header-content">
          <div className="header-title" onClick={() => window.location.reload()}>
            나만의 용사 전설
          </div>
          {/* 깨어나기 버튼 조건부 렌더링 (기존 로직 유지) */}
          {((step === 'minigame_lion' && !isRunning && time > 0) || 
            (step === 'minigame_magic' && (magicStatus === 'win' || magicStatus === 'lose')) || 
            (step === 'minigame_priest' && priestStatus === 'end')
           ) && (
            <button onClick={handleWakeUp} className="header-wakeup-btn">
              🔮 깨어나기
            </button>
          )}
        </div>
      </div>

      {/* 🎮 게임 화면 본체 */}
      <div className="main-content-wrapper">
        {renderScreen()}
      </div>

      {/* 커스텀 팝업 (기존 동일) */}
      {customPopup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup-box">
            <p>{customPopup.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
            <button onClick={closePopupAndReload} className="pixel-button">확인</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Game;