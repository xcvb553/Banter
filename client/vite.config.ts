import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'http://localhost:5080'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': API_TARGET,
            '/avatars': API_TARGET,
            '/uploads': API_TARGET,
            '/hubs': { target: API_TARGET, ws: true },
        },
    },
})
