module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'no-plusplus': 'off',
    'no-loop-func': 'off',
    'import/no-unresolved': 'off',
    semi: 'off',
    'max-len': ['error', { code: 120 }],
    'no-param-reassign': ['error', { props: false }],
    // 'no-unused-vars': ['warn'],
    '@typescript-eslint/no-unused-vars': [2],
    '@typescript-eslint/no-shadow': ['warn'],
    'import/extensions': [2, 'never', { 'web.js': 'never', json: 'never' }],
  },
};
