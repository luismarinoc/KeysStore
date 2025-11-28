import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5174,
        strictPort: true,
        hmr: {
            clientPort: 443,
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 5174,
        strictPort: true,
        allowedHosts: ['keys.tbema.net', 'localhost'],
    },
});
