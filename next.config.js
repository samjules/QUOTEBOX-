/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // mapbox-gl uses a worker that can conflict with webpack chunking
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    }
    return config
  },
}

module.exports = nextConfig
