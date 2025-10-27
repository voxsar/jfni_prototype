import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3002,
    cors: true,
	allowedHosts: ['.localhost', '.ngrok.io', '.com', 'jfnidemo.dev.artslabcreatives.com']
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
