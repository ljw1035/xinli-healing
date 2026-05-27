import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/心理机器人/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173
  }
});
