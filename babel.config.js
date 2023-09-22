module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        corejs: 2,
        useBuiltIns: "usage"
      }
    ]
  ],
  plugins: [],
  sourceType: "unambiguous"
};
