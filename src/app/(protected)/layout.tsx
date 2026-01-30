'use client';

import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Usar um valor padrão para o sidebar
  const defaultOpen = true;
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <main className="w-full">
            <Navbar />
            <div className="px-4">{children}</div>
          </main>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
} 