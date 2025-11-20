import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const browserGlobals = {
  ...globals.browser,
  ...globals.es2021,
};

const nodeGlobals = {
  ...globals.node,
  ...globals.es2021,
};

const testGlobals = {
  ...browserGlobals,
  ...globals.vitest,
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'build',
      'coverage',
      'node_modules',
      'eslint.config.js',
      '**/*.config.js',
      'src/Dockerfile/**',
      'src/docker-compose.yml.tsx',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: [
      '*.config.{js,ts,mjs,cjs}',
      '**/*.config.{js,ts}',
      'vitest.config.ts',
      'vite.config.ts',
      'scripts/**/*.{js,ts}',
    ],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: [
      'src/tests/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    languageOptions: {
      globals: testGlobals,
    },
  }
);
