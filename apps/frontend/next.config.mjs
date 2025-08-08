/** @type {import('next').NextConfig} */
const nextConfig = {
  // Força o Next.js a compilar estas bibliotecas, resolvendo incompatibilidades de tipo no build
  transpilePackages: ['react-markdown', 'remark-gfm'],

  async rewrites() {
    return [
      {
        source: '/api/chat',
        // IMPORTANTE: Esta URL é para desenvolvimento LOCAL.
        // Em produção, a variável NEXT_PUBLIC_API_BASE_URL será usada.
        destination: 'http://localhost:3001/api/chat',
      },
    ];
  },
};

export default nextConfig;
