module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: 'standard-with-typescript',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  ignorePatterns: [ '*.js' ], // TS-only plz!
  rules: {
    'linebreak-style': [ 'error', 'unix' ], // deploy to Docker (Alpine Linux)
    yoda: [ 'error', 'never', { exceptRange: true } ],
    '@typescript-eslint/semi': [ 'error', 'always' ], // avoid ambiguity
    '@typescript-eslint/comma-dangle': [ 'error', 'only-multiline' ],
    '@typescript-eslint/no-unused-vars': [ 'error', {
      'vars': 'all',
      'varsIgnorePattern': '^\_',
      'args': 'all',
      'argsIgnorePattern': '^\_',
      'caughtErrors': 'all',
      'caughtErrorsIgnorePattern': '^\_',
      'destructuredArrayIgnorePattern': '^\_',
    } ],
  },
}
