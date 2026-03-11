import { extname, resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'

import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${new Date().getFullYear()} ${pkg.author.split(' <')[0]}
 * @license ${pkg.license}
 */`

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/posters',
          dest: ''
        }
      ]
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    extensions: ['.ts', '.vue']
  },
  build: {
    outDir: 'dist',
    copyPublicDir: false,
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
        preamble: banner,
      },
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
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
    port: 3000
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  }
})
