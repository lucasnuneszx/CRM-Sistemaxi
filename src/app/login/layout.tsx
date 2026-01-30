'use client';

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import StyledComponentsRegistry from "@/lib/registry";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StyledComponentsRegistry>
        {children}
      </StyledComponentsRegistry>
    </ThemeProvider>
  );
} 