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
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}
