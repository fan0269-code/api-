import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/v1': 'http://127.0.0.1:8080',
      '/v1beta': 'http://127.0.0.1:8080',
      '/backend-api': 'http://127.0.0.1:8080',
      '/antigravity': 'http://127.0.0.1:8080',
      '/openai': 'http://127.0.0.1:8080',
      '/responses': 'http://127.0.0.1:8080',
      '/images': 'http://127.0.0.1:8080',
      '/chat': 'http://127.0.0.1:8080',
      '/embeddings': 'http://127.0.0.1:8080'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: './src/test/setup.ts'
  }
});
