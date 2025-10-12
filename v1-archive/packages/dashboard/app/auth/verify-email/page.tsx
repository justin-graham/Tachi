'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'waiting' | 'success' | 'error' | 'expired'>('waiting');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // If there's a token, automatically verify
    if (token) {
      verifyToken(token);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyToken = async (token: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push(`/auth/login?verified=true&email=${encodeURIComponent(data.email || email)}`);
        }, 3000);
      } else {
        if (response.status === 410) {
          setStatus('expired');
          setMessage('Verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox and spam folder.');
        setResendCooldown(60); // 60 second cooldown
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    if (verificationStatus === 'verifying') {
      return (
        <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF7043] border-t-transparent"></div>
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Link Expired';
      default:
        return verificationStatus === 'verifying' ? 'Verifying...' : 'Check Your Email';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'success':
        return 'Your email has been successfully verified. You can now access your account.';
      case 'error':
      case 'expired':
        return 'There was a problem verifying your email address.';
      default:
        return verificationStatus === 'verifying' 
          ? 'Please wait while we verify your email address.'
          : `We&apos;ve sent a verification link to ${email}. Click the link in the email to verify your account.`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 py-8">
      <div className="w-full max-w-lg">
        <EnhancedCard variant="elevated" className="bg-white shadow-xl">
          <EnhancedCardHeader className="text-center pb-8 pt-10">
            {getStatusIcon()}
            <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
              {getTitle()}
            </EnhancedCardTitle>
            <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
              {getDescription()}
            </p>
          </EnhancedCardHeader>

          <EnhancedCardContent className="space-y-6">
            {/* Status Message */}
            {message && (
              <div className={`border-2 rounded-lg p-4 ${
                status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : status === 'error' || status === 'expired'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${
                  status === 'success' 
                    ? 'text-green-700' 
                    : status === 'error' || status === 'expired'
                    ? 'text-red-700'
                    : 'text-blue-700'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {status === 'waiting' && verificationStatus !== 'verifying' && (
                <>
                  <EnhancedButton
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className="w-full font-mono"
                    variant="primary"
                  >
                    {isResending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      'Resend Verification Email'
                    )}
                  </EnhancedButton>
                  
                  <div className="text-center">
                    <p className="text-sm text-[#52796F] mb-2">
                      Didn't receive the email? Check your spam folder or try a different email address.
                    </p>
                  </div>
                </>
              )}

              {(status === 'error' || status === 'expired') && (
                <EnhancedButton
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0 || !email}
                  className="w-full font-mono"
                  variant="primary"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Send New Verification Email'
                  )}
                </EnhancedButton>
              )}

              {status === 'success' && (
                <EnhancedButton
                  onClick={() => router.push(`/auth/login?verified=true&email=${encodeURIComponent(email)}`)}
                  className="w-full font-mono"
                  variant="primary"
                >
                  Continue to Login
                </EnhancedButton>
              )}
            </div>

            {/* Navigation Links */}
            <div className="text-center pt-4 border-t border-gray-200 space-y-2">
              <div>
                <Link href="/auth/login" className="text-sm text-[#FF7043] hover:underline">
                  Back to Login
                </Link>
              </div>
              <div>
                <Link href="/auth/signup" className="text-sm text-[#52796F] hover:text-[#FF7043] transition-colors">
                  Need to create an account?
                </Link>
              </div>
              <div>
                <Link href="/" className="text-sm text-[#52796F] hover:text-[#FF7043] transition-colors">
                  ← Back to home
                </Link>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-[#1A1A1A] font-['Coinbase Display'] mb-2">
                Having trouble?
              </h4>
              <ul className="text-sm text-[#52796F] space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you're checking the correct email address</li>
                <li>• Verification links expire after 24 hours</li>
                <li>• Contact support if you continue having issues</li>
              </ul>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}