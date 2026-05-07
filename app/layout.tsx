import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KVK → Carerix Paneel",
  description: "Zoek bedrijven via KVK en sync ze naar Carerix.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
