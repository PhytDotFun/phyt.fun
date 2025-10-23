import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const API_ORIGIN = process.env.VITE_API_URL ?? 'http://localhost:3000';

const isReact = (id: string) =>
    /[/\\]node_modules[/\\]react(?:[/\\]|$)/.test(id);
const isReactDOM = (id: string) =>
    /[/\\]node_modules[/\\]react-dom(?:[/\\]|$)/.test(id);

export default defineConfig({
    plugins: [
        tanstackRouter({ autoCodeSplitting: true }),
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
        target: 'esnext',
        rollupOptions: {
            output: {
                // keep React + TanStack together to avoid load-order/interop issues
                manualChunks(id) {
                    if (
                        id.includes('@tanstack') ||
                        isReact(id) ||
                        isReactDOM(id)
                    ) {
                        return 'react-tanstack';
                    }
                    if (id.includes('@privy-io')) return 'privy-vendor';
                    if (
                        id.includes('@radix-ui') ||
                        id.includes('cmdk') ||
                        id.includes('vaul') ||
                        id.includes('lucide-react')
                    ) {
                        return 'ui-vendor';
                    }
                    if (id.includes('recharts')) return 'chart-vendor';
                    if (id.includes('node_modules')) return 'vendor';
                }
            },
            onwarn(warning, warn) {
                if (warning.code !== 'INVALID_ANNOTATION') warn(warning);
            }
        }
    }
});
