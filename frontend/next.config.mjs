/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // hostname: "fomo.cryptoprince0207.online",
        hostname: "ohio.fun",
      },
    ],
    unoptimized: true
  },
};

export default nextConfig;
