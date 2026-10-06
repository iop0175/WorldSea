import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FishPreview } from './FishPreview';
import './preview.css';

// 개발용 도구 페이지: 물고기 겹 파일을 넣으면 유전자 조합별 합성 결과와 규격 검사 결과를 보여 준다 (docs/fish-art.md)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FishPreview />
  </StrictMode>,
);
