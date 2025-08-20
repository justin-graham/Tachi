import React from 'react';

// Import from the moved UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

export default function UIShowcase() {
  const [inputValue, setInputValue] = React.useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            UI Component Showcase
          </h1>
          <p className="text-xl text-gray-600">
            Custom React components for interactive features
          </p>
        </header>

        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="guidance">Development Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Buttons Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                  <CardDescription>Various button styles and sizes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="default" size="lg">
                    Primary Button
                  </Button>
                  <Button variant="secondary" size="default">
                    Secondary Button
                  </Button>
                  <Button variant="outline" size="sm">
                    Outline Button
                  </Button>
                  <Button variant="destructive" size="sm">
                    Danger Button
                  </Button>
                </CardContent>
              </Card>

              {/* Cards Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Cards</CardTitle>
                  <CardDescription>Container components</CardDescription>
                </CardHeader>
                <CardContent>
                  <Card className="p-4">
                    <h4 className="font-semibold">Nested Card</h4>
                    <p className="text-sm text-gray-600">Cards can be nested for complex layouts</p>
                  </Card>
                </CardContent>
              </Card>

              {/* Badges Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Status indicators and labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Active</Badge>
                    <Badge variant="secondary">Draft</Badge>
                    <Badge variant="destructive">Error</Badge>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Components</CardTitle>
                <CardDescription>Interactive form elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                  />
                </div>
                <Separator />
                <div className="flex space-x-2">
                  <Button type="submit">Submit</Button>
                  <Button variant="outline" type="button">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">✅ Use Plasmic For</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Marketing pages (landing, pricing)</li>
                    <li>• Content that changes frequently</li>
                    <li>• Pages non-developers need to edit</li>
                    <li>• Static layouts and content sections</li>
                    <li>• Hero sections and testimonials</li>
                    <li>• FAQ and feature showcases</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">⚛️ Use Custom React For</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Interactive dashboards and forms</li>
                    <li>• Complex business logic</li>
                    <li>• Backend-integrated components</li>
                    <li>• Reusable UI component library</li>
                    <li>• State management and data fetching</li>
                    <li>• Custom hooks and utilities</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>Available pages in your application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">🎨 Plasmic Pages</h4>
                    <nav className="space-y-1">
                      <a href="/landing" className="block text-blue-600 hover:text-blue-800 text-sm">
                        Landing Page
                      </a>
                      <a href="/onboarding" className="block text-blue-600 hover:text-blue-800 text-sm">
                        Onboarding Flow
                      </a>
                      <a href="/pricing" className="block text-blue-600 hover:text-blue-800 text-sm">
                        Pricing Page
                      </a>
                    </nav>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">⚛️ Custom React Pages</h4>
                    <nav className="space-y-1">
                      <a href="/ui-showcase" className="block text-green-600 hover:text-green-800 text-sm">
                        UI Showcase (This Page)
                      </a>
                      <a href="/ui-showcase-full" className="block text-green-600 hover:text-green-800 text-sm">
                        Full UI Showcase
                      </a>
                    </nav>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
