'use client';

import {useHydrationSafeAddress} from '../hooks/useHydrationSafeAddress';

export function Footer() {
  const {isConnected, isHydrated} = useHydrationSafeAddress();

  const buttonText = isHydrated && isConnected ? 'Landing' : 'Get Started';
  const buttonHref = isHydrated && isConnected ? '/' : '/onboard';

  return (
    <footer className="mt-20 bg-paper border-t-[3px] border-black pt-12 pb-48 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <a href={buttonHref} className="neo-button neo-button-sage">
            {buttonText}
          </a>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="font-bold text-black hover:text-coral transition-colors text-sm sm:text-base">
              Docs
            </a>
            <a href="#" className="font-bold text-black hover:text-coral transition-colors text-sm sm:text-base">
              Legal
            </a>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold opacity-5 leading-none pointer-events-none"
        style={{fontFamily: 'Coinbase Display'}}
      >
        tachi
      </div>
    </footer>
  );
}
