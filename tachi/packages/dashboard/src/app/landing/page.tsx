'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Users, BarChart3, Clock } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              {/* Placeholder for logo */}
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Tachi</span>
            </div>
            <Button>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Screen 1 */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="outline" className="mb-6 px-4 py-2">
              🚀 Revolutionary Web Crawling Protocol
            </Badge>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">Pay</span>-Per-
              <span className="text-green-500">Crawl</span>
              <span className="text-orange-500">.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              Web crawling has never been so fair.
              <br />
              Publishers get paid. Crawlers get access. Everyone wins.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-4 text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Screen 2 */}
      <section className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Three Pillars of Innovation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from hundreds of features, easy peasy with Tachi.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-600 mb-4">Instant</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">
                  Crawl data in seconds
                </h3>
                <p className="text-gray-600">
                  Lightning-fast protocol ensures immediate access to web content with real-time payment processing.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600 mb-4">Global</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">
                  Access all your domains instantly
                </h3>
                <p className="text-gray-600">
                  Manage domains from different registrars in a single app with universal protocol support.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl text-orange-600 mb-4">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">
                  Never lose your content again
                </h3>
                <p className="text-gray-600">
                  Your content will be automatically protected on blockchain - except those you don't want anymore.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Screen 3 */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Publish, earn, scale, right now.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Benefit 1 */}
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Publishers</h3>
              <p className="text-sm text-gray-600">Monetize your content automatically</p>
            </Card>

            {/* Benefit 2 */}
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">Track earnings and usage in real-time</p>
            </Card>

            {/* Benefit 3 */}
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant</h3>
              <p className="text-sm text-gray-600">Payments processed automatically</p>
            </Card>

            {/* Benefit 4 */}
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Reliable</h3>
              <p className="text-sm text-gray-600">Blockchain-backed reliability</p>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="px-12 py-4 text-lg mb-8">
              Get Started
            </Button>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <span>© 2024-2025 Tachi Inc. All rights reserved.</span>
              <Link href="#" className="hover:text-gray-700">Contact</Link>
              <Link href="#" className="hover:text-gray-700">Blog</Link>
              <Link href="#" className="hover:text-gray-700">Terms of Service</Link>
              <Link href="#" className="hover:text-gray-700">Privacy</Link>
              <Link href="#" className="hover:text-gray-700">Q & A</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
