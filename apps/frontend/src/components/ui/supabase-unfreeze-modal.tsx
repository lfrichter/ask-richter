'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Flame, Timer, Clock } from 'lucide-react';

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
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
}: SupabaseUnfreezeModalProps) {
  const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'manual_required' | 'timeout' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [dashboardUrl, setDashboardUrl] = useState<string>('https://supabase.com/dashboard');
  const [timeLeft, setTimeLeft] = useState<number>(90); // 90 segundos
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingStep, setPollingStep] = useState<number>(0);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isPollingLoopActiveRef = useRef<boolean>(false);

  const cleanApiUrl = apiBaseUrl ? apiBaseUrl.replace(/\/$/, '') : '';

  // Cancela todas as tarefas assíncronas e requisições em voo
  const stopAllAsyncTasks = useCallback(() => {
    isPollingLoopActiveRef.current = false;

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setIsPolling(false);
  }, []);

  // Resetar ao abrir/fechar o modal
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTimeLeft(90);
      setMessage('');
      setPollingStep(0);
    } else {
      stopAllAsyncTasks();
    }
  }, [isOpen, stopAllAsyncTasks]);

  // Efeito do Timer Regressivo de 90s
  useEffect(() => {
    if (status === 'restoring' && timeLeft > 0) {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            stopAllAsyncTasks();
            setStatus('timeout');
            setMessage('O tempo limite de restauração (90s) foi excedido. O projeto pode estar demorando a responder.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [status, timeLeft, stopAllAsyncTasks]);

  // Cálculo de recuo progressivo (Progressive Backoff: 2s, 3s, 5s, 8s, 13s..., teto: 15s)
  const getBackoffDelay = (step: number): number => {
    const delays = [2000, 3000, 5000, 8000, 13000];
    return Math.min(15000, delays[step - 1] || 15000);
  };

  // Polling Sequencial Garantido (Zero Requisições Concorrentes)
  const runSequentialPolling = useCallback(async () => {
    isPollingLoopActiveRef.current = true;
    let step = 1;

    while (isPollingLoopActiveRef.current) {
      setPollingStep(step);
      setIsPolling(true);

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(`${cleanApiUrl}/api/supabase/status`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();

          // Se a verificação retornar READY ou isReady=true
          if (data.state === 'READY' || data.isReady === true || data.status === 'ok' || data.isPaused === false) {
            stopAllAsyncTasks();
            setStatus('success');
            setMessage('Projeto Supabase ativo e pronto para uso!');
            setTimeout(() => {
              onClose();
              if (onRestored) onRestored();
            }, 2000);
            return;
          }

          // Se a verificação indicar que o projeto ainda está restaurando (WAKING) ou pausado (PAUSED)
          if (data.state === 'WAKING') {
            setMessage('Contêineres do Supabase inicializando...');
          } else if (data.state === 'PAUSED') {
            setMessage('Aguardando resposta dos serviços do Supabase...');
          } else if (data.state === 'TIMEOUT') {
            setMessage('Sonda de verificação expirou. Tentando novamente em breve...');
          } else if (data.state === 'AUTH_ERROR' || data.state === 'CONFIG_MISSING') {
            stopAllAsyncTasks();
            setStatus('manual_required');
            setMessage(data.reason || 'Falha de autenticação ou configuração do Supabase.');
            return;
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name !== 'AbortError') {
          console.warn('[UNFREEZE POLLING Probe] Exceção na verificação:', err);
        }
      } finally {
        setIsPolling(false);
        activeAbortControllerRef.current = null;
      }

      if (!isPollingLoopActiveRef.current) break;

      // Recuo progressivo antes da próxima tentativa
      const delay = getBackoffDelay(step);
      await new Promise(resolve => setTimeout(resolve, delay));
      step++;
    }
  }, [cleanApiUrl, onClose, onRestored, stopAllAsyncTasks]);

  if (!isOpen) return null;

  // Dispara o comando de restauração server-side
  const handleTriggerRestore = async () => {
    setStatus('restoring');
    setTimeLeft(90);
    setMessage('Disparando comando de restauração no Supabase...');

    try {
      const res = await fetch(`${cleanApiUrl}/api/supabase/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Ignora erro de JSON parse
      }

      if (res.ok && data) {
        if (data.state === 'READY' || data.status === 'active') {
          stopAllAsyncTasks();
          setStatus('success');
          setMessage(data.message || 'Projeto Supabase já está ativo!');
          setTimeout(() => {
            onClose();
            if (onRestored) onRestored();
          }, 2000);
          return;
        }

        if (data.success || data.state === 'WAKING' || data.status === 'restoring') {
          setMessage(data.message || 'Restauração solicitada com sucesso! Aguarde o descongelamento.');
          runSequentialPolling();
          return;
        }
      }

      // Se o restore retornou erro tratável (ex: falta de token de gerenciamento)
      stopAllAsyncTasks();
      setStatus('manual_required');
      if (data?.dashboardUrl) setDashboardUrl(data.dashboardUrl);
      setMessage(
        data?.message ||
          'Descongelamento automático indisponível (token de gerenciamento não configurado). Use o Dashboard para restaurar manualmente.'
      );
    } catch (err: any) {
      console.warn('[SUPABASE UNFREEZE] Erro ao chamar restore:', err);
      stopAllAsyncTasks();
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
            status === 'timeout' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600' :
            'bg-orange-100 dark:bg-orange-950/60 text-orange-600'
          }`}>
            {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
             status === 'restoring' ? <Timer className="w-6 h-6" /> :
             status === 'timeout' ? <Clock className="w-6 h-6" /> :
             <Flame className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {status === 'success' ? 'Projeto Ativo!' :
               status === 'timeout' ? 'Tempo Limite Excedido' :
               'Supabase Pausado'}
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
              <span>Clique no botão abaixo para disparar o descongelamento. O processo costuma levar de 60 a 90 segundos.</span>
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

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 min-h-[20px]">
              {isPolling && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />}
              <span>{message || 'Aguardando inicialização dos contêineres do Supabase...'}</span>
            </p>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              {pollingStep > 0 ? `Sonda de verificação #${pollingStep} ativa.` : 'Inicializando verificações sequenciais...'}
            </p>

            <button
              onClick={() => { stopAllAsyncTasks(); onClose(); }}
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

        {status === 'timeout' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>O Supabase pode levar até 2 minutos para aquecer completamente. Você pode tentar novamente ou verificar no Dashboard.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTriggerRestore}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/20 transition-all text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Dashboard
              </a>
            </div>
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
