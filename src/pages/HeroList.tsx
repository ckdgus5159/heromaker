import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../App.css';

export default function HeroList() {
  const [heroes, setHeroes] = useState<any[]>([]);

  useEffect(() => {
    const fetchHeroes = async () => {
      const { data } = await supabase.from('heroes').select('*').order('created_at', { ascending: false });
      if (data) setHeroes(data);
    };
    fetchHeroes();
  }, []);

  return (
    <div style={{ padding: '20px', color: '#fff', fontFamily: 'DungGeunMo' }}>
      <h1 className="pixel-text">📜 생성된 용사 명부</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#2c3e50', textAlign: 'left' }}>
            <th>생성일</th><th>모드</th><th>이름</th><th>에니어</th><th>연락처</th>
          </tr>
        </thead>
        <tbody>
          {heroes.map(h => (
            <tr key={h.id} style={{ borderBottom: '1px solid #7f8c8d' }}>
              <td>{new Date(h.created_at).toLocaleString()}</td>
              <td>{h.mode === 'npc' ? '📱 NPC' : '💻 게임장'}</td>
              <td>{h.name} ({h.job})</td>
              <td>{h.enneagram_type}번</td>
              <td>{h.phone_number || '미입력'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}