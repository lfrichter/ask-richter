
'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

// Importação dinâmica para resolver problemas de tipo no build de produção
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false, // Garante que o componente só renderize no cliente
  loading: () => <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>,
});

interface SafeMarkdownProps {
  content: string;
}

// Usamos memo para otimizar a performance, evitando re-renderizações desnecessárias
export const SafeMarkdown = memo(({ content }: SafeMarkdownProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...rest}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code {...rest} className="bg-gray-200 text-black px-1 rounded">
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

SafeMarkdown.displayName = 'SafeMarkdown';
