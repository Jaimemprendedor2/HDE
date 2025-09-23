import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración mínima absoluta para Netlify
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
