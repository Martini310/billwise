// module.exports = {
//   reactStrictMode: true,
//   // exclude: [/node_modules/, /build/, /dist/, /last/],
// };
module.exports = {
  reactStrictMode: true,

  // Add Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Ensure HMR works only during development
    if (dev && !isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false }; // Prevent fs module issues
    }

    return config;
  },

  // Optionally, you can configure CORS in case external APIs are involved (temporary solution for development)
  async headers() {
    return [
      {
        source: '/(.*)',  // Apply CORS headers to all routes
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',  // Allow access from all origins (development only)
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};