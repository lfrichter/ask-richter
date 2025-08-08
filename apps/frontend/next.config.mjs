/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! AVISO !!
    // Permite perigosamente que builds de produção sejam concluídos com sucesso
    // mesmo que o projeto tenha erros de tipo.
    ignoreBuildErrors: true,
  },

  // Manteremos estas configurações por robustez
  // transpilePackages: ['react-markdown', 'remark-gfm'],
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/chat',
  //       destination: 'http://localhost:3001/api/chat',
  //     },
  //   ];
  // },
};

export default nextConfig;
