import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
// AppSidebar and Navbar are likely part of a specific dashboard layout, not root.
// import AppSidebar from "@/components/AppSidebar";
// import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
// SidebarProvider is also likely part of a specific dashboard layout.
// import { SidebarProvider } from "@/components/ui/sidebar";

import StyledComponentsRegistry from "@/lib/registry";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sistemaxi Expert",
  description: "Sistema de gestão de marketing e campanhas para especialistas",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const cookieStore = await cookies(); // Sidebar state likely managed in dashboard layout
  // const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StyledComponentsRegistry>
            <AuthProvider>
              {/* As páginas de login têm seu próprio layout e não usam o layout padrão */}
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </StyledComponentsRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
