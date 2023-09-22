const path = require("path");
const nodeExternals = require("webpack-node-externals");

const ENV = (() => {
  switch (process.env.ENV) {
    case "dev":
      return "development";
    case "prod":
    default:
      return "production";
  }
})();

module.exports = {
  entry: "./bin/www.js",
  mode: ENV,
  target: "node",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/
      }
    ]
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: [".js"]
  }
};
