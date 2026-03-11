import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from './package.json'

import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${new Date().getFullYear()} ${pkg.author.split(' <')[0]}
 * @license ${pkg.license}
 */`

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
      external: ['vue' /*, '@alekstar79/context-menu' */],
      output: {
        globals: {
          // '@alekstar79/context-menu': 'ContextMenu',
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
    sourcemap: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  }
})
