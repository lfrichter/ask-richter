'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Importa diretamente os arquivos JSON. O bundler irá lidar com isso.
import enMessages from '../../messages/en.json';
import ptMessages from '../../messages/pt.json';

// Mapeia os locales para os dados de mensagem carregados
const messagesData: { [key: string]: any } = {
  en: enMessages,
  pt: ptMessages,
};

// Cria o Contexto React
const TranslationsContext = createContext<any | null>(null);

// Define as props para o Provedor
interface TranslationsProviderProps {
  locale: string;
  children: ReactNode;
}

// Cria o componente Provedor
export function TranslationsProvider({ locale, children }: TranslationsProviderProps) {
  console.log('[TranslationsProvider] Locale recebido:', locale);
  // Seleciona as mensagens corretas com base no locale
  const messages = messagesData[locale] || ptMessages; // Usa 'pt' como fallback
  console.log('[TranslationsProvider] Mensagens carregadas para', locale, ':', messages);

  return (
    <TranslationsContext.Provider value={messages}>
      {children}
    </TranslationsContext.Provider>
  );
}

// O hook permanece o mesmo
export function useTranslations(namespace: string) {
  const messages = useContext(TranslationsContext);
  console.log('[useTranslations] Mensagens do contexto:', messages);

  if (!messages) {
    console.error('[useTranslations] Erro: useTranslations deve ser usado dentro de um TranslationsProvider');
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }

  return (key: string): string => {
    const fullKey = `${namespace}.${key}`;
    console.log(`[useTranslations] Tentando buscar chave: ${fullKey}`);
    // Acessa o valor aninhado (ex: HomePage.title)
    const translation = fullKey.split('.').reduce((obj, k) => {
      console.log(`[useTranslations] Reduzindo: obj=${JSON.stringify(obj)}, k=${k}`);
      return obj?.[k];
    }, messages);
    console.log(`[useTranslations] Resultado final para ${fullKey}: ${translation}`);
    return translation || fullKey; // Retorna a chave completa se a tradução não for encontrada
  };
}