import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sales Visit Management System | Field Sales Intelligence",
  description:
    "Production-grade Sales Visit Management System for managing field representatives, client leads, on-site visit reports, and automated emails.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        <ThemeProvider defaultTheme="light">
          <LayoutWrapper user={sessionUser}>
            {children}
            </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
