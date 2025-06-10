import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Use SWC minification instead of Terser
    swcMinify: true,

    // Output stand-alone mode for better performance
    //output: 'standalone',

    // Image optimization
    images: {
        //domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
    },

    // Experimental features
    experimental: {
        // Optimize CSS processing
        optimizeCss: true,

        // Restore scroll position when navigating back
        scrollRestoration: true,
    },

    // Production optimizations
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Custom webpack configuration
    webpack(config, { dev, isServer }) {
        // Add optimizations for client bundles in production
        if (!dev && !isServer) {
            // Configure bundle splitting
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 70000,
                    cacheGroups: {
                        defaultVendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                            reuseExistingChunk: true,
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }

        return config;
    },
}