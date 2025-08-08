"use client"; // ESSENCIAL: Define este como um Componente de Cliente

import type { Message } from 'ai/react';
import Markdown from "markdown-to-jsx";
import { useTranslations } from '@/lib/i18n';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { AIChatInput } from "@/components/ui/ai-chat-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from './CodeBlock';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslations('HomePage'); // Agora isso vai funcionar!

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage: Message = { id: Date.now().toString() + 'ai', role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      const errorMessage: Message = { id: Date.now().toString() + 'error', role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={m.role === 'user' ? '/user.png' : '/richter.png'} />
                  <AvatarFallback>{m.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                </Avatar>
                <div className="prose dark:prose-invert max-w-none w-full">
                  <Markdown options={{
                      overrides: {
                        code: {
                          component: CodeBlock
                        }
                      }
                    }}>
                      {m.content}
                    </Markdown>
                </div>
              </CardContent>
            </Card>
          ))}
          {isLoading && (
            <Card>
              <CardContent className="p-4 flex items-start gap-4">
                <Avatar>
                  <AvatarImage src="/richter.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="animate-pulse flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="flex justify-center">
          <AIChatInput
            input={input}
            handleInputChange={handleInputChange}
            isLoading={isLoading}
          />
        </form>
      </div>
    </div>
  );
}
