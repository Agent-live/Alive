import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Set VITE_API_PROXY_TARGET env to override (e.g. http://127.0.0.1:8889)
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8888'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const serverRes = res as {
              headersSent?: boolean
              writeHead: (statusCode: number, headers: Record<string, string>) => void
              end: (chunk?: string) => void
            }
            if (serverRes.headersSent) return
            serverRes.writeHead(503, { 'Content-Type': 'application/json' })
            serverRes.end(JSON.stringify({
              code: 'BACKEND_UNAVAILABLE',
              message: `API backend is unreachable at ${apiProxyTarget}`,
            }))
          })
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
