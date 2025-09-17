import React, { useState } from 'react';
import Image from 'next/image';
import { ContactSentence } from '../components/ContactSentence';

// Simple Header Component
const ContactHeader = () => (
  <header 
    className="fixed top-0 left-0 right-0 z-50"
    style={{
      backgroundColor: '#FAF9F6',
      height: '64px',
    }}
  >
    <div className="h-full flex items-center justify-between px-8 max-w-7xl mx-auto">
      {/* Left side - Get Started / Log In */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        style={{
          background: 'none',
          border: 'none',
          color: '#52796F',
          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        Get Started / Log In
      </button>

      {/* Center - Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Image
          src="/images/tachi-logo.svg"
          alt="Tachi"
          width={48}
          height={48}
        />
      </div>

      {/* Right side - Home */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          background: 'none',
          border: 'none',
          color: '#52796F',
          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        Home
      </button>
    </div>
  </header>
);

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div 
    className="fixed top-4 right-4 z-50 px-6 py-4 rounded shadow-lg transition-opacity max-w-sm"
    style={{
      backgroundColor: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#16a34a' : '#dc2626',
      border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-start justify-between">
      <div className="text-sm font-medium">
        {message}
      </div>
      <button 
        onClick={onClose} 
        className="ml-3 text-lg font-bold leading-none hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  </div>
);

export default function ContactPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmitSuccess = () => {
    showToast('Thanks—talk soon!', 'success');
  };

  const handleSubmitError = (error: string) => {
    showToast(error, 'error');
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#FAF9F6' }}
    >
      {/* Header */}
      <ContactHeader />
      
      {/* Main content */}
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="max-w-4xl w-full">
            {/* Large top margin for breathing space */}
            <div className="mt-16 sm:mt-24 lg:mt-32">
              <ContactSentence 
                onSubmitSuccess={handleSubmitSuccess}
                onSubmitError={handleSubmitError}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx global>{`
        /* Ensure proper font loading and reduce motion preferences */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Custom styles for the contact form */
        .contact-sentence .heading {
          font-family: "Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin: 0;
          padding: 0;
        }

        .contact-sentence .sentence-lines {
          margin-bottom: 0;
        }

        .contact-sentence .sentence-lines p {
          margin-bottom: clamp(8px, 1.2vw, 16px);
        }

        /* Ensure inputs inherit the large font size */
        .inline-field {
          font-size: inherit !important;
          line-height: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .contact-sentence .sentence-lines {
            padding: 0 1rem;
          }
          
          .inline-field {
            min-width: 200px !important;
          }
          
          .contact-sentence textarea.inline-field {
            min-width: 300px !important;
          }
        }

        /* Tablet adjustments */
        @media (max-width: 768px) and (min-width: 641px) {
          .inline-field {
            min-width: 250px !important;
          }
          
          .contact-sentence textarea.inline-field {
            min-width: 350px !important;
          }
        }

        /* Focus states for better accessibility */
        .inline-field:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        /* Screen reader only utility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}