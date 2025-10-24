import type {Metadata} from 'next';
import './globals.css';
import {Providers} from './providers';
import {Nav} from './components/Nav';
import {Footer} from './components/Footer';

export const metadata: Metadata = {
  title: 'Tachi',
  description: 'Pay-per-crawl protocol for AI training data',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="relative z-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
