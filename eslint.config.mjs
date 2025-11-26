
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import security from 'eslint-plugin-security';
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: [
    'dist/',
    'src/dist/',
    'src/data-pipeline/**/*.js',
  ]
}, ...compat.extends('next/core-web-vitals', 'next/typescript'), prettierConfig, security.configs.recommended, // Allow require() in CommonJS files
{
  files: ['**/*.cts', '**/*.cjs'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
}, // Enforce no-explicit-any as an error
{
  files: ['**/*.ts', '**/*.tsx'], // Apply to TypeScript files
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
}];

export default eslintConfig;
