import type { Metadata } from "next";
import "./globals.css";
import { Web3Providers } from "@/providers/web3-providers-wrapper";

export const metadata: Metadata = {
  title: "Tachi Publisher Dashboard",
  description: "Onboard to the Tachi pay-per-crawl protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Providers>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </Web3Providers>
      </body>
    </html>
  );
}
