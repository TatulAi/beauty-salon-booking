import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Fixed and strict rather than "pick the next free port" — the Google/
    // Supabase OAuth redirect allow-list is keyed to an exact origin, so a
    // silently-different port would break the login flow with no obvious
    // error. Other projects' dev servers on 5173-5174 are left alone.
    port: 5183,
    strictPort: true,
  },
})
