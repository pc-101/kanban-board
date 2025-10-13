import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Drag-and-drop Kanban board with persistence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main className="container-hero py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
