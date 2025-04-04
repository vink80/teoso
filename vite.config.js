import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    react(),
    inject({  // Inietta automaticamente Buffer e process nei file
      Buffer: ['buffer', 'Buffer'],
      process: 'process'
    })
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process': JSON.stringify({ env: {} })
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      'node:buffer': 'buffer/'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
      plugins: [
        NodeGlobalsPolyfillPlugin({ process: true, buffer: true })
      ]
    }
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      plugins: [
        inject({ Buffer: ['buffer', 'Buffer'], process: 'process' })
      ]
    }
  }
});
