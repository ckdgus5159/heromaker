import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import '../App.css';
import type { UserInfo, Step, GameMode } from '../types';
import { questions, enneagramTypes, getGuildName } from '../data/enneagram';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom'; // useLocation 추가

import mageIcon from '../assets/mage.png';
import warriorIcon from '../assets/warrior.png';
import paladinIcon from '../assets/paladin.png';

function Game() {
  const [step, setStep] = useState<Step>('mode_select');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [dbId, setDbId] = useState<string>(''); 

  const [info, setInfo] = useState<UserInfo>({ name: '', age: '', job: '', hobby: '', defense: '실없는 농담하기' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [choiceHistory, setChoiceHistory] = useState<{q: number, type: number}[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [customPopup, setCustomPopup] = useState<string | null>(null);

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState('');
  const timerRef = useRef<number | null>(null);

  const [magicTime, setMagicTime] = useState(10.0);
  const [magicPower, setMagicPower] = useState(0); 
  const [magicStatus, setMagicStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const magicTimerRef = useRef<number | null>(null);

  const [priestTime, setPriestTime] = useState(10.0);
  const [priestScore, setPriestScore] = useState(0);
  const [priestStatus, setPriestStatus] = useState<'idle' | 'playing' | 'end'>('idle');
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const priestTimerRef = useRef<number | null>(null);
  const location = useLocation();

  // 🚀 [수정 포인트] 관리자 페이지에서 넘어온 shortcut 처리 로직 보강
  useEffect(() => {
    if (location.state && (location.state as any).shortcut) {
      const targetStep = (location.state as any).shortcut;
      setStep(targetStep);
      
      // 관리자 모드로 미니게임 진입 시 gameMode가 null이면 렌더링 오류가 날 수 있으므로 기본값 설정
      if (!gameMode) {
        setGameMode('arcade');
      }
      
      // 결과창이나 미니게임에서 출력될 기본 정보가 없을 경우를 대비한 기본값 세팅
      setInfo(prev => prev.name ? prev : { 
        name: '관리자', age: '99', job: '용사', hobby: '전설의 검', defense: '실없는 농담하기' 
      });

      // 주소창의 state를 비워 뒤로가기 시 오작동 방지
      window.history.replaceState({}, document.title);
    }
  }, [location, gameMode]);

  const selectMode = (mode: GameMode) => { setGameMode(mode); setStep('start'); };
  const handleInfoSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep('test'); };
  
  const handleAnswer = (type: number) => {
    const newAnswers = { ...answers, [type]: (answers[type] || 0) + 1 };
    setAnswers(newAnswers);
    setChoiceHistory(prev => [...prev, { q: questions[currentQ].id, type }]);
    if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); } 
    else {
      setStep('loading');
      setTimeout(async () => {
        const finalType = Number(Object.keys(newAnswers).reduce((a, b) => newAnswers[Number(a)] > newAnswers[Number(b)] ? a : b) || 9);
        const { data, error } = await supabase.from('heroes').insert([{ mode: gameMode, name: info.name, age: info.age, job: info.job, hobby: info.hobby, defense: info.defense, enneagram_type: finalType, choices: choiceHistory }]).select();
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

  const startMinigame = () => { setTime(0); setIsRunning(true); setGameResultMsg(''); const start = Date.now(); timerRef.current = window.setInterval(() => setTime(Date.now() - start), 10); };
  const stopMinigame = () => { setIsRunning(false); if (timerRef.current) clearInterval(timerRef.current); const diff = Math.abs((time / 1000) - 7.77); if (diff === 0) { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); setGameResultMsg('🎉 완벽합니다! 전설의 사자 전사! 🎉'); } else if (diff <= 0.1) setGameResultMsg('대단합니다! 간발의 차이!'); else setGameResultMsg('훈련이 더 필요하겠군요.'); };
  const resetMinigame = () => { setTime(0); setIsRunning(false); setGameResultMsg(''); if (timerRef.current) clearInterval(timerRef.current); };
  
  const startMagicGame = () => { setMagicTime(10.0); setMagicPower(0); setMagicStatus('playing'); magicTimerRef.current = window.setInterval(() => { setMagicTime((prev) => { if (prev <= 0.1) { clearInterval(magicTimerRef.current!); setMagicStatus('lose'); return 0; } return prev - 0.1; }); setMagicPower((prev) => Math.max(0, prev - 0.5)); }, 100); };
  const handleChantClick = () => {
  if (magicStatus !== 'playing') return;
  
  // 상태 업데이트는 비동기이므로 연속 호출 시 리액트가 배칭(Batching) 처리를 합니다.
  // 함수형 업데이트(prev => prev + 1)를 사용하고 계시므로 로직은 정확합니다.
  setMagicPower((prev) => {
    const nextPower = prev + 1;
    if (nextPower >= 50) {
      if (magicTimerRef.current) clearInterval(magicTimerRef.current);
      setMagicStatus('win');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    return nextPower;
  });
};
  const resetMagicGame = () => { setMagicTime(10.0); setMagicPower(0); setMagicStatus('idle'); setCountdown(null); if (magicTimerRef.current) clearInterval(magicTimerRef.current); };
  
  const startPriestGame = () => { setPriestTime(10.0); setPriestScore(0); setPriestStatus('playing'); setActiveTile(null); priestTimerRef.current = window.setInterval(() => { setPriestTime(prev => { if (prev <= 0.1) { clearInterval(priestTimerRef.current!); setPriestStatus('end'); setActiveTile(null); return 0; } return prev - 0.1; }); }, 100); };
  
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

  const handleTileClick = (index: number) => { if (priestStatus !== 'playing') return; if (activeTile === index) { setPriestScore(prev => prev + 1); setActiveTile(null); } };
  const resetPriestGame = () => { setPriestTime(10.0); setPriestScore(0); setPriestStatus('idle'); setActiveTile(null); setCountdown(null); if (priestTimerRef.current) clearInterval(priestTimerRef.current); };
  
  const handleWakeUp = () => { 
    setStep('wakeup'); 
  };
  
  const submitPhoneNumber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let phone = formData.get('phone') as string;

    // 🚀 [수정] 모든 특수문자(하이픈, 공백 등) 제거하여 숫자만 남김
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 번호 유효성 검사 (최소 10자 이상)
    if (cleanPhone.length < 10) {
      setCustomPopup('전화번호가 너무 짧습니다. \n 정확한 번호를 입력해주세요.');
      return;
    }

    if (!dbId) {
      setCustomPopup('오류: 용사 데이터가 없습니다. \n 처음부터 다시 시도해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('heroes')
        .update({ phone_number: cleanPhone }) // 정제된 번호 저장
        .eq('id', dbId)
        .select();

      if (error || !data?.length) {
        console.error("DB 업데이트 에러:", error);
        // 🚀 실패 시 전용 팝업 (이후 새로고침 안 함)
        setCustomPopup('기록 중 오류가 발생했습니다. \n 다시 한번 시도해주세요.');
      } else {
        // 🚀 성공 시 전용 팝업 (이후 새로고침 함)
        setCustomPopup('정보가 성공적으로 기록되었습니다! \n 현실 세계에서 뵙겠습니다.');
      }
    } catch (err) {
      setCustomPopup('네트워크 연결이 원활하지 않습니다.');
    }
  };
  
  const closePopupAndReload = () => {
  // 🚀 [수정] 성공 메시지가 포함된 경우에만 메인 페이지로 리로드
    if (customPopup && (customPopup.includes('성공') || customPopup.includes('처음부터'))) {
      setCustomPopup(null);
      window.location.reload();
    } else {
      // 🚀 번호 오류나 단순 실패 시에는 팝업만 닫고 현재 페이지(입력창) 유지
      setCustomPopup(null);
    }
  };

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
          <div className="hero-graphic" style={{ marginTop: '-40px' }}>
            <div className="main-emoji">🗡️🛡️</div>
            <p className="subtitle" style={{ fontSize: '18px', lineHeight: '1.6' }}>
              평화롭던 마을에 드리운 어둠...<br/>
              세계의 운명이 당신의 선택에 달렸다.
            </p>
          </div>
        <div className="button-area" style={{ marginTop: '0' }}>
          <button onClick={() => setStep('info')} className="pixel-button">
            게임 시작
          </button>
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
            <input placeholder="직업" required onChange={e => setInfo({...info, job: e.target.value})} />
            <div className="stat-input-group">
              <label className="stat-label">⚔️ 무기 (나만의 에너지 발산법)</label>
              <input 
                placeholder="취미를 입력하세요 (예: 운동, 독서)" 
                required 
                onChange={e => setInfo({...info, hobby: e.target.value})} 
              />
            </div>
            <div className="info-section">
              <label className="stat-label">🛡️ 방어구 (방어기제 선택)</label>
              <p className="description-text">위기 상황에서 당신을 보호하는 마음의 습관입니다.</p>
              <select value={info.defense} onChange={e => setInfo({...info, defense: e.target.value})}>
               <option value="실없는 농담하기">실없는 농담 (유머로 승화)</option>
                <option value="일단 푹 자기">일단 푹 자기 (잠시 현실 피하기)</option>
                <option value="합리적인 이유 찾기">이유 찾기 (논리적 분석)</option>
                <option value="맛있는 거 먹기">맛있는 거 먹기 (즐거움으로 보상)</option>
                <option value="남 탓하며 투덜대기">남 탓하기 (감정 쏟아내기)</option>
                <option value="쇼핑하며 지르기">물건 사기 (즉각적 보상)</option>
              </select>
            </div>
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
        <div className="game-container loading-screen">
          <div className="loading-text-zone">
            <h2 className="pixel-text" style={{ fontSize: '24px' }}>용사 기운 충전 중!</h2>
            <p className="subtitle" style={{ color: '#bdc3c7' }}>운명의 기록을 판독하고 있습니다...</p>
          </div>
          <div className="loading-icon-zone">
            <div className="pixel-avatar bounce-anim">⏳</div>
          </div>
        </div>
      );
    }

    const finalType = getResultType();
    const fullTypeName = enneagramTypes[finalType] || "🕊️ 평화의 수도사";
    const typeIcon = fullTypeName.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s|[^\s\w\d]+/g)?.[0] || "👤";
    const typeNameOnly = fullTypeName.replace(typeIcon, "").trim();

    const isLionGuild = [8, 9, 1].includes(finalType);
    const isMageGuild = [5, 6, 7].includes(finalType);
    const isPriestGuild = [2, 3, 4].includes(finalType);

      let guildPixelIcon = warriorIcon; // 기본값
      if (isMageGuild) guildPixelIcon = mageIcon;
      if (isPriestGuild) guildPixelIcon = paladinIcon;

    if (step === 'result') {
      
      return (
        <div className="game-container result-screen">
          <h2 className="pixel-text">🎉 용사 탄생! 🎉</h2>
          <div className="character-card">
            <div className="card-avatar-zone">
              <img 
                src={guildPixelIcon} 
                alt="용사 아이콘" 
                className="hero-pixel-icon" 
              />
            </div>
            <p className="guild-name">[{getGuildName(finalType)} 소속]</p>
            <h3 className="hero-title" style={{ fontSize: '22px', color: '#1abc9c' }}>
              {typeNameOnly}<br/>{info.job}
            </h3>
            <div className="card-info-box">
              <div className="stat-row"><span>⚔️ 무기</span><span>{info.hobby}</span></div>
              <div className="stat-row"><span>🛡️ 방어구</span><span>{info.defense}</span></div>
              <div className="stat-row"><span>📊 레벨</span><span>Lv.{info.age} {info.name}</span></div>
            </div>
            {isLionGuild && <button onClick={() => { setStep('minigame_lion'); resetMinigame(); }} className="pixel-button lion-btn">🦁 사자 길드 훈련장</button>}
            {isMageGuild && <button onClick={() => { setStep('minigame_magic'); resetMagicGame(); }} className="pixel-button mage-btn">🔮 지혜 마탑 훈련장</button>}
            {isPriestGuild && <button onClick={() => { setStep('minigame_priest'); resetPriestGame(); }} className="pixel-button priest-btn">🌙 신성 교단 훈련장</button>}
          </div>
          <button onClick={() => window.location.reload()} className="pixel-button gray">다시 만들기</button>
        </div>
      );
    }

    if (step === 'minigame_lion') {
      return (
        <div className="game-container minigame-screen">
          <h2 className="pixel-text">사자 길드 훈련장</h2>
          <div className="lore-box">
            <p><strong>"진정한 전사는 찰나의 순간을 지배한다!"</strong></p>
            <p style={{ fontSize: '14px', color: '#bdc3c7', marginTop: '5px' }}>
              적의 허점을 뚫기 위해 정확히 7.77초에 검을 멈추세요!
            </p>
          </div>
          <div className="timer-box"><div className="timer-display">{(time / 1000).toFixed(2)}</div><p className="game-msg">{gameResultMsg || 'STOP 타이밍을 노리세요!'}</p></div>
          <div className="answer-buttons">
            {!isRunning ? (
              <>
                <button onClick={startMinigame} className="pixel-button start-btn">START</button>
                {time > 0 && ( <button onClick={resetMinigame} className="pixel-button gray">다시 도전</button> )}
              </>
            ) : ( <button onClick={stopMinigame} className="pixel-button stop-btn">STOP</button> )}
            <button onClick={() => setStep('result')} className="pixel-button gray">결과로 돌아가기</button>
          </div>
        </div>
      );
    }

    if (step === 'minigame_magic') {
      return (
        <div className="game-container minigame-screen">
          <h2 className="pixel-text">지혜 마탑 훈련장</h2>
          <div className="lore-box">
            <p><strong>"쏟아지는 마력을 감당할 지혜가 있는가?"</strong></p>
            <p style={{ fontSize: '14px', color: '#bdc3c7', marginTop: '5px' }}>
              마왕을 무찌르기 위해 제한 시간 내 마법을 난사하세요!!
            </p>
          </div>
          <div className="timer-box mage-theme">
            <div className="magic-time">{magicTime.toFixed(1)}초</div>
            <div className="power-bar-container"><div className="power-bar-fill" style={{ width: `${Math.min(100, (magicPower / 50) * 100)}%` }}></div></div>
            <p className="game-msg">50회 영창하세요!</p>
          </div>
          <div className="answer-buttons">
            {countdown !== null ? ( <div className="countdown-display">{countdown}</div> ) : (
              <>
                {magicStatus === 'idle' && <button onClick={() => startWithCountdown(startMagicGame)} className="pixel-button start-btn">영창 시작</button>}
                {magicStatus !== 'idle' && (
                  <button 
                    /* onClick 대신 onPointerDown 사용 시 반응 속도가 훨씬 빠릅니다 */
                    onPointerDown={(e) => {
                      e.preventDefault(); // 브라우저 기본 동작 방지
                      handleChantClick();
                    }}
                    className={`pixel-button chant-btn ${magicStatus !== 'playing' ? 'disabled' : ''}`} 
                    disabled={magicStatus !== 'playing'}
                  >
                    영창 연타!!!
                  </button>
                )}
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
          <div className="lore-box">
            <p><strong>"혼돈 속에서 성스러운 빛을 찾아라!"</strong></p>
            <p style={{ fontSize: '14px', color: '#bdc3c7', marginTop: '5px' }}>
              동료들을 치유하기 위해 나타나는 성스러운 표식을 빠르게 터치하세요!
            </p>
          </div>
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
           <input 
              name="phone" 
              placeholder="01012345678 (숫자만 입력 가능)" 
              required 
              style={{ textAlign: 'center' }} 
            />
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
      <div className="header-status-bar">
        <div className="header-content">
          <div className="header-title" onClick={() => window.location.reload()}>나만의 용사 전설</div>
          {((step === 'minigame_lion' && !isRunning && time > 0) || 
            (step === 'minigame_magic' && (magicStatus === 'win' || magicStatus === 'lose')) || 
            (step === 'minigame_priest' && priestStatus === 'end')
           ) && (
            <button onClick={handleWakeUp} className="header-wakeup-btn">🔮 깨어나기</button>
          )}
        </div>
      </div>
      <div className="main-content-wrapper">{renderScreen()}</div>
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