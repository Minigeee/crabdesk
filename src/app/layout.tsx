import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CrabDesk",
  description: "Modern customer support platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(inter.className, "h-full")}>
        <div className="flex h-full">
          {/* Side Navigation */}
          <AppNav />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
