"use client";

import React from "react"

import Link from "next/link";
import { Database } from "lucide-react";
import { SearchBar } from "./search-bar";

interface HeaderProps {
  totalModels?: number;
  children?: React.ReactNode;
}

export function Header({ totalModels, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-sky-200/60 shadow-sm">
      <div className="flex h-16 items-center gap-6 px-6">
        {children}
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight shrink-0 transition-all hover:opacity-70">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="hidden sm:inline-block text-base leading-tight text-slate-900">dbt Docs</span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-sky-600 font-mono font-bold">Redesign v1</span>
          </div>
        </Link>

        <SearchBar className="flex-1 max-w-xl" />

        <div className="hidden lg:flex items-center gap-6 ml-auto">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">system status</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite] shadow-lg shadow-emerald-500/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 font-mono">Operations Online</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-sky-200" />
          {totalModels !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">inventory size</span>
              <span className="text-[11px] font-black font-mono text-sky-600 uppercase tracking-widest">{totalModels.toLocaleString()} ASSETS</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
