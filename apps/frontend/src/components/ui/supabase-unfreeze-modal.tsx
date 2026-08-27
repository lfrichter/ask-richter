'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Flame, Timer, Clock } from 'lucide-react';

interface SupabaseUnfreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
  apiBaseUrl?: string;
}

const TOTAL_RESTORE_TIMEOUT_SEC = 300; // 300 segundos (5 minutos) — SLA real do Supabase em produção

export function SupabaseUnfreezeModal({
  isOpen,
  onClose,
  onRestored,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
}: SupabaseUnfreezeModalProps) {
  const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'manual_required' | 'timeout' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [dashboardUrl, setDashboardUrl] = useState<string>('https://supabase.com/dashboard');
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_RESTORE_TIMEOUT_SEC); // 300 segundos (5 min)
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingStep, setPollingStep] = useState<number>(0);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isPollingLoopActiveRef = useRef<boolean>(false);

  const cleanApiUrl = apiBaseUrl && !apiBaseUrl.includes('onrender.com') ? apiBaseUrl.replace(/\/$/, '') : '';

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
      setTimeLeft(TOTAL_RESTORE_TIMEOUT_SEC);
      setMessage('');
      setPollingStep(0);
    } else {
      stopAllAsyncTasks();
    }
  }, [isOpen, stopAllAsyncTasks]);

  // Efeito do Timer Regressivo de 300s (5 min SLA Real)
  useEffect(() => {
    if (status === 'restoring' && timeLeft > 0) {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            stopAllAsyncTasks();
            setStatus('timeout');
            setMessage(
              'O tempo limite de restauração (5 min) foi atingido. A restauração no Supabase pode estar demorando mais que o habitual.'
            );
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
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // Ignora erro de JSON parse
        }

        // Se o Supabase já respondeu READY (200 / isReady)
        if (res.ok && data && (data.isReady || data.state === 'READY')) {
          stopAllAsyncTasks();
          setStatus('success');
          setMessage('Supabase ativado e operacional! Carregando aplicação...');

          setTimeout(() => {
            onClose();
            if (onRestored) onRestored();
          }, 1500);
          return;
        }

        // Se o Supabase Management reportar restauração em andamento
        if (data && data.state === 'WAKING') {
          setMessage('O Supabase está inicializando os contêineres e o banco de dados. Aguarde...');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        // Exceções transitórias de rede/timeout durante o polling são tratadas com resiliência
        // e NÃO interrompem a tentativa nem disparam estado de falha definitivo
      }

      // Se a flag de loop foi desativada durante a execução da requisição
      if (!isPollingLoopActiveRef.current) break;

      // Aguarda o intervalo de recuo progressivo antes da próxima probe
      const delay = getBackoffDelay(step);
      await new Promise(resolve => setTimeout(resolve, delay));
      step++;
    }
  }, [cleanApiUrl, onClose, onRestored, stopAllAsyncTasks]);

  if (!isOpen) return null;

  // Dispara o comando de restauração server-side
  const handleTriggerRestore = async () => {
    setStatus('restoring');
    setTimeLeft(TOTAL_RESTORE_TIMEOUT_SEC);
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

  const progressPercentage = Math.max(0, Math.min(100, ((TOTAL_RESTORE_TIMEOUT_SEC - timeLeft) / TOTAL_RESTORE_TIMEOUT_SEC) * 100));

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
              <span>Clique no botão abaixo para disparar o descongelamento. A inicialização completa dos contêineres e do banco leva em média até 5 minutos.</span>
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
              <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {message || 'Descongelando projeto no Supabase...'}
              </p>

              {timeLeft <= 180 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium animate-pulse mt-1">
                  Os contêineres estão em processo de inicialização. Aguarde a conclusão...
                </p>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Probe #{pollingStep} | Tempo restante aproximado: <span className="font-semibold text-amber-600 dark:text-amber-400">{formatTime(timeLeft)}</span>
              </p>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  stopAllAsyncTasks();
                  onClose();
                }}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors underline underline-offset-4"
              >
                Cancelar e fechar janela
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                Supabase Descongelado com Sucesso!
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                O banco de dados vetorial está ativo. A janela será fechada automaticamente em instantes.
              </p>
            </div>
          </div>
        )}

        {status === 'timeout' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>

            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 rounded-xl text-xs text-orange-800 dark:text-orange-300">
              Caso o descongelamento automático esteja demorando, você pode acessar diretamente o painel do Supabase para verificar a inicialização.
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-all text-sm shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Dashboard Supabase
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

        {status === 'manual_required' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Instruções: Acesse o Dashboard do Supabase, selecione o projeto e clique no botão &quot;Restore project&quot;.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-all text-sm shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Ir para o Dashboard Supabase
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
