import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site: 'https://scc-group.asia',
  base: '/certification',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel(),
  integrations: [solidJs()],
});
