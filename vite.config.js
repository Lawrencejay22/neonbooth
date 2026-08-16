import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        '..',
        'C:/Users/51y8/.gemini/antigravity-ide/brain/41d2c15a-36c2-489f-a519-f25076617ff0'
      ]
    }
  }
})
