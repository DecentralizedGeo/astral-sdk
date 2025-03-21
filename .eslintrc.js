module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    node: true,
    browser: true,
    es6: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // Enforce architectural boundaries
    'no-restricted-imports': ['error', {
      patterns: [
        // Prevent importing onchain components in offchain files
        {
          group: ['*/onchain/*'],
          message: 'Importing onchain components in offchain files is not allowed due to architecture boundaries',
        },
        // Prevent importing offchain components in onchain files
        {
          group: ['*/offchain/*'],
          message: 'Importing offchain components in onchain files is not allowed due to architecture boundaries',
        },
      ],
    }],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};