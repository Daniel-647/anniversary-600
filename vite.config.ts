import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const productionBase = process.env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : './');

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? productionBase : '/',
  plugins: [
    {
      name: 'copy-data-json',
      closeBundle() {
        const source = resolve(__dirname, 'data');
        const target = resolve(__dirname, 'dist/data');
        if (existsSync(source)) {
          cpSync(source, target, { recursive: true });
        }
      },
    },
  ],
});
