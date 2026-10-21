import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

function productionApiGuard(env: Record<string, string>): Plugin {
  return {
    name: 'zentrorox-production-api-guard',
    config(_config, { mode }) {
      if (mode !== 'production') return
      if (env.VITE_USE_LOCAL_API === 'true') {
        throw new Error('Production build blocked: VITE_USE_LOCAL_API=true is not allowed.')
      }
      if (!env.VITE_API_BASE_URL?.trim()) {
        throw new Error('Production build blocked: set VITE_API_BASE_URL (e.g. https://api.example.com/api/v1).')
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [productionApiGuard(env), react(), tailwindcss()],
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        // Used when VITE_API_BASE_URL=/api/v1 — avoids CORS; target is local Backend only.
        '/api/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
