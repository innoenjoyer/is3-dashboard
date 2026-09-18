import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative so the static build works from any
// GitHub Pages subpath.
export default defineConfig({
  base: './',
  plugins: [react()],
})
