import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Expose to network
    hmr: {
        host: 'aaeon.fr',
        clientPort: 443, // Force HMR to use SSL port if proxied
        protocol: 'wss',
        path: '/vite-ws',
    },
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
