import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startGame } from './game/start';
import { App } from './ui/App';
import { startSession } from './session';
import './ui/styles.css';

// Phaser 캔버스(#game)를 아래에, React UI(#ui)를 그 위에 겹친다.
startGame('game');
startSession();
createRoot(document.getElementById('ui')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
