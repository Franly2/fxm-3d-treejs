import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
    {
      name: 'file-protocol-compat',
      enforce: 'post',
      generateBundle: {
        order: 'post',
        handler(_options, bundle) {
          for (const key of Object.keys(bundle)) {
            if (key.endsWith('.html')) {
              const item = bundle[key];
              if ('source' in item && typeof item.source === 'string') {
                item.source = item.source
                  .replace(/<script type="module" crossorigin>/g, '<script defer>')
                  .replace(/<script type="module">/g, '<script defer>');
              }
            }
          }
        },
      },
    },
  ],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
});
