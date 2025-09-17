import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic import with SSR disabled to prevent dispatcher errors
const TachiPayHeroExact = dynamic(() => import('../components/TachiPayHeroExact'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#FAF9F6'
    }}>
      <div className="animate-pulse bg-gray-200 rounded-xl h-96 w-full max-w-6xl mx-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-lg">Loading Tachi Flow Animation...</div>
        </div>
      </div>
    </div>
  ),
});

export default function TestHeroPage() {
  return (
    <TachiPayHeroExact />
  );
}