// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chalin-shop-beginner/', // ใช้ชื่อ repo ของคุณ
      dedupe: ['react', 'react-dom'] // บังคับให้ใช้ React ชุดเดียว

})
