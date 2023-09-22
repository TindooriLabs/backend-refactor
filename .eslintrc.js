module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "no-useless-escape": "off",
    "no-unused-vars": "error",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^\_",
        args: "all",
        argsIgnorePattern: "^\_" //This might be broken https://github.com/eslint/eslint/issues/13999
      }
    ]
  },
  plugins: ["unused-imports"],
  ignorePatterns: ["**/build/index.js", "*.test.js", "*.ts"],
};
