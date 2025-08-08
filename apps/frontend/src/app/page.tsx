'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SendHorizonal } from 'lucide-react';
import Markdown from 'markdown-to-jsx'; // <-- Nova importação
import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import myAdjustedOk from '../../images/AvatarCircle.png';

// Componente customizado para blocos de código, para ser usado com a nova biblioteca
const CodeBlock = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const language = className?.replace('lang-', '') || 'text';
  return (
    <SyntaxHighlighter style={vscDarkPlus as any} language={language} PreTag="div">
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  // A lógica de estado e a função handleSubmit permanecem as mesmas
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'assistant', content: 'Olá! Sou o **Ask Richter**...' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) { throw new Error(`Erro na API: ${response.statusText}`); }
      const data = await response.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.answer || "Resposta inválida." };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 2).toString(), role: 'assistant', content: "Desculpe, erro ao conectar." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center">
            <Image src={myAdjustedOk} alt="Luis Fernando Richter" width={50} height={50} className="rounded-full mr-4" />
            <div>
              <CardTitle className="text-2xl font-bold">Ask Richter</CardTitle>
              <p className="text-sm text-gray-500">My Interactive CV with AI</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-[60vh] overflow-y-auto pr-4 mb-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 text-sm ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-gray-800 text-white font-bold">AI</span>}
                <div className={`rounded-lg p-3 prose prose-sm max-w-none ${m.role === 'user' ? 'bg-blue-500 text-white prose-invert' : 'bg-gray-100'}`}>
                  {/* --- USANDO A NOVA BIBLIOTECA markdown-to-jsx --- */}
                  <Markdown options={{
                    overrides: {
                      code: { component: CodeBlock },
                    },
                  }}>
                    {m.content}
                  </Markdown>
                </div>
                 {m.role === 'user' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-blue-500 text-white font-bold">LR</span>}
              </div>
            ))}
            {isLoading && <div className="flex gap-3 text-sm animate-pulse"><span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-gray-800 text-white font-bold">AI</span><div className="rounded-lg p-3 bg-gray-200 w-24 h-10"></div></div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input value={input} placeholder="Pergunte sobre otimização de performance..." onChange={handleInputChange} disabled={isLoading} />
            <Button type="submit" disabled={isLoading}><SendHorizonal className="h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
