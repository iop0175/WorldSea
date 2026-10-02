import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // Phaser는 크기가 커서 따로 청크로 나눈다
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600,
  },
});
