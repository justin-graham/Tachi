import * as React from "react";
import { useState, useEffect } from "react";
// import dynamic from "next/dynamic";
import Image from "next/image";
import HeroSection from "../components/HeroSection";
import TextSection from "../components/TextSection";
import PublishersSection from "../components/PublishersSection";
import DevelopersSection from "../components/DevelopersSection";
import HowItWorksSection from "../components/HowItWorksSection";
import DashboardSection from "../components/DashboardSection";
import WhyBlockchainSection from "../components/WhyBlockchainSection";
import ComputerGallery from "../components/ComputerGallery";
import CreatorsSection from "../components/CreatorsSection";
import DevelopersPaySection from "../components/DevelopersPaySection";
import CustomFooter from "../components/CustomFooter";

// const DitherBackground = dynamic(() => import("../components/Dither"), { ssr: false });

// Simple Sticky Header Component - logo with conditional buttons
const StickyHeader = ({ showButtons }: { showButtons: boolean }) => (
  <header 
    id="site-header"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: '#FAF9F6',
      zIndex: 999,
    }}
  >
    <div className="h-full flex items-center px-8" style={{ position: 'relative' }}>
      {/* Left side - Get Started / Log In (only when header is active) */}
      <div style={{ position: 'absolute', left: '2rem' }}>
        {showButtons && (
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'none',
              border: 'none',
              color: '#52796F',
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              padding: '8px 16px',
              opacity: showButtons ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            GET STARTED / LOG IN
          </button>
        )}
      </div>

      {/* Center - Logo slot (absolutely centered) */}
      <div className="header-logo-slot" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Right side - Contact (only when header is active) */}
      <div style={{ position: 'absolute', right: '2rem' }}>
        {showButtons && (
          <button
            onClick={() => window.location.href = '/contact'}
            style={{
              background: 'none',
              border: 'none',
              color: '#52796F',
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              padding: '8px 16px',
              opacity: showButtons ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            CONTACT
          </button>
        )}
      </div>
    </div>
  </header>
);

export default function Landing() {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    // Add styles for logo size transitions
    const style = document.createElement('style');
    style.textContent = `
      .logo {
        transition: all 0.3s ease;
      }
      .logo.in-header {
        width: 48px !important;
        height: 48px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const header = document.getElementById('site-header');
    const headerSlot = document.querySelector('.header-logo-slot');
    const heroSlot = document.querySelector('.hero-logo-slot');
    const logo = document.querySelector('.logo') as HTMLElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!header || !headerSlot || !heroSlot || !logo) return;

    let stuck = false;
    let ticking = false;

    function flipMove(toSlot: Element, inHeaderClass: boolean) {
      if (!logo) return;
      
      // 1) FIRST - capture current position
      const first = logo.getBoundingClientRect();

      // 2) MOVE DOM - move logo to new slot
      toSlot.appendChild(logo);
      logo.classList.toggle('in-header', inHeaderClass);

      // 3) LAST - capture new position
      const last = logo.getBoundingClientRect();

      // 4) INVERT - calculate the difference
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;

      if (reduceMotion) return; // snap with no animation

      // 5) PLAY - animate from old position to new
      logo.animate(
        [
          { 
            transformOrigin: 'top left', 
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` 
          },
          { 
            transformOrigin: 'top left', 
            transform: 'none' 
          }
        ],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }

    function onScroll() {
      if (!header || !logo || !heroSlot) return;
      
      const headerBottom = header.getBoundingClientRect().bottom;
      const logoTop = logo.getBoundingClientRect().top;
      const heroTop = heroSlot.getBoundingClientRect().top;

      // Stick when the scrolling logo touches the header line
      if (!stuck && logoTop <= headerBottom && headerSlot) {
        stuck = true;
        setHeaderVisible(true);
        flipMove(headerSlot, true);  // move into header and shrink
      }

      // Unstick when hero area has come fully back below the header
      if (stuck && heroTop > headerBottom + 8 && heroSlot) {
        stuck = false;
        setHeaderVisible(false);
        flipMove(heroSlot, false);   // move back to hero and grow
      }

      ticking = false;
    }

    function onScrollRaf() {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScrollRaf, { passive: true });
    window.addEventListener('resize', onScrollRaf);
    
    // Run once in case the page loads scrolled
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScrollRaf);
      window.removeEventListener('resize', onScrollRaf);
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '200vh', backgroundColor: '#FAF9F6' }}>
      {/* Sticky Header - always visible container */}
      <StickyHeader showButtons={headerVisible} />
      
      {/* Content sections */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        
        {/* Text Section */}
        <TextSection />
        
        
        {/* Publishers Section */}
        <PublishersSection />
        
        {/* Developers Section */}
        <DevelopersSection />
        
        {/* How It Works Section */}
        <HowItWorksSection />
        
        {/* Dashboard Section */}
        <DashboardSection />
        
        {/* Why Blockchain Section */}
        <WhyBlockchainSection />
        
        {/* Computer Gallery Section */}
        <ComputerGallery />
        
        {/* Creators & Publishers Section */}
        <CreatorsSection />
        
        {/* Developers Pay Section */}
        <DevelopersPaySection />
        
        {/* Footer */}
        <CustomFooter />
      </div>
    </div>
  );
}