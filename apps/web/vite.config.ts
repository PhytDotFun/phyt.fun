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
        allowedHosts: ['on-marmot-finer.ngrok-free.app'],
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/trpc': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/wh': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Create a chunk for the Privy vendor files
                    if (id.includes('@privy-io')) {
                        return 'privy-vendor';
                    }
                    // Create a chunk for the TanStack vendor files
                    if (id.includes('@tanstack')) {
                        return 'tanstack-vendor';
                    }
                    // Create a chunk for the main UI libraries
                    if (
                        id.includes('@radix-ui') ||
                        id.includes('cmdk') ||
                        id.includes('vaul') ||
                        id.includes('lucide-react')
                    ) {
                        return 'ui-vendor';
                    }
                    // Create a chunk for charting libraries
                    if (id.includes('recharts')) {
                        return 'chart-vendor';
                    }
                    // Create a chunk for React itself
                    if (id.includes('react') || id.includes('react-dom')) {
                        return 'react-vendor';
                    }
                    // All other node_modules go to a general vendor chunk
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            },
            onwarn(warning, warn) {
                // Suppress all 'INVALID_ANNOTATION' warnings, regardless of the package
                if (warning.code === 'INVALID_ANNOTATION') {
                    return;
                }
                // Use the default Rollup warner for all other warnings
                warn(warning);
            }
        }
    }
});
