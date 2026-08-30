'use client';

import React from 'react';
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupabaseUnfreezeModal } from "@/components/ui/supabase-unfreeze-modal";
import Markdown from 'markdown-to-jsx';
import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink } from 'lucide-react';
import myAdjustedOk from '../../public/images/AvatarCircle.png';

const CodeBlock = dynamic(
  () => import('../components/CodeBlock').then(mod => mod.CodeBlock),
  { ssr: false }
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'assistant', content: "Hello! I'm **Ask Richter**..." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Checagem proativa inicial do status do Supabase
  useEffect(() => {
    const checkSupabaseHealth = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const apiBaseUrl = rawUrl.includes('onrender.com') ? '' : rawUrl.replace(/\/$/, '');
        const res = await fetch(`${apiBaseUrl}/api/supabase/status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaused || data.state === 'PAUSED') {
            console.warn('[SUPABASE CHECK] Projeto Supabase detectado como pausado na inicialização.');
            setIsUnfreezeModalOpen(true);
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn('[SUPABASE CHECK] Não foi possível verificar o status do Supabase no startup:', err?.message || err);
      }
    };
    checkSupabaseHealth();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); };

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const apiBaseUrl = rawUrl.includes('onrender.com') ? '' : rawUrl.replace(/\/$/, '');
        const response = await fetch(`${apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
          signal: controller.signal
        });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {}

        const errMsg = errData.error || response.statusText;
        const isExplicitlyPaused = errData.isPaused === true || errData.isSupabasePaused === true || errData.code === 'SUPABASE_PAUSED' || errData.state === 'PAUSED' || (typeof errMsg === 'string' && (errMsg.toLowerCase().includes('project is paused') || errMsg.toLowerCase().includes('project_paused')));

        if (isExplicitlyPaused) {
          setLastFailedMessage(queryText);
          setIsUnfreezeModalOpen(true);
          throw new Error('Supabase project is paused.');
        }

        throw new Error(`Erro na API: ${errMsg}`);
      }

      const data = await response.json();
      console.log("RESPOSTA COMPLETA RECEBIDA DO BACKEND:", data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "O backend respondeu, mas o campo 'answer' estava vazio."
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastFailedMessage(null);

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Erro ao chamar ou processar a API:", error);

      const isExplicitlyPaused = error?.message?.includes('project is paused') || error?.message?.includes('project_paused');

      if (isExplicitlyPaused) {
        setLastFailedMessage(queryText);
        setIsUnfreezeModalOpen(true);
      }

      const errorMessageContent = isExplicitlyPaused
        ? "⚠️ O banco de dados do Supabase está temporariamente pausado. Use a janela de descongelamento para reativar o projeto."
        : "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em instantes.";

      const errorMessage: Message = { id: (Date.now() + 2).toString(), role: 'assistant', content: errorMessageContent };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendMessage(input);
  }

  const handleRestored = () => {
    if (lastFailedMessage) {
      console.log("[RESTORED] Supabase ativo novamente! Reenviando última pergunta:", lastFailedMessage);
      const retryQuery = lastFailedMessage;
      setLastFailedMessage(null);
      setTimeout(() => {
        sendMessage(retryQuery);
      }, 1000);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <BackgroundPaths />

      {/* Modal de Descongelamento do Supabase */}
      <SupabaseUnfreezeModal
        isOpen={isUnfreezeModalOpen}
        onClose={() => setIsUnfreezeModalOpen(false)}
        onRestored={handleRestored}
      />

      <div className="relative z-10 flex justify-center items-start min-h-screen p-4 pt-8 sm:pt-12 md:pt-16">
        <Card className="w-full max-w-3xl shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-200/80 dark:border-zinc-800 relative z-20">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center">
                <div className="relative group inline-flex items-center">
                  <a
                    href="https://richter.dev.br/#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-2 rounded-2xl transition-all duration-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                    title="To learn more about this project, visit my website."
                    aria-label="To learn more about this project, visit my website."
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={myAdjustedOk}
                        alt="Luis Fernando Richter"
                        width={50}
                        height={50}
                        className="rounded-full transition-transform duration-300 group-hover:scale-105 ring-2 ring-transparent group-hover:ring-blue-500/40"
                      />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-2xl font-bold transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                        Ask Richter
                        <ExternalLink className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0 transition-all duration-200 text-blue-600 dark:text-blue-400" />
                      </CardTitle>
                      <p className="text-sm text-gray-500">My Interactive CV with AI</p>
                    </div>
                  </a>

                  {/* Tooltip */}
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0 z-50 whitespace-normal sm:whitespace-nowrap max-w-[280px] sm:max-w-none text-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700/50 dark:border-zinc-300 select-none"
                  >
                    To learn more about this project, visit my website.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-[60vh] overflow-y-auto pr-4 mb-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex gap-3 text-sm ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'assistant' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-gray-800 text-white font-bold">AI</span>}
                    <div className={`rounded-lg p-3 prose prose-sm max-w-none ${m.role === 'user' ? 'bg-blue-500 text-white prose-invert' : 'bg-gray-100'}`}>
                      <Markdown
                        options={{
                          overrides: {
                            code: ({ children, className }) => <CodeBlock className={className}>{children}</CodeBlock>,
                            p: ({ children }) => {
                              if (
                                React.isValidElement(children) &&
                                (children.type as any).name === 'CodeBlock'
                              ) {
                                return <>{children}</>;
                              }
                              return <p className="mb-2 last:mb-0">{children}</p>;
                            },
                          },
                        }}
                      >
                        {m.content}
                      </Markdown>
                    </div>
                    {m.role === 'user' && <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-blue-500 text-white font-bold">ME</span>}
                  </div>
                ))}
                {isLoading && <div className="flex gap-3 text-sm animate-pulse"><span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full items-center justify-center bg-gray-800 text-white font-bold">AI</span><div className="rounded-lg p-3 bg-gray-200 w-24 h-10"></div></div>}
                <div ref={messagesEndRef} />
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
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
