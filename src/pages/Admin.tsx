import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // 🌟 supabase 임포트 확인
import '../App.css';

export default function Admin() {
  const navigate = useNavigate();

  // 특정 게임 단계로 이동
  const jumpToGame = (stepName: string) => {
    navigate('/game', { state: { shortcut: stepName } });
  };

  // 🚀 [핵심 추가] DB에 강제로 정해진 데이터를 넣는 함수
  const testDbInsert = async () => {
    console.log("--- DB 강제 삽입 테스트 시작 ---");
    
    const testData = {
      name: "터미널용사",
      age: "25",
      job: "테스터",
      hobby: "키보드",
      defense: "잠자기",
      enneagram_type: 1,
      mode: "arcade",
      phone_number: "01033876294"
    };

    try {
      const { data, error } = await supabase
        .from('heroes')
        .insert([testData])
        .select();

      if (error) {
        console.error("테스트 삽입 실패:", error);
        alert(`삽입 실패: ${error.message}`);
      } else {
        console.log("테스트 삽입 성공:", data);
        alert("🎉 DB에 '터미널용사' 데이터가 성공적으로 삽입되었습니다! Table Editor를 확인하세요.");
      }
    } catch (err) {
      console.error("예상치 못한 오류:", err);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <div className="game-container start-screen admin-page">
      <h1 className="pixel-text title" style={{ color: '#e74c3c' }}>개발자 통제실</h1>
      
      {/* 🚀 DB 테스트 버튼 구역 */}
      <div className="admin-shortcut-zone" style={{ width: '100%', marginBottom: '20px' }}>
        <p style={{ color: '#2ecc71', marginBottom: '10px' }}>[ 시스템 연결 테스트 ]</p>
        <button 
          onClick={testDbInsert} 
          className="pixel-button" 
          style={{ backgroundColor: '#27ae60', borderBottomColor: '#219150', marginBottom: '20px' }}
        >
          ⚡ DB 강제 데이터 삽입 테스트
        </button>

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