'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({ email: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setErrors({ general: data.error || 'Failed to send reset email. Please try again.' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 py-8">
        <div className="w-full max-w-lg">
          <EnhancedCard variant="elevated" className="bg-white shadow-xl">
            <EnhancedCardHeader className="text-center pb-8 pt-10">
              <div className="w-24 h-24 mx-auto mb-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
                Check Your Email
              </EnhancedCardTitle>
              <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
                We've sent password reset instructions to {formData.email}
              </p>
            </EnhancedCardHeader>

            <EnhancedCardContent className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  If an account with that email exists, you'll receive a password reset link shortly. 
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-4">
                <EnhancedButton
                  onClick={() => router.push('/auth/login')}
                  className="w-full font-mono"
                  variant="primary"
                >
                  Back to Login
                </EnhancedButton>
              </div>

              <div className="text-center">
                <p className="text-sm text-[#52796F]">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-[#FF7043] hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 py-8">
      <div className="w-full max-w-lg">
        <EnhancedCard variant="elevated" className="bg-white shadow-xl">
          <EnhancedCardHeader className="text-center pb-8 pt-10">
            <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
              Reset Password
            </EnhancedCardTitle>
            <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </EnhancedCardHeader>

          <EnhancedCardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-bold text-[#1A1A1A] font-['Coinbase Display']">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors font-mono ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-[#FF7043]'
                  } focus:outline-none`}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 font-['Coinbase Display']">
                        Error
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {errors.general}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <EnhancedButton
                type="submit"
                disabled={isSubmitting}
                className="w-full font-mono"
                variant="primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </EnhancedButton>
            </form>

            {/* Back to Login */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-[#52796F]">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-[#FF7043] hover:underline font-bold">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link href="/" className="text-sm text-[#52796F] hover:text-[#FF7043] transition-colors">
                ← Back to home
              </Link>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-[#1A1A1A] font-['Coinbase Display'] mb-2 text-sm">
                Security Notice
              </h4>
              <p className="text-sm text-[#52796F]">
                For your security, password reset links expire after 1 hour. 
                If you don't receive an email, check your spam folder or try again.
              </p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}