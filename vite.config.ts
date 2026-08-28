import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: isSsrBuild ? 'dist/server' : 'dist/client',
      rollupOptions: isSsrBuild
        ? {}
        : {
            // صفحة الداشبورد (admin.html) تُبنى كتطبيق منفصل تمامًا عن المتجر
            // (CSR بحت، بدون SSR)، حتى لا تكبر حزمة جافاسكربت الخاصة بالمتجر.
            input: {
              main: path.resolve(__dirname, 'index.html'),
              admin: path.resolve(__dirname, 'admin.html'),
            },
            output: {
              manualChunks(id) {
                if (
                  id.includes('node_modules/react/') ||
                  id.includes('node_modules/react-dom/')
                ) {
                  return 'vendor-react';
                }
                if (id.includes('node_modules/lucide-react/')) {
                  return 'vendor-icons';
                }
                if (id.includes('node_modules/@supabase/')) {
                  return 'vendor-supabase';
                }
              },
            },
          },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
