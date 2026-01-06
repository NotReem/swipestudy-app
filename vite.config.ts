import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env.* files if you use them locally (optional)
  const env = loadEnv(mode, '.', '');

  return {
    base: '/swipestudy-app/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // DO NOT use process.env in the browser. Use import.meta.env instead.
    // This define keeps any leftover process.env.GEMINI_API_KEY references from crashing.
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
