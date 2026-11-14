import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /[\\/]node_modules[\\/]three[\\/]/,
            },
            {
              name: 'react-three-fiber',
              test: /[\\/]node_modules[\\/]@react-three[\\/]fiber[\\/]/,
            },
          ],
        },
      },
    },
  },
})
