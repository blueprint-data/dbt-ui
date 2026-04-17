"use client";

import React from "react"

import Link from "next/link";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  totalModels?: number;
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-sky-200/60 dark:border-slate-800/60 shadow-sm">
      <div className="flex h-16 items-center gap-6 px-6">
        {children}
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight shrink-0 transition-all hover:opacity-70">
          <img
            src="/blue-logo.png"
            alt="dbt Docs Logo"
            className="h-10 w-auto"
          />
          <div className="flex flex-col">
            <span className="hidden sm:inline-block text-base leading-tight text-foreground">dbt Docs</span>

          </div>
        </Link>

        <SearchBar className="flex-1 max-w-xl" />

        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
