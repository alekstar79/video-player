import { defineConfig } from 'vite'
import { resolve } from 'path'

import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      outDir: 'lib',
      exclude: [
        'src/__tests__',
        'src/**/*.test.ts',
        'src/main.ts'
      ],
      entryRoot: 'src',
      copyDtsFiles: false
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
    extensions: ['.ts', '.vue']
  },
  build: {
    lib: {
      entry: {
        'video-player': resolve(__dirname, 'src/index.ts'),
        'video-player-vue': resolve(__dirname, 'src/vue.ts'),
        'styles': resolve(__dirname, 'src/scss/styles.scss')
      },
      name: 'VideoPlayer',
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.names?.[0]) return ''

          const name = assetInfo.names[0].split('/').pop()

          if (name && name.endsWith('.css')) {
            return `styles.css`
          }

          return '[name][extname]'
        }
      }
    },
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'es2024',
    minify: 'esbuild',
    sourcemap: true,
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
