/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Evitar que pdf-parse intente cargar archivos de test
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
