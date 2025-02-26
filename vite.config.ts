import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Scarlett Tutor',
        short_name: 'Scarlett Tutor',
        description: 'AI + Anki on Web3 with',
        theme_color: '#18181B',
        background_color: '#18181B',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ceramic-orbisdb-mainnet-direct\.hirenodes\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'orbis-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/testnet\.tableland\.network\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tableland-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/.*\.w3ipfs\.storage\/ipfs\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-media-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Polyfills for Node.js built-ins
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      crypto: 'crypto-browserify',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      events: 'events',
      path: 'path-browserify',
      process: 'process/browser',
      zlib: 'browserify-zlib'
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    process: {
      env: {},
      browser: true,
      version: '"v16.7"',
      nextTick: 'setImmediate'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Service-Worker-Allowed': '/'
    },
    proxy: {
      // Add any proxy configurations if needed
    },
    hmr: {
      clientPort: 443,
      host: '0.0.0.0'
    },
    // Allow all ngrok domains
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app',
      '.ngrok.io'
    ]
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 8000, // Increase warning limit to 8MB
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-wagmi': ['wagmi', '@wagmi/core', 'viem'],
          'vendor-lit-core': ['@lit-protocol/lit-node-client'],
          'vendor-lit-auth': ['@lit-protocol/auth-browser'],
          'vendor-tanstack': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-toast']
        }
      }
    }
  }
})
