'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Flame, Timer } from 'lucide-react';

interface SupabaseUnfreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
  apiBaseUrl?: string;
}

export function SupabaseUnfreezeModal({
  isOpen,
  onClose,
  onRestored,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
}: SupabaseUnfreezeModalProps) {
  const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'manual_required' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [dashboardUrl, setDashboardUrl] = useState<string>('https://supabase.com/dashboard');
  const [timeLeft, setTimeLeft] = useState<number>(90); // 90 segundos
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const cleanApiUrl = apiBaseUrl.replace(/\/$/, '');

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTimeLeft(90);
      setMessage('');
    } else {
      clearAllTimers();
    }
  }, [isOpen, clearAllTimers]);

  // Efeito do Timer Regressivo
  useEffect(() => {
    if (status === 'restoring' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // Polling de saúde a cada 5s durante a restauração
  useEffect(() => {
    if (status === 'restoring') {
      const checkStatus = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
          setIsPolling(true);
          const res = await fetch(`${cleanApiUrl}/api/supabase/status`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' || data.isPaused === false) {
              clearAllTimers();
              setStatus('success');
              setMessage('Projeto Supabase ativo e pronto para uso!');
              setTimeout(() => {
                onClose();
                if (onRestored) onRestored();
              }, 2000);
            }
          }
        } catch (err) {
          clearTimeout(timeoutId);
          console.warn('[UNFREEZE POLLING] Tentativa de conexão pendente...', err);
        } finally {
          setIsPolling(false);
        }
      };

      checkStatus();
      pollingRef.current = setInterval(checkStatus, 5000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, cleanApiUrl, clearAllTimers, onClose, onRestored]);

  if (!isOpen) return null;

  const handleTriggerRestore = async () => {
    setStatus('restoring');
    setTimeLeft(90);
    setMessage('Disparando comando de restauração no Supabase...');

    try {
      const res = await fetch(`${cleanApiUrl}/api/supabase/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Erro ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.status === 'restoring') {
        setMessage(data.message || 'Restauração solicitada com sucesso! Aguarde o descongelamento.');
      } else {
        clearAllTimers();
        setStatus('manual_required');
        if (data.dashboardUrl) setDashboardUrl(data.dashboardUrl);
        setMessage(data.message || 'Descongelamento automático não disponível. Acesse o Dashboard para ativar manualmente.');
      }
    } catch (err: any) {
      console.warn('[SUPABASE UNFREEZE] Erro ao chamar restore:', err);
      clearAllTimers();
      setStatus('manual_required');
      setMessage('Não foi possível acionar a API de descongelamento automático. Use o link do Dashboard para restaurar manualmente.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.max(0, Math.min(100, ((90 - timeLeft) / 90) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-950/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-900 dark:text-zinc-100">
        
        {/* Ícone de Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl flex items-center justify-center ${
            status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' :
            status === 'restoring' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 animate-pulse' :
            'bg-orange-100 dark:bg-orange-950/60 text-orange-600'
          }`}>
            {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
             status === 'restoring' ? <Timer className="w-6 h-6" /> :
             <Flame className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {status === 'success' ? 'Projeto Ativo!' : 'Supabase Pausado'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Serviço de Banco &amp; Storage do Chatbot
            </p>
          </div>
        </div>

        {/* Conteúdo Dinâmico conforme Estado */}
        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              O projeto no <strong>Supabase (plano gratuito)</strong> entrou em estado congelado por inatividade. O banco vetorial FAISS precisa ser reativado para responder suas perguntas.
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Clique no botão abaixo para disparar o descongelamento público. O processo costuma levar de 60 a 90 segundos.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTriggerRestore}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/20 transition-all text-sm"
              >
                <Flame className="w-4 h-4" />
                Tentar Descongelar Projeto
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {status === 'restoring' && (
          <div className="space-y-4 text-center py-2">
            <div className="relative flex items-center justify-center my-4">
              <div className="text-4xl font-extrabold font-mono tracking-wider text-amber-600 dark:text-amber-400">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
              {isPolling && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />}
              {message || 'Aguardando inicialização dos contêineres do Supabase...'}
            </p>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              Assim que o serviço responder OK, este aviso se fechará automaticamente.
            </p>

            <button
              onClick={() => { clearAllTimers(); onClose(); }}
              className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
            >
              Cancelar e aguardar em segundo plano
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 text-center py-4">
            <div className="text-emerald-500 font-semibold text-base">
              {message}
            </div>
            <p className="text-xs text-zinc-500">
              Retomando sua pergunta automaticamente...
            </p>
          </div>
        )}

        {status === 'manual_required' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
              <p className="font-semibold">Instruções para descongelar manualmente:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-zinc-500 dark:text-zinc-400">
                <li>Abra o Dashboard do Supabase pelo botão abaixo.</li>
                <li>Clique em <strong>&quot;Restore Project&quot;</strong> no aviso principal.</li>
                <li>Aguarde cerca de 1 minuto até o status mudar para <em>Active</em>.</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Supabase Dashboard
              </a>
              <button
                onClick={onClose}
                className="px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
