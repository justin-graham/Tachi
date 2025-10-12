import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tachi v2 - Publisher Dashboard',
  description: 'Pay-per-crawl protocol for AI training data'
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <div className="page-header">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                <span className="text-coral">TACHI</span> v2
              </h1>
              <p className="text-sm opacity-80">Publisher Dashboard — Pay-Per-Crawl Protocol</p>
            </div>
            <div className="text-right">
              <div className="stat-badge">TESTNET</div>
            </div>
          </div>
        </div>

        <nav className="bg-white border-b-[3px] border-black relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex gap-6">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/dashboard/requests">Requests</NavLink>
              <NavLink href="/dashboard/revenue">Revenue</NavLink>
              <NavLink href="/dashboard/settings">Settings</NavLink>
            </div>
          </div>
        </nav>

        <main className="relative z-0">{children}</main>

        <footer className="mt-20 bg-black text-white py-8 border-t-[3px] border-black">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm">
              Built with ❤️ on Base L2 • MIT License • {new Date().getFullYear()}
            </p>
          </div>
        </footer>
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
