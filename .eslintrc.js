module.exports = {
  extends: ['airbnb-typescript/base'],
  plugins: [
    'eslint-plugin-tsdoc',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      'typescript': {}
    },
  },
  rules: {
    'tsdoc/syntax': 'error',
    'no-bitwise': 'off',
  },
};
