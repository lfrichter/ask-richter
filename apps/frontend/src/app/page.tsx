'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useChat } from 'ai/react';
import { SendHorizonal } from 'lucide-react';
import { FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

export default function Chat() {
  // Usamos o useChat apenas para gerenciar o estado das mensagens
  const { messages, input, handleInputChange, append, isLoading, setMessages } = useChat({
    // Removemos a propriedade 'api' para assumir o controle
    initialMessages: [
      {
        id: 'initial',
        role: 'assistant',
        content: 'Olá! Sou o **Ask Richter**, um assistente de carreira interativo. Faça uma pergunta sobre a experiência profissional, projetos ou competências de Luis Fernando Richter.',
      },
    ],
  });

  // Criamos nossa própria função para lidar com o envio do formulário
  async function customHandleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Adiciona a mensagem do usuário à lista imediatamente
    const userMessage = { role: 'user' as const, content: input };
    append(userMessage);

    // Faz a chamada para nossa API backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }), // Envia o histórico de mensagens
      });

      if (!response.ok) {
        throw new Error('A resposta da rede não foi bem-sucedida.');
      }

      // Lê a resposta JSON do backend
      const data = await response.json();

      // Adiciona a resposta do assistente à lista
      append({ role: 'assistant', content: data.answer });

    } catch (error) {
      console.error("Erro ao chamar a API:", error);
      // Adiciona uma mensagem de erro na UI
      append({ role: 'assistant', content: "Desculpe, não consegui obter uma resposta. Tente novamente." });
    }
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Ask Richter</CardTitle>
          <p className="text-sm text-gray-500">Meu CV Interativo com IA</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-[60vh] overflow-y-auto pr-4 mb-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 text-sm ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-gray-800 text-white font-bold">AI</span>}
                <div className={`rounded-lg p-3 prose ${m.role === 'user' ? 'bg-blue-500 text-white prose-invert' : 'bg-gray-100'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-gray-200 px-1 rounded" {...props}>{children}</code>
                        );
                      }
                    }}
                  >{m.content}</ReactMarkdown>
                </div>
                 {m.role === 'user' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-blue-500 text-white font-bold">LR</span>}
              </div>
            ))}
            {isLoading && <div className="flex justify-center items-center"><span className="text-sm text-gray-500">Pensando...</span></div>}
          </div>

          {/* Usamos nossa nova função customHandleSubmit */}
          <form onSubmit={customHandleSubmit} className="flex gap-2">
            <Input
              value={input}
              placeholder="Pergunte sobre a otimização de performance no projeto Toot..."
              onChange={handleInputChange}
            />
            <Button type="submit">
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
