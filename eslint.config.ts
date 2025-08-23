import js from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(globalIgnores(['dist']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  rules: {
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/dot-notation': [
      'error',
      {
        allowIndexSignaturePropertyAccess: true,
      },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allow: [{ name: ['Error', 'URL', 'URLSearchParams'], from: 'lib' }],
        allowAny: false,
        allowArray: false,
        allowBoolean: true,
        allowNever: false,
        allowNullish: true,
        allowNumber: true,
        allowRegExp: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],
  },
  languageOptions: {
    ecmaVersion: 2022,
    globals: { ...globals.browser, ...globals.vitest },
    parserOptions: {
      project: [
        './tsconfig.lib.json',
        './tsconfig.test.json',
        './tsconfig.node.json',
      ],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
