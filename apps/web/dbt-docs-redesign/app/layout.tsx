import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Outfit } from 'next/font/google'

import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const _outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: 'dbt Docs Explorer',
  description: 'Modern documentation explorer for dbt projects with 500+ models',

  icons: {
    icon: '/blue-logo.png',
    apple: '/blue-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} ${_outfit.variable} font-sans antialiased dark`}>
        {children}
      </body>
    </html>
  )
}
