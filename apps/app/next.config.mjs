/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
    };

    // Add top-level await support
    config.experiments = {
      layers: true,
      topLevelAwait: true,
    };

    // Exclude SVG from Next.js Image Optimization
    config.module.rules = config.module.rules.map((rule) => {
      if (rule.loader === 'next-image-loader') {
        return {
          ...rule,
          test: /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)/i,
        };
      }
      return rule;
    });

    // For SVG imported with querty ?url (e.g. import Logo from './logo.svg?url'), use next-image-loader
    config.module.rules.push({
      options: config.module.rules.find((rule) => rule.loader === 'next-image-loader').options,
      loader: 'next-image-loader',
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: /url/, // image if *.svg?url
    });

    // For SVG imported without querty ?url (e.g. import Logo from './logo.svg'), use @svgr/webpack to convert to React component
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: {
        not: [/url/],
      }, // exclude react component if *.svg?url
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            prettier: false,
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      // disable plugins
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
  reactStrictMode: true,
  env: {
    PORT: process.env.PORT || 3000,
    APP_ENV: process.env.APP_ENV,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  },
  output: 'standalone',
  images: {
    domains: ['assets.coingecko.com', 'raw.githubusercontent.com'],
  },
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: {
      ssr: false,
    },
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['mongoose'],
  },
};

export default nextConfig;
