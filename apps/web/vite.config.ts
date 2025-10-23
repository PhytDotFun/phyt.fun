import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const API_ORIGIN = process.env.VITE_API_URL ?? 'http://localhost:3000';

export default defineConfig({
    plugins: [
        tanstackRouter({ autoCodeSplitting: true }),
        // React 19 + Compiler
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', { target: '19' }]]
            },
            jsxImportSource: 'react'
        }),
        tailwindcss()
    ],
    resolve: {
        alias: {
            $fonts: resolve(__dirname, './src/assets/fonts'),
            '@': resolve(__dirname, './src')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(
            process.env.NODE_ENV || 'development'
        )
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': { target: API_ORIGIN, changeOrigin: true },
            '/trpc': { target: API_ORIGIN, changeOrigin: true }
        }
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@tanstack/react-query',
            '@tanstack/react-router'
        ]
    },
    build: {
        target: 'esnext'
    }
});
