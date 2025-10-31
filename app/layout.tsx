import type React from "react"
import type { Metadata } from "next"
// import { GeistSans } from "geist/font/sans"
// import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "../app/utils/ThemeProvider"
import { Suspense } from "react"
import { Providers } from "../app/providers"

export const metadata: Metadata = {
  title: "Ap-forms",
  description: "Generate forms",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
                <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@100..800&family=Tiro+Devanagari+Hindi:ital@0;1&family=Yatra+One&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-poppins`}>
        <Suspense fallback={null}>
          <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Analytics />
          </ThemeProvider>
          </Providers>
        </Suspense>
      </body>
    </html>
  )
}
