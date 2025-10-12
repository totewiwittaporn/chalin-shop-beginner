// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default ({ mode }) =>
  defineConfig({
    plugins: [react()],
    base: mode === 'pages' ? '/chalin-shop-beginner/' : '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  })
