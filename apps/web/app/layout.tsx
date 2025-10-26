import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = { title: "OneReserve", description: "Dashboard" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
