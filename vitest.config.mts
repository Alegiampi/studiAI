import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
