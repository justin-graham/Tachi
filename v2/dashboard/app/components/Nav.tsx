'use client';

import {useState} from 'react';
import {WalletButton} from './WalletButton';

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-paper border-b-[3px] border-black relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6">
            <NavLink href="/directory">Directory</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/requests">Requests</NavLink>
            <NavLink href="/dashboard/revenue">Revenue</NavLink>
            <NavLink href="/dashboard/integration">Integration</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className="w-6 h-0.5 bg-black block"></span>
            <span className="w-6 h-0.5 bg-black block"></span>
            <span className="w-6 h-0.5 bg-black block"></span>
          </button>

          <WalletButton />
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-4 bg-white border-[3px] border-black">
            <MobileNavLink href="/directory" onClick={() => setMenuOpen(false)}>
              Directory
            </MobileNavLink>
            <MobileNavLink href="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/dashboard/requests" onClick={() => setMenuOpen(false)}>
              Requests
            </MobileNavLink>
            <MobileNavLink href="/dashboard/revenue" onClick={() => setMenuOpen(false)}>
              Revenue
            </MobileNavLink>
            <MobileNavLink href="/dashboard/integration" onClick={() => setMenuOpen(false)}>
              Integration
            </MobileNavLink>
            <MobileNavLink href="/dashboard/settings" onClick={() => setMenuOpen(false)}>
              Settings
            </MobileNavLink>
          </div>
        )}
      </div>
    </nav>
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

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block px-4 py-3 font-bold text-black hover:bg-paper border-b-[3px] border-black last:border-b-0 uppercase text-sm tracking-wide"
    >
      {children}
    </a>
  );
}
