import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site: 'https://scc-group.asia',
  base: '/certification',
  trailingSlash: 'never',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [solidJs()],
});
