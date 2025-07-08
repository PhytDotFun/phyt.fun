import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({ autoCodeSplitting: true }),
        viteReact({
            babel: {
                plugins: [['babel-plugin-react-compiler', { target: '19' }]]
            }
        }),
        tailwindcss()
    ],
    resolve: {
        alias: {
            $fonts: resolve(__dirname, './src/assets/fonts'),
            '@': resolve(__dirname, './src')
        }
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(
            process.env.NODE_ENV || 'development'
        )
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});
