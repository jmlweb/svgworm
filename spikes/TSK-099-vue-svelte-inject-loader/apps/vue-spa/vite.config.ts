import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [vue()], build: { outDir: process.env.SPIKE_OUT } });
