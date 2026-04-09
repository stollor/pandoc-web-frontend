import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  assetsInclude: ['**/*.wasm'],
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.pnpm-store/**']
    }
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    nodePolyfills(),
    topLevelAwait()
  ],
  worker: {
    format: 'es',
    plugins: () => [
      topLevelAwait()
    ]
  }
})
