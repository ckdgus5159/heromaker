import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Admin() {
  const navigate = useNavigate();
  return (
    <div className="game-container start-screen">
      <h1 className="pixel-text title" style={{ color: '#e74c3c' }}>개발자 통제실</h1>
      <p className="subtitle">관리자 전용 페이지입니다.</p>
      <div className="answer-buttons">
        <button onClick={() => navigate('/herolist')} className="pixel-button">DB 용사 목록 보기 (/herolist)</button>
        <button onClick={() => navigate('/')} className="pixel-button gray">메인 화면으로 돌아가기</button>
      </div>
    </div>
  );
}