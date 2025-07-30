'use client';

import { useState } from 'react';
import { usePublishersDirectory, useCrawlerRegistration, useApiStatus } from '../../hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Activity, 
  Users, 
  Globe, 
  DollarSign, 
  Bot, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from 'lucide-react';

export default function ApiDashboard() {
  const [crawlerForm, setCrawlerForm] = useState({
    name: '',
    contact: '',
    description: '',
  });

  // API hooks
  const { data: publishers, isLoading: publishersLoading } = usePublishersDirectory();
  const crawlerRegistration = useCrawlerRegistration();
  const { isOnline, isOffline, status } = useApiStatus();

  const handleCrawlerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await crawlerRegistration.mutateAsync(crawlerForm);
      alert(`Crawler registered! API Key: ${result.apiKey}`);
      setCrawlerForm({ name: '', contact: '', description: '' });
    } catch (error: any) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tachi API Dashboard</h1>
        <p className="text-muted-foreground">
          Manage publishers, crawlers, and monitor the Pay-Per-Crawl API
        </p>
      </div>

      {/* API Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isOnline && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
            {isOffline && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Status: {status}
            </span>
            <span className="text-sm text-muted-foreground">
              Endpoint: http://localhost:3001
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="crawlers">Crawlers</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Publishers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {publishers?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {publishers?.demo ? 'Demo Mode' : 'Live Data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Domains
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {publishers?.publishers?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monetized websites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Price/Request
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${publishers?.publishers ? 
                    (publishers.publishers.reduce((acc: number, p: any) => acc + p.pricePerRequest, 0) / publishers.publishers.length).toFixed(3) 
                    : '0.000'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  USD per crawl request
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  API Requests
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.7k</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last week
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Publishers Tab */}
        <TabsContent value="publishers">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Directory</CardTitle>
              <CardDescription>
                Publishers available in the Pay-Per-Crawl network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publishersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishers?.publishers?.map((publisher: any) => (
                    <div key={publisher.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{publisher.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {publisher.domain}
                          </p>
                          <p className="text-sm mt-1">{publisher.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={publisher.status === 'active' ? 'default' : 'secondary'}>
                            {publisher.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ${publisher.pricePerRequest}/request
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {publishers?.demo && (
                    <div className="text-center py-4">
                      <Badge variant="outline" className="bg-blue-50">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Demo Mode - Connect database for live data
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crawlers Tab */}
        <TabsContent value="crawlers">
          <Card>
            <CardHeader>
              <CardTitle>Crawler Registration</CardTitle>
              <CardDescription>
                Register a new AI crawler or bot for API access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCrawlerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Crawler Name</label>
                    <Input
                      value={crawlerForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlerForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My AI Crawler"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                      type="email"
                      value={crawlerForm.contact}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlerForm(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={crawlerForm.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlerForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your crawler's purpose"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={crawlerRegistration.isPending}
                  className="w-full md:w-auto"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {crawlerRegistration.isPending ? 'Registering...' : 'Register Crawler'}
                </Button>
              </form>

              {crawlerRegistration.isSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800">Registration Successful!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your crawler has been registered. Save your API key securely.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Testing Tab */}
        <TabsContent value="testing">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Test the available API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-mono text-sm">GET /health</span>
                      <p className="text-xs text-muted-foreground">Health check</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('http://localhost:3001/health', '_blank')}
                    >
                      Test
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-mono text-sm">GET /api/docs</span>
                      <p className="text-xs text-muted-foreground">API documentation</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('http://localhost:3001/api/docs', '_blank')}
                    >
                      Test
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-mono text-sm">GET /api/publishers/directory</span>
                      <p className="text-xs text-muted-foreground">Publisher directory</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('http://localhost:3001/api/publishers/directory', '_blank')}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <p className="text-sm">API Online</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">1.2ms</div>
                    <p className="text-sm">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
