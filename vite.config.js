// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/woody-test/',  // <-- ЗАМЕНИТЕ на название вашего репозитория
  build: {
    outDir: 'dist',
  }
})