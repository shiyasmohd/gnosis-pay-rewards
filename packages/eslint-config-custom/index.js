module.exports = {
  extends: ['turbo', 'prettier', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  env: {
    es6: true,
  },
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage', 'src/**/*.d.ts', 'src/**/generated'],
};
