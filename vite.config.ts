import { extname, resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          if (req.url && /\.(mp4|webm|ogg|png|ico|svg|jpg|jpeg)$/.test(req.url)) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

            if (req.url.includes('favicon')) {
              res.setHeader('Content-Type', 'image/x-icon')
            }
          }

          next()
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    copyPublicDir: false,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.names?.[0]) return ''

          const name = assetInfo.names[0].split('/').pop()
          const ext = extname(assetInfo.names[0])

          if (name && name.endsWith('.css')) {
            return `styles/${name}`
          }
          if (['.mp4', '.webm', '.ogg'].includes(ext || '')) {
            return 'videos/[name][extname]'
          }

          return '[name][extname]'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      strict: true,
      allow: ['..']
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  }
})
