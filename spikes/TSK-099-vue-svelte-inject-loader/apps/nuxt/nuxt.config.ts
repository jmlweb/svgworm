export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: process.env.SPIKE_SSR !== '0',
  devtools: { enabled: false },
  telemetry: false,
  nitro: { output: { dir: process.env.SPIKE_OUT } },
});
