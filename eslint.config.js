import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  prettier,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      jsdoc,
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'warn',
      'jsdoc/valid-types': 'warn',
    },
  },

  {
    ignores: ['node_modules/**', 'build/**', 'dist/**', '*.config.js', 'pnpm-lock.yaml'],
  },
];
