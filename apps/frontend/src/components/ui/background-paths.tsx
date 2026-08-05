"use client";

import React from "react";

export function BackgroundPaths() {
  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-neutral-950 -z-10 pointer-events-none select-none">
      {/* Esferas de iluminação suave em gradiente CSS */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-purple-600/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 dark:bg-blue-800/15 rounded-full blur-3xl" />

      {/* Grid SVG estático com gradiente radial de transparência */}
      <svg
        className="absolute inset-0 w-full h-full stroke-slate-200 dark:stroke-neutral-800/50 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="background-grid-pattern"
            width={32}
            height={32}
            patternUnits="userSpaceOnUse"
            x="-1"
            y="-1"
          >
            <path d="M.5 32V.5H32" fill="none" strokeDasharray="0" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill="url(#background-grid-pattern)" />
      </svg>
    </div>
  );
}
