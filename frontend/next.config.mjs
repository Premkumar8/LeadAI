/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel deploys Next.js natively - no 'output: standalone' needed
  // NEXT_PUBLIC_API_URL is set in Vercel Dashboard > Environment Variables
};

export default nextConfig;

