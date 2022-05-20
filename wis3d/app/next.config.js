const path = require("path");

module.exports = {
  webpack(config) {
    const three = path.resolve(__dirname, "utils/three");
    config.resolve.alias["three$"] = three;

    return config;
  },
  distDir: process.env.NODE_ENV === "production" ? "build/release" : "build/dev",
  reactStrictMode: true
};
