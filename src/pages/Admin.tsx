import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Admin() {
  const navigate = useNavigate();

  // 특정 게임 단계로 데이터와 함께 이동시키는 함수
  const jumpToGame = (stepName: string) => {
    navigate('/game', { state: { shortcut: stepName } });
  };

  return (
    <div className="game-container start-screen admin-page">
      <h1 className="pixel-text title" style={{ color: '#e74c3c' }}>개발자 통제실</h1>
      <p className="subtitle">관리자 전용 페이지입니다.</p>

      {/* 🚀 미니게임 즉시 테스트 구역 */}
      <div className="admin-shortcut-zone" style={{ width: '100%', marginBottom: '20px' }}>
        <p className="stat-label" style={{ color: '#f1c40f', marginBottom: '10px' }}>[ 미니게임 강제 진입 ]</p>
        <div className="answer-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={() => jumpToGame('minigame_lion')} className="pixel-button lion-btn" style={{fontSize: '14px', padding: '12px'}}>🦁 사자 길드</button>
          <button onClick={() => jumpToGame('minigame_magic')} className="pixel-button mage-btn" style={{fontSize: '14px', padding: '12px'}}>🔮 지혜 마탑</button>
          <button onClick={() => jumpToGame('minigame_priest')} className="pixel-button priest-btn" style={{fontSize: '14px', padding: '12px'}}>🌙 신성 교단</button>
          <button onClick={() => jumpToGame('result')} className="pixel-button" style={{fontSize: '14px', padding: '12px', backgroundColor: '#9b59b6'}}>🏆 결과 창</button>
        </div>
      </div>

      <div className="answer-buttons" style={{ width: '100%' }}>
        <button onClick={() => navigate('/herolist')} className="pixel-button">DB 용사 목록 보기 (/herolist)</button>
        <button onClick={() => navigate('/')} className="pixel-button gray">메인 화면으로 돌아가기</button>
      </div>
    </div>
  );
}