"use client";

import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export const CodeBlock: FC<CodeBlockProps> = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';

  // O markdown-to-jsx passa o código como uma string dentro de um array em 'children'
  const code = Array.isArray(children) ? children[0] : children;

  if (typeof code !== 'string') {
    return null;
  }

  return (
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={lang}
      PreTag="div"
    >
      {code.replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};
