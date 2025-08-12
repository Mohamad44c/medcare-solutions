import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle source map files in chrome-aws-lambda
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });

    return config;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
