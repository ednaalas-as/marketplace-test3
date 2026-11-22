import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: { default: "Marketplace", template: "%s | Marketplace" },
  description: "Buy and sell everyday items with people near you.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1877f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6">
            Marketplace · Buy and sell everyday items. Built with Next.js and Supabase.
          </div>
        </footer>
      </body>
    </html>
  );
}
