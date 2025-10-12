'use client'

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

type OAuthProvider = 'google' | 'github'

type Feedback = {
  variant: 'info' | 'error' | 'success'
  message: string
}

const providerLabels: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const feedbackStyles: Record<Feedback['variant'], string> = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
  };

  useEffect(() => {
    // Check for verification success message
    const verified = searchParams.get('verified');
    const email = searchParams.get('email');
    
    if (verified === 'true' && email) {
      setSuccessMessage('Email verified successfully! You can now log in to your account.');
    }
  }, [searchParams]);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setIsLoading(provider);
    setFeedback({
      variant: 'info',
      message: `Contacting ${providerLabels[provider]} to start login...`,
    });
    
    try {
      const response = await fetch(`/api/auth/${provider}?type=login`);
      let payload: any = null;

      try {
        payload = await response.json();
      } catch (jsonError) {
        payload = null;
      }

      if (!response.ok) {
        setFeedback({
          variant: 'error',
          message:
            payload?.message ?? `We couldn't start ${providerLabels[provider]} login right now. Please try again shortly.`,
        });
        setIsLoading(null);
        return;
      }

      const redirectUrl = payload?.redirectUrl;
      if (redirectUrl && typeof redirectUrl === 'string') {
        setFeedback({
          variant: 'info',
          message: `Redirecting you to ${providerLabels[provider]}...`,
        });
        window.location.href = redirectUrl;
        return;
      }

      setFeedback({
        variant: payload?.success ? 'success' : 'info',
        message:
          payload?.message ?? `${providerLabels[provider]} responded without a redirect. You can close this window and try a different method.`,
      });
      setIsLoading(null);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setFeedback({
        variant: 'error',
        message: `Something went wrong while contacting ${providerLabels[provider]}. Please try again.`,
      });
      setIsLoading(null);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const GitHubIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 py-8">
      <div className="w-full max-w-lg">
        <EnhancedCard variant="elevated" className="bg-white shadow-xl">
          <EnhancedCardHeader className="text-center pb-8 pt-10">
            <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
              Welcome Back
            </EnhancedCardTitle>
            <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
              Sign in to your Tachi account to continue
            </p>
          </EnhancedCardHeader>

          <EnhancedCardContent className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 font-['Coinbase Display']">
                      Success
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display'] text-center">
                Sign in with your account
              </h3>
              
              <div className="space-y-3">
                {feedback && (
                  <div className={`rounded-lg border p-3 text-sm font-medium ${feedbackStyles[feedback.variant]}`}>
                    {feedback.message}
                  </div>
                )}
                {/* Google OAuth */}
                <EnhancedButton
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading !== null}
                  className="w-full font-mono flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  variant="outline"
                >
                  {isLoading === 'google' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Continue with Google</span>
                </EnhancedButton>

                {/* GitHub OAuth */}
                <EnhancedButton
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isLoading !== null}
                  className="w-full font-mono flex items-center justify-center space-x-3 bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900"
                  variant="primary"
                >
                  {isLoading === 'github' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <GitHubIcon />
                  )}
                  <span>Continue with GitHub</span>
                </EnhancedButton>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-[#52796F]">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#FF7043] hover:underline font-bold">
                  Create one here
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link href="/" className="text-sm text-[#52796F] hover:text-[#FF7043] transition-colors">
                ← Back to home
              </Link>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-bold text-[#1A1A1A] font-['Coinbase Display'] mb-2 text-sm">
                Secure Sign In
              </h4>
              <p className="text-sm text-[#52796F]">
                Your login is secured through OAuth. We never see your passwords and you maintain full control over access permissions.
              </p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}
