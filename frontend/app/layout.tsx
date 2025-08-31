import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "EV Performance Dashboard",
  description: "전기차 데이터 성능진단 시스템",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans">
        {children}
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </body>
    </html>
  )
}
