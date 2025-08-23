import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    // Enable minification
    minify: 'terser',
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable tree shaking
    target: 'es2015',
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: (id) => {
          // React and related libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor'
          }
          // Material-UI
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui-vendor'
          }
          // Chart libraries (only recharts now)
          if (id.includes('recharts')) {
            return 'charts-vendor'
          }
          // Utility libraries
          if (id.includes('axios') || id.includes('xlsx') || id.includes('file-saver') ||
            id.includes('jspdf')) {
            return 'utils-vendor'
          }
          // Bootstrap
          if (id.includes('bootstrap')) {
            return 'bootstrap-vendor'
          }
          // FontAwesome
          if (id.includes('@fortawesome')) {
            return 'icons-vendor'
          }
        },
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Enable terser optimizations
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      'axios',
      'xlsx',
    ],
    exclude: [
      // Exclude large libraries that are not needed in dev
      'jspdf',
      'jspdf-autotable',
    ],
  },
  // Enable CSS code splitting
  cssCodeSplit: true,
  // Disable source maps in development for faster builds
  esbuild: {
    drop: ['console', 'debugger'],
  },
  // Development server optimizations
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Preview server optimizations
  preview: {
    port: 4173,
    host: true,
  },
}))
