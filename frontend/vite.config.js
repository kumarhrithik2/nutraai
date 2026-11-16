import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// The browser always talks to the API through the Vite origin: the dev server proxies
// /api to Django. This keeps the HTTP-only refresh cookie first-party (SameSite=Lax, path
// /api/v1/auth/) so session restore and token refresh work in development without CORS.
const API_PREFIX = '/api'
const MEDIA_PREFIX = '/media'
const DEFAULT_PROXY_TARGET = 'http://127.0.0.1:8000'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || DEFAULT_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        [API_PREFIX]: {
          target: proxyTarget,
          changeOrigin: true,
        },
        [MEDIA_PREFIX]: {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        [API_PREFIX]: {
          target: proxyTarget,
          changeOrigin: true,
        },
        [MEDIA_PREFIX]: {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
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
  }
})
