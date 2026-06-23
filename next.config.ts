import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Anthropic SDK precisa rodar no Node.js runtime, não no Edge
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
