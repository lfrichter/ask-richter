/** @type {import('next').NextConfig} */
const nextConfig = {
  // Força o Next.js a compilar estas bibliotecas, resolvendo incompatibilidades
  transpilePackages: ['react-markdown', 'remark-gfm'],

  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: 'http://localhost:3001/api/chat',
      },
    ];
  },
};

export default nextConfig;
