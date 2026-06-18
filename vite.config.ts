import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    mode !== 'singlefile' ? VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg'],
      manifest: {
        name: 'DiffView - Text Compare Tool',
        short_name: 'DiffView',
        description: 'Browser-based text diff tool. All processing happens locally.',
        theme_color: '#4a9eff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      }
    }) : null,
    mode === 'singlefile' ? viteSingleFile() : null
  ].filter(Boolean),
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: mode === 'singlefile' ? 'dist-single' : 'dist'
  }
}))
