import { useState, useRef, useEffect } from 'react';
import './App.css';
import type { UserInfo, Step } from './types';
import { questions, enneagramTypes, getGuildName } from './data/enneagram';

function App() {
  const [step, setStep] = useState<Step>('start');
  const [info, setInfo] = useState<UserInfo>({
    name: '', age: '', job: '', hobby: '', defense: '실없는 농담하기'
  });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);

  // ⏱️ 공통 카운트다운 상태 (3, 2, 1)
  const [countdown, setCountdown] = useState<number | null>(null);

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

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (magicTimerRef.current) clearInterval(magicTimerRef.current);
      if (priestTimerRef.current) clearInterval(priestTimerRef.current);
    };
  }, []);

  // --- 공통 로직 ---
  const handleStart = () => setStep('info');
  const handleInfoSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep('test'); };
  const handleAnswer = (type: number) => {
    setAnswers(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
    else setStep('result');
  };
  const getResultType = (): number => {
    if (Object.keys(answers).length === 0) return 9; 
    return Number(Object.keys(answers).reduce((a, b) => answers[Number(a)] > answers[Number(b)] ? a : b));
  };

  // ⏱️ 카운트다운 실행기 (3, 2, 1 후 게임 시작 함수 호출)
  const startWithCountdown = (startGameFn: () => void) => {
    setCountdown(3);
    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(interval);
        setCountdown(null);
        startGameFn();
      }
    }, 1000);
  };

  // --- 🦁 사자 길드 함수 ---
  const startMinigame = () => {
    setTime(0); setIsRunning(true); setGameResultMsg('');
    const start = Date.now();
    timerRef.current = window.setInterval(() => setTime(Date.now() - start), 10);
  };
  const stopMinigame = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const diff = Math.abs((time / 1000) - 7.77);
    if (diff === 0) setGameResultMsg('완벽합니다! 전설의 사자 전사!');
    else if (diff <= 0.1) setGameResultMsg('대단합니다! 간발의 차이!');
    else if (diff <= 0.5) setGameResultMsg('훌륭한 감각입니다!');
    else setGameResultMsg('훈련이 더 필요하겠군요.');
  };
  const resetMinigame = () => {
    setTime(0); setIsRunning(false); setGameResultMsg('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // --- 🔮 마탑 길드 함수 ---
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
  const resetMagicGame = () => {
    setMagicTime(10.0); setMagicPower(0); setMagicStatus('idle'); setCountdown(null);
    if (magicTimerRef.current) clearInterval(magicTimerRef.current);
  };

  // --- 🌙 신성 교단 함수 ---
  const startPriestGame = () => {
    setPriestTime(10.0); setPriestScore(0); setPriestStatus('playing'); setActiveTile(null);
    priestTimerRef.current = window.setInterval(() => {
      setPriestTime(prev => {
        if (prev <= 0.1) {
          clearInterval(priestTimerRef.current!);
          setPriestStatus('end');
          setActiveTile(null);
          return 0;
        }
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
    if (activeTile === index) {
      setPriestScore(prev => prev + 1); 
      setActiveTile(null); 
    }
  };
  const resetPriestGame = () => {
    setPriestTime(10.0); setPriestScore(0); setPriestStatus('idle'); setActiveTile(null); setCountdown(null);
    if (priestTimerRef.current) clearInterval(priestTimerRef.current);
  };

  // --- 화면 렌더링 ---
  if (step === 'start') {
    return (
      <div className="game-container start-screen">
        <h1 className="pixel-text title">나만의<br/>용사 전설</h1>
        <p className="subtitle">마왕을 무찌를 당신의 성향을 찾아서...</p>
        
        <div className="hero-graphic">
          <div className="main-emoji">🗡️🛡️</div>
          <p className="lore-text">평화롭던 마을에 드리운 어둠...<br/>세계의 운명이 당신의 선택에 달렸다.<br/><br/>자신만의 무기와 방어구를 갖추고<br/>운명의 길드로 향하라!</p>
        </div>

        <button onClick={handleStart} className="pixel-button">게임 시작</button>

        <div className="dev-tools">
          <p>🛠️ 개발자 테스트 모드</p>
          <div className="dev-buttons">
            <button onClick={() => { setStep('minigame_lion'); resetMinigame(); }} className="dev-btn">🦁 사자</button>
            <button onClick={() => { setStep('minigame_magic'); resetMagicGame(); }} className="dev-btn">🔮 마탑</button>
            <button onClick={() => { setStep('minigame_priest'); resetPriestGame(); }} className="dev-btn">🌙 교단</button>
          </div>
        </div>
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
          <input placeholder="직업 (예: 개발자, 회사원)" required onChange={e => setInfo({...info, job: e.target.value})} />
          <input placeholder="취미 (당신의 무기)" required onChange={e => setInfo({...info, hobby: e.target.value})} />
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
          <p className="char-name">Lv.{info.age || '1'} {info.name || '이름없는 용사'}</p>
          
          {/* 깔끔하게 정렬된 스탯 박스 구역 */}
          <div className="card-info-box">
            <div className="stat-row">
              <span className="stat-label">⚔️ 무기</span>
              <span className="stat-value">{info.hobby || '맨주먹'}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">🛡️ 방어구</span>
              <span className="stat-value">{info.defense || '맨몸'}</span>
            </div>
          </div>
          
          {isLionGuild && <button onClick={() => { setStep('minigame_lion'); resetMinigame(); }} className="pixel-button guild-btn lion-btn">🦁 사자 길드 훈련장 입장</button>}
          {isMageGuild && <button onClick={() => { setStep('minigame_magic'); resetMagicGame(); }} className="pixel-button guild-btn mage-btn">🔮 지혜 마탑 훈련장 입장</button>}
          {isPriestGuild && <button onClick={() => { setStep('minigame_priest'); resetPriestGame(); }} className="pixel-button guild-btn priest-btn">🌙 신성 교단 훈련장 입장</button>}
        </div>
        <button onClick={() => window.location.reload()} className="pixel-button retry-btn">다시 만들기</button>
      </div>
    );
  }

  // --- 미니게임 화면들 ---
  if (step === 'minigame_lion') {
    return (
      <div className="game-container minigame-screen">
        <h2 className="pixel-text">사자 길드 훈련장</h2>
        <p className="subtitle">전사의 감각을 증명하라!</p>
        
        {/* 새롭게 추가된 전사 길드 세계관(Lore) 박스 */}
        <div className="lore-box">
          <p>거대한 바위를 일격에 쪼개기 위해서는 호흡을 가다듬고 정확한 타이밍에 기합을 넣어야 한다.<br/>속으로 시간을 세어 정확히 <strong>7.77초</strong>에 일격을 가하라!</p>
        </div>

        <div className="timer-box"><div className="timer-display">{(time / 1000).toFixed(2)}</div><p className="game-msg">{gameResultMsg || '타이밍에 맞춰 STOP을 누르세요!'}</p></div>
        <div className="answer-buttons">
          {!isRunning ? <button onClick={startMinigame} className="pixel-button start-btn">일격 준비 (START)</button> : <button onClick={stopMinigame} className="pixel-button stop-btn">베기! (STOP)</button>}
          <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
        </div>
      </div>
    );
  }

  if (step === 'minigame_magic') {
    return (
      <div className="game-container minigame-screen">
        <h2 className="pixel-text">지혜 마탑 훈련장</h2>
        <p className="subtitle">10초 안에 영창(50회 클릭)하여 마왕 토벌!</p>
        <div className="timer-box mage-theme">
          <div className="magic-time">남은 시간: {magicTime.toFixed(1)}초</div>
          <div className="power-bar-container"><div className="power-bar-fill" style={{ width: `${Math.min(100, (magicPower / 50) * 100)}%` }}></div></div>
          <p className="game-msg">{magicStatus === 'win' ? '✨ 성공!' : magicStatus === 'lose' ? '💀 실패...' : '연타하세요!'}</p>
        </div>
        <div className="answer-buttons">
          {countdown !== null ? (
            <div className="countdown-display">{countdown}</div>
          ) : (
            <>
              {magicStatus === 'idle' && <button onClick={() => startWithCountdown(startMagicGame)} className="pixel-button start-btn">영창 준비 (시작)</button>}
              {magicStatus !== 'idle' && <button onClick={handleChantClick} className={`pixel-button chant-btn ${magicStatus !== 'playing' ? 'disabled' : ''}`} disabled={magicStatus !== 'playing'}>{magicStatus === 'playing' ? '영창하기 (연타!)' : '주문 종료'}</button>}
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
        <p className="subtitle">10초 안에 빛나는 타일을 정화하세요!</p>
        <div className="timer-box priest-theme">
          <div className="priest-header">
            <span className="magic-time">남은 시간: {priestTime.toFixed(1)}초</span>
            <span className="score-display">✨ 점수: {priestScore}</span>
          </div>
          <div className="tile-grid">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`tile ${activeTile === idx ? 'active' : ''}`}
                onMouseDown={() => handleTileClick(idx)}
                onTouchStart={(e) => { e.preventDefault(); handleTileClick(idx); }}
              ></div>
            ))}
          </div>
          <p className="game-msg">
            {priestStatus === 'end' ? `훈련 종료! 총 ${priestScore}개를 정화했습니다.` : '노란 불빛을 터치하세요!'}
          </p>
        </div>
        <div className="answer-buttons">
          {countdown !== null ? (
            <div className="countdown-display">{countdown}</div>
          ) : (
            <>
              {priestStatus === 'idle' && (
                <button onClick={() => startWithCountdown(startPriestGame)} className="pixel-button start-btn">정화 준비 (시작)</button>
              )}
              {priestStatus === 'end' && (
                <button onClick={resetPriestGame} className="pixel-button start-btn">다시 훈련</button>
              )}
            </>
          )}
          <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
        </div>
      </div>
    );
  }
}

export default App;