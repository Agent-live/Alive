import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

async function probe(url: string, timeoutMs = 250): Promise<number | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    clearTimeout(t)
    return res.status
  } catch {
    return null
  }
}

async function detectApiProxyTarget(): Promise<string> {
  const envTarget = process.env.VITE_API_PROXY_TARGET
  if (envTarget && envTarget.trim()) return envTarget.trim()

  // Prefer the backend that supports newer endpoints. Any 2xx/3xx/401/403/405 means "route exists".
  const candidates = ['http://127.0.0.1:8889', 'http://127.0.0.1:8888']
  const probes = ['/api/v1/skill-shop/skills', '/api/v1/tasks/', '/api/v1/skills/']
  for (const base of candidates) {
    for (const p of probes) {
      const status = await probe(base + p)
      if (status !== null && status !== 404) return base
    }
  }

  return 'http://127.0.0.1:8888'
}

export default defineConfig(async () => {
  const apiProxyTarget = await detectApiProxyTarget()

  // eslint-disable-next-line no-console
  console.log(`[vite] API proxy target: ${apiProxyTarget}`)

  return {
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
      },
    },
  },
  // `vite preview` doesn't automatically proxy; keep API calls working in preview mode too.
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
}})
