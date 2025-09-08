import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  server: {
    // Proxy API requests to the backend server
    proxy: {
      '/api': 'http://localhost:5005',
    },
  },
  // resolve => animations
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
    },
  },
});
