/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Evitar que pdf-parse intente cargar archivos de test
    config.resolve.alias.canvas = false;
    if (isServer) {
      config.resolve.alias["pdf-parse"] = require.resolve("pdf-parse/lib/pdf-parse.js");
    }
    return config;
  },
};

module.exports = nextConfig;
