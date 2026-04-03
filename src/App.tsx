import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Game from './pages/Game';
import Admin from './pages/Admin';
import HeroList from './pages/HeroList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/herolist" element={<HeroList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;