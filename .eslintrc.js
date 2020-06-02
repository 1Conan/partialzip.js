module.exports = {
  plugins: [
    'eslint-plugin-tsdoc'
  ],
  extends: [
    '@tsssaver/eslint-config',
  ],
  rules: {
    'tsdoc/syntax': 'warn',
  },
};
