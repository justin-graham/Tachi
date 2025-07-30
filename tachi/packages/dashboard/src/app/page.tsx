'use client'

import { OnboardingWizard } from '@/components/onboarding-wizard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Tachi</h1>
            <p className="text-lg text-gray-600 mb-6">
              Choose your path: explore our landing page or start onboarding directly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/landing">
                <Button variant="outline" size="lg">
                  View Landing Page
                </Button>
              </Link>
              <Button size="lg" onClick={() => {
                const wizard = document.getElementById('onboarding-wizard');
                wizard?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Start Onboarding
              </Button>
            </div>
          </div>
        </div>
        <div id="onboarding-wizard">
          <OnboardingWizard />
        </div>
      </main>
    </div>
  )
}
