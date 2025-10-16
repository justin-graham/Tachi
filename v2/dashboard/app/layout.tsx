import type {Metadata} from 'next';
import './globals.css';
import {Providers} from './providers';
import {WalletButton} from './components/WalletButton';

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
        <nav className="bg-paper border-b-[3px] border-black relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 md:gap-6 overflow-x-auto">
                <NavLink href="/directory">Directory</NavLink>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/dashboard/requests">Requests</NavLink>
                <NavLink href="/dashboard/revenue">Revenue</NavLink>
                <NavLink href="/dashboard/integration">Integration</NavLink>
                <NavLink href="/dashboard/settings">Settings</NavLink>
              </div>
              <WalletButton />
            </div>
          </div>
        </nav>

          <main className="relative z-0">{children}</main>

          <footer className="mt-20 bg-paper border-t-[3px] border-black pt-12 pb-48 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="flex justify-between items-start">
                <a href="/onboard" className="neo-button neo-button-sage">Get Started</a>
                <div className="flex gap-6">
                  <a href="#" className="font-bold text-black hover:text-coral transition-colors">Docs</a>
                  <a href="#" className="font-bold text-black hover:text-coral transition-colors">Legal</a>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold opacity-5 leading-none pointer-events-none" style={{fontFamily: 'Coinbase Display'}}>
              tachi
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

function NavLink({href, children}: {href: string; children: React.ReactNode}) {
  return (
    <a
      href={href}
      className="font-bold text-black hover:text-coral transition-colors uppercase text-sm tracking-wide"
    >
      {children}
    </a>
  );
}
