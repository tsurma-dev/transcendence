import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000, // Suppress warning for chunks larger than 500kb (set to 2MB)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        // and dynamic import warnings for App.ts (expected due to circular dependency handling)
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids?.includes('App.ts')) ||
          warning.message.includes('is dynamically imported by') && warning.message.includes('App.ts')
        ) {
          return
        }
        warn(warning)
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  },
  server: {
    fs: {
      allow: ['..'] 
    }
  }
})