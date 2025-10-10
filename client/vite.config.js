// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) =>
  defineConfig({
    plugins: [react()],
    // dev => '/', GitHub Pages => '/chalin-shop-beginner/'
    base: mode === 'pages' ? '/chalin-shop-beginner/' : '/',
  })
