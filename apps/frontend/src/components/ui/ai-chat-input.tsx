// Salve este código em: apps/frontend/src/components/ui/ai-chat-input.tsx

"use client"

import { AnimatePresence, motion } from "framer-motion"; // Alterado de "motion/react"
import { Paperclip, Send } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

// Lista de placeholders para o input
const PLACEHOLDERS = [
  "Qual sua experiência com arquitetura de sistemas?",
  "Tell me about a technical challenge you overcame.",
  "Como você lida com débitos técnicos?",
  "What is your favorite programming language?",
  "Descreva sua experiência com testes automatizados.",
  "Tell me about your projects",
];

// Definindo a interface de props para o componente
interface AIChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  // Opcional: para o caso de precisarmos de uma função de submit customizada
  // onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const AIChatInput = ({
  input,
  handleInputChange,
  isLoading,
}: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animação do placeholder
  useEffect(() => {
    if (isLoading || input) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, input]);

  const letterVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 10, duration: 0.025 } },
    exit: { opacity: 0, y: -10, transition: { type: "spring", stiffness: 100, damping: 10, duration: 0.025 } },
  };

  return (
    <motion.div
      ref={wrapperRef}
      className="w-full max-w-3xl bg-white rounded-full shadow-lg"
      style={{ overflow: "hidden" }}
    >
      <div className="flex items-center gap-1 p-2 w-full h-full">
        <button
          className="p-3 rounded-full hover:bg-gray-100 transition text-gray-600"
          title="Attach file (desabilitado)"
          type="button"
          disabled // Desabilitado por não ter funcionalidade ainda
        >
          <Paperclip size={20} />
        </button>

        {/* Text Input & Placeholder */}
        <div className="relative flex-1 h-full">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="border-0 outline-none rounded-md py-2 text-base bg-transparent w-full font-normal h-full"
            style={{ position: "relative", zIndex: 1 }}
          />
          <div className="absolute inset-0 pointer-events-none flex items-center">
            <AnimatePresence mode="wait">
              {showPlaceholder && !input && !isLoading && (
                <motion.div
                  key={placeholderIndex}
                  className="absolute left-0 text-gray-400 select-none flex"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={letterVariants}
                      className="inline-block"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          className="flex items-center gap-1 bg-black hover:bg-zinc-700 disabled:bg-zinc-500 disabled:cursor-not-allowed text-white p-3 rounded-full font-medium justify-center transition-colors"
          title="Send"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export { AIChatInput };
