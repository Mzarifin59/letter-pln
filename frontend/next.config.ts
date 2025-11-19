/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin-sigaspol.co.id",
      },
    ],
  },
};

module.exports = nextConfig;
