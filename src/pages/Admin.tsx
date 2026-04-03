import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Admin() {
  const navigate = useNavigate();

  const jumpToGame = (stepName: string) => {
    // 🌟 핵심: '/game' 경로로 shortcut 상태를 담아 보냄
    navigate('/game', { state: { shortcut: stepName } });
  };

  return (
    <div className="game-container start-screen admin-page">
      <h1 className="pixel-text title" style={{ color: '#e74c3c' }}>개발자 통제실</h1>
      
      <div className="admin-shortcut-zone" style={{ width: '100%', marginBottom: '20px' }}>
        <p style={{ color: '#f1c40f', marginBottom: '10px' }}>[ 테스트 단축키 ]</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => jumpToGame('minigame_lion')} className="pixel-button lion-btn" style={{fontSize: '12px'}}>사자 훈련</button>
          <button onClick={() => jumpToGame('minigame_magic')} className="pixel-button mage-btn" style={{fontSize: '12px'}}>마탑 훈련</button>
          <button onClick={() => jumpToGame('minigame_priest')} className="pixel-button priest-btn" style={{fontSize: '12px'}}>교단 훈련</button>
          <button onClick={() => jumpToGame('result')} className="pixel-button" style={{fontSize: '12px', background:'#9b59b6'}}>결과창</button>
        </div>
      </div>

      <div className="answer-buttons" style={{ width: '100%' }}>
        <button onClick={() => navigate('/herolist')} className="pixel-button">용사 목록</button>
        <button onClick={() => navigate('/')} className="pixel-button gray">메인으로</button>
      </div>
    </div>
  );
}