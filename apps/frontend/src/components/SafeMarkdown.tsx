'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>,
});

interface SafeMarkdownProps {
  content: string;
}

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
              // --- CORREÇÃO APLICADA AQUI ---
              style={vscDarkPlus as any}
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
