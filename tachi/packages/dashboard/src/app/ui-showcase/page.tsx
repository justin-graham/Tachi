'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function UIShowcase() {
  // Reusable Progress Stepper Component
  const TachiProgressStepper = ({ currentStep }: { currentStep: number }) => {
    const steps = [
      { number: 1, title: "Connect Wallet", description: "Setup account" },
      { number: 2, title: "Site Details", description: "Configure website" },
      { number: 3, title: "Pricing Setup", description: "Set crawl rates" },
      { number: 4, title: "Generate License", description: "Create NFT terms" },
      { number: 5, title: "Deploy & Launch", description: "Go live" },
    ];

    return (
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
        <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  {/* Step Circle and Details */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.number < currentStep || currentStep > 5
                        ? 'bg-gray-900 text-white' 
                        : step.number === currentStep 
                        ? 'border-2 border-gray-900 bg-gray-900 text-white' 
                        : 'border-2 border-gray-300 bg-white'
                    }`}>
                      {step.number < currentStep || currentStep > 5 ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className={`text-sm font-bold ${step.number > currentStep ? 'text-gray-400' : ''}`}>
                          {step.number}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-medium mb-1 ${step.number > currentStep ? 'text-gray-400' : 'text-gray-500'}`}>
                      STEP {step.number}
                    </div>
                    <div className={`text-sm font-semibold ${step.number > currentStep ? 'text-gray-400' : 'text-gray-900'}`}>
                      {step.title}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                      step.number < currentStep || currentStep > 5
                        ? 'bg-green-100 text-green-700' 
                        : step.number === currentStep 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.number < currentStep || currentStep > 5 ? 'Completed' : step.number === currentStep ? 'In Progress' : 'Pending'}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-4 ${step.number < currentStep || currentStep > 5 ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">UI Component Showcase</h1>
        <p className="text-muted-foreground">
          Visual playground for iterating on components and layouts
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="theme">Custom Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          <h2 className="text-2xl font-semibold">Modern Floating Card Components</h2>
          
          {/* Floating Cards Layout */}
          <div className="relative min-h-[600px] p-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl overflow-hidden">
            
            {/* Stack of Cards - Positioned like the image */}
            <div className="absolute top-8 left-8 transform rotate-[-2deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#FFA726', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">F</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Framer</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Senior UX Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3,500-5,500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">FULL TIME</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs">B2B</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 7 DAY AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute top-16 left-64 transform rotate-[3deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#FF6B9D', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#066D5A'}}>
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">slack</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Senior UI Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3500-5500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">PROJECT BASED</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 5 DAY AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute top-32 right-16 transform rotate-[-1deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#DDA83E', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">slack</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Lead Product Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3,500-5,500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">FULL TIME</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">FULL-TIME</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 2 DAY AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute bottom-32 left-32 transform rotate-[2deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#4FC3F7', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CD5230'}}>
                        <span className="text-white font-bold text-sm">L</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">loom</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Product Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3,000-3,500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">FULL TIME</Badge>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs">US BASED</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED YESTERDAY</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute bottom-24 right-32 transform rotate-[-3deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#9E828F', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">H</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">hopin</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Lead Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$4,500-5,500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">PROJECT BASED</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">FULL-TIME</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 3 DAY AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 transform rotate-[1deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#4CAF50', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">G</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Google</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Senior UI Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3,800-5,00 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">FULL TIME</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">FULL-TIME</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 1 MONTH AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="absolute top-64 left-96 transform rotate-[-4deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-72 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">slack</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Senior UI Designer</h3>
                    <p className="text-gray-600 text-sm mb-3">$3,500-5,500 net</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">PART TIME</Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">REMOTE</Badge>
                    </div>
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400">POSTED 2 DAY AGO</div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>

          {/* Individual Card Variants */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6">Card Variations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Primary Theme Card */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#066D5A'}}>
                        <span className="text-white font-bold text-sm">T</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Tachi</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Publisher Account</h3>
                    <p className="text-gray-600 text-sm mb-3">Pay-per-crawl revenue</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge style={{backgroundColor: '#066D5A20', color: '#066D5A'}} className="text-xs">ACTIVE</Badge>
                      <Badge style={{backgroundColor: '#DDA83E20', color: '#DDA83E'}} className="text-xs">VERIFIED</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Theme Card */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#DDA83E', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#DDA83E'}}>
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Analytics</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Revenue Analytics</h3>
                    <p className="text-gray-600 text-sm mb-3">Track your earnings</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge style={{backgroundColor: '#DDA83E20', color: '#DDA83E'}} className="text-xs">REAL-TIME</Badge>
                      <Badge style={{backgroundColor: '#066D5A20', color: '#066D5A'}} className="text-xs">DETAILED</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Accent Theme Card */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#CD5230', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CD5230'}}>
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Settings</div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Account Settings</h3>
                    <p className="text-gray-600 text-sm mb-3">Manage your preferences</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge style={{backgroundColor: '#CD523020', color: '#CD5230'}} className="text-xs">SECURE</Badge>
                      <Badge style={{backgroundColor: '#9E828F20', color: '#9E828F'}} className="text-xs">PRIVATE</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <h2 className="text-2xl font-semibold">Form Components</h2>
          <p className="text-muted-foreground">Modern floating card forms with the same design system</p>
          
          {/* Floating Form Cards Layout */}
          <div className="relative min-h-[600px] p-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl overflow-hidden">
            
            {/* Contact Form Card */}
            <div className="absolute top-8 left-8 transform rotate-[-1deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-80 h-56 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#066D5A'}}>
                        <span className="text-white font-bold text-sm">📝</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Contact Form</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                        <Input className="h-8 text-sm" placeholder="John Doe" defaultValue="Sarah Wilson" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Email Address</Label>
                        <Input className="h-8 text-sm" type="email" placeholder="john@example.com" defaultValue="sarah@company.com" />
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1 h-7 text-xs" style={{backgroundColor: '#066D5A'}}>Send Message</Button>
                        <Button variant="outline" className="flex-1 h-7 text-xs">Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="absolute top-20 right-16 transform rotate-[2deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#DDA83E', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-80 h-64 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#DDA83E'}}>
                        <span className="text-white font-bold text-sm">👤</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Sign Up Form</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">First Name</Label>
                          <Input className="h-8 text-sm" placeholder="John" defaultValue="Alex" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Last Name</Label>
                          <Input className="h-8 text-sm" placeholder="Doe" defaultValue="Chen" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Email</Label>
                        <Input className="h-8 text-sm" type="email" placeholder="alex@example.com" defaultValue="alex.chen@startup.io" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Password</Label>
                        <Input className="h-8 text-sm" type="password" placeholder="••••••••" defaultValue="securepass123" />
                      </div>
                      
                      <Button className="w-full h-7 text-xs mt-3" style={{backgroundColor: '#DDA83E'}}>
                        Create Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Payment Form Card */}
            <div className="absolute bottom-32 left-32 transform rotate-[1deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#CD5230', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-80 h-64 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CD5230'}}>
                        <span className="text-white font-bold text-sm">💳</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Payment Details</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Card Number</Label>
                        <Input className="h-8 text-sm font-mono" placeholder="1234 5678 9012 3456" defaultValue="4532 1234 5678 9012" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Expiry</Label>
                          <Input className="h-8 text-sm font-mono" placeholder="MM/YY" defaultValue="12/28" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">CVV</Label>
                          <Input className="h-8 text-sm font-mono" placeholder="123" defaultValue="456" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Cardholder Name</Label>
                        <Input className="h-8 text-sm" placeholder="John Doe" defaultValue="Michael Rodriguez" />
                      </div>
                      
                      <Button className="w-full h-7 text-xs mt-3" style={{backgroundColor: '#CD5230'}}>
                        Process Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Settings Form Card */}
            <div className="absolute bottom-16 right-24 transform rotate-[-2deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#9E828F', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-80 h-56 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#9E828F'}}>
                        <span className="text-white font-bold text-sm">⚙️</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">User Preferences</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Display Name</Label>
                        <Input className="h-8 text-sm" placeholder="Your Name" defaultValue="Jamie Taylor" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Bio</Label>
                        <Input className="h-8 text-sm" placeholder="Tell us about yourself" defaultValue="Product designer & coffee enthusiast" />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <input type="checkbox" id="notifications" className="rounded" defaultChecked />
                        <Label htmlFor="notifications" className="text-xs text-gray-600">Email notifications</Label>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1 h-7 text-xs" style={{backgroundColor: '#9E828F'}}>Save Changes</Button>
                        <Button variant="outline" className="flex-1 h-7 text-xs">Reset</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Newsletter Signup Card */}
            <div className="absolute top-72 left-72 transform rotate-[-3deg]">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#4FC3F7', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative w-80 h-40 border-0 shadow-lg bg-white rounded-2xl transform transition-all hover:scale-105 hover:rotate-0 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#4FC3F7'}}>
                        <span className="text-white font-bold text-sm">📧</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Newsletter</div>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-sm mb-2">Stay Updated</h3>
                    <p className="text-gray-600 text-xs mb-3">Get the latest news and updates</p>
                    
                    <div className="space-y-2">
                      <Input className="h-8 text-sm" type="email" placeholder="your@email.com" defaultValue="subscribe@example.com" />
                      <Button className="w-full h-7 text-xs" style={{backgroundColor: '#4FC3F7'}}>
                        Subscribe Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>

          {/* Individual Form Variants */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6">Form Variations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tachi Site Setup Form */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Site Configuration</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Domain</Label>
                        <Input className="h-8 text-sm" placeholder="example.com" defaultValue="mysite.com" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Website Name</Label>
                        <Input className="h-8 text-sm" placeholder="My Website" defaultValue="AI Content Hub" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Crawl Price (USDC)</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                          <Input className="h-8 text-sm pl-6 font-mono" placeholder="0.005" defaultValue="0.010" />
                        </div>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#066D5A'}}>
                        Generate License
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Publisher Analytics Form */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#DDA83E', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Analytics Configuration</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Date Range</Label>
                        <Input className="h-8 text-sm" type="date" defaultValue="2024-01-01" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Metrics</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>Revenue</option>
                          <option>Crawl Count</option>
                          <option>Success Rate</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="realtime" className="rounded" defaultChecked />
                        <Label htmlFor="realtime" className="text-xs text-gray-600">Real-time updates</Label>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#DDA83E'}}>
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* API Settings Form */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#CD5230', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform transition-all hover:scale-105 duration-300 translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">API Configuration</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">API Key Name</Label>
                        <Input className="h-8 text-sm" placeholder="My API Key" defaultValue="Production Key" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Permissions</Label>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="read" className="rounded" defaultChecked />
                            <Label htmlFor="read" className="text-xs text-gray-600">Read access</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="write" className="rounded" />
                            <Label htmlFor="write" className="text-xs text-gray-600">Write access</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#CD5230'}}>
                        Create API Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-6">
          <h2 className="text-2xl font-semibold">Button Variants</h2>
          
          <div className="space-y-8">
            {/* Primary Button States */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Primary Button States</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Normal */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Normal</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200"
                    style={{backgroundColor: '#066D5A'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Hover */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Hover</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 hover:scale-105"
                    style={{backgroundColor: '#066D5A', opacity: 0.8}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 80%</div>
                </div>

                {/* Pressed */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Pressed</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-inner transform scale-95 transition-all duration-200"
                    style={{backgroundColor: '#066D5A'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Focused */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Focused</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg ring-4 ring-green-200 transition-all duration-200"
                    style={{backgroundColor: '#066D5A'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Disabled */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Disabled</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium cursor-not-allowed"
                    style={{backgroundColor: '#066D5A', opacity: 0.2}}
                    disabled
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 20%</div>
                </div>
              </div>
            </div>

            {/* Secondary Button States */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Secondary Button States</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Normal */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Normal</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200"
                    style={{backgroundColor: '#DDA83E'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Hover */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Hover</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 hover:scale-105"
                    style={{backgroundColor: '#DDA83E', opacity: 0.8}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 80%</div>
                </div>

                {/* Pressed */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Pressed</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-inner transform scale-95 transition-all duration-200"
                    style={{backgroundColor: '#DDA83E'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Focused */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Focused</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg ring-4 ring-yellow-200 transition-all duration-200"
                    style={{backgroundColor: '#DDA83E'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Disabled */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Disabled</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium cursor-not-allowed"
                    style={{backgroundColor: '#DDA83E', opacity: 0.2}}
                    disabled
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 20%</div>
                </div>
              </div>
            </div>

            {/* Accent Button States */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Accent Button States</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Normal */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Normal</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200"
                    style={{backgroundColor: '#CD5230'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Hover */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Hover</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 hover:scale-105"
                    style={{backgroundColor: '#CD5230', opacity: 0.8}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 80%</div>
                </div>

                {/* Pressed */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Pressed</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-inner transform scale-95 transition-all duration-200"
                    style={{backgroundColor: '#CD5230'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Focused */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Focused</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg ring-4 ring-red-200 transition-all duration-200"
                    style={{backgroundColor: '#CD5230'}}
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 100%</div>
                </div>

                {/* Disabled */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Disabled</div>
                  <button 
                    className="w-full px-6 py-3 rounded-xl text-white font-medium cursor-not-allowed"
                    style={{backgroundColor: '#CD5230', opacity: 0.2}}
                    disabled
                  >
                    Button
                  </button>
                  <div className="text-xs text-gray-500">Opacity 20%</div>
                </div>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Button Sizes</h3>
              <div className="flex gap-4 items-center flex-wrap">
                <button 
                  className="px-4 py-2 rounded-lg text-white font-medium shadow-lg transition-all duration-200"
                  style={{backgroundColor: '#066D5A'}}
                >
                  Small
                </button>
                <button 
                  className="px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200"
                  style={{backgroundColor: '#066D5A'}}
                >
                  Default
                </button>
                <button 
                  className="px-8 py-4 rounded-xl text-white font-medium shadow-lg transition-all duration-200"
                  style={{backgroundColor: '#066D5A'}}
                >
                  Large
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="layouts" className="space-y-6">
          <h2 className="text-2xl font-semibold">Layout Examples</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Layout</CardTitle>
                <CardDescription>Example of a dashboard-style layout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h4 className="font-semibold">Metric 1</h4>
                    <p className="text-2xl font-bold text-blue-600">$1,234</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h4 className="font-semibold">Metric 2</h4>
                    <p className="text-2xl font-bold text-green-600">89%</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h4 className="font-semibold">Metric 3</h4>
                    <p className="text-2xl font-bold text-orange-600">142</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content + Sidebar Layout</CardTitle>
                <CardDescription>Two-column layout example</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Main Content</h4>
                    <p>This is where your main content would go. You can experiment with different layouts, spacing, and styling here.</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Sidebar</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Navigation item 1</li>
                      <li>• Navigation item 2</li>
                      <li>• Navigation item 3</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <h2 className="text-2xl font-semibold">Real Tachi Website Flow</h2>
          <p className="text-muted-foreground">Complete page-by-page navigation flow as users experience the actual Tachi Pay-Per-Crawl dashboard</p>
          
          <div className="space-y-8">
            
            {/* Step 1: Connect Wallet */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={1} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Connect Wallet</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">Connection Status:</span>
                        <Badge variant="outline">Not Connected</Badge>
                      </div>
                      
                      <Button className="w-full h-8 text-sm" style={{backgroundColor: '#066D5A'}}>
                        Connect Wallet
                      </Button>
                      
                      <div className="p-3 bg-blue-50 rounded-lg text-left">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Supported Wallets:</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• MetaMask</li>
                          <li>• WalletConnect</li>
                          <li>• Rainbow Wallet</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2: Site Details */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={2} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#DDA83E', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Site Details</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Website Name</Label>
                        <Input className="h-8 text-sm" placeholder="My Website" defaultValue="AI Content Hub" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Domain</Label>
                        <Input className="h-8 text-sm" placeholder="example.com" defaultValue="mysite.com" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Description</Label>
                        <Input className="h-8 text-sm" placeholder="Brief description" defaultValue="Premium AI-generated content" />
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#DDA83E'}}>
                        Continue to Pricing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3: Pricing Setup */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={3} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#CD5230', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Pricing Setup</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Crawl Price (USDC)</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                          <Input className="h-8 text-sm pl-6 font-mono" placeholder="0.005" defaultValue="0.010" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Payment Token</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>USDC</option>
                          <option>USDT</option>
                          <option>DAI</option>
                        </select>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-800">Recommended: $0.005 - $0.020 per crawl</p>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#CD5230'}}>
                        Set Pricing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4: Generate License */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={4} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#9E828F', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Generate License</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">License Type</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>Standard License</option>
                          <option>Premium License</option>
                          <option>Enterprise License</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Terms Duration</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>1 Year</option>
                          <option>2 Years</option>
                          <option>Unlimited</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="terms" className="rounded" defaultChecked />
                        <Label htmlFor="terms" className="text-xs text-gray-600">Accept terms and conditions</Label>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#9E828F'}}>
                        Generate License NFT
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 5: Deploy & Launch */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={5} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#4FC3F7', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Deploy & Launch</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Deployment Target</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>Cloudflare Workers</option>
                          <option>Vercel Edge</option>
                          <option>AWS Lambda</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Environment</Label>
                        <select className="w-full h-8 text-sm border rounded px-2">
                          <option>Production</option>
                          <option>Staging</option>
                          <option>Development</option>
                        </select>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-800">Ready to deploy your pay-per-crawl website!</p>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#4FC3F7'}}>
                        Deploy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 6: Complete Dashboard */}
            <div className="space-y-6">
              <TachiProgressStepper currentStep={6} />
              
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl" style={{backgroundColor: '#066D5A', width: 'calc(100% + 1rem)', height: 'calc(100% + 1.5rem)'}}></div>
                <Card className="relative border-0 shadow-lg rounded-2xl bg-white transform translate-x-2 translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Dashboard Live</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Your website is now live and earning revenue!</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">Crawls Today</div>
                          <div className="text-sm font-bold">24</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">Revenue</div>
                          <div className="text-sm font-bold">$0.48</div>
                        </div>
                      </div>
                      
                      <Button className="w-full h-8 text-xs mt-3" style={{backgroundColor: '#066D5A'}}>
                        View Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <h2 className="text-2xl font-semibold">Custom Color Palette</h2>
          
          {/* Modern Dashboard Inspired Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Modern Dashboard Layout</CardTitle>
              <CardDescription>Inspired by the example images with your custom color palette</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 bg-gray-50 min-h-screen">
                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  
                  {/* Revenue Card - Large */}
                  <div className="lg:col-span-2">
                    <Card className="h-full border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #066D5A, #0a8a72)'}}>
                      <CardContent className="p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium opacity-90">Total Revenue</h3>
                            <div className="text-3xl font-bold mt-2">$22,428.26</div>
                          </div>
                          <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm opacity-75">•••• 9090</span>
                          <span className="text-sm opacity-75">04/24</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-75">Weekly Revenue</span>
                            <Badge style={{backgroundColor: '#DDA83E', color: '#066D5A'}} className="text-xs">
                              +12%
                            </Badge>
                          </div>
                          <div className="text-xl font-semibold mt-1">+2,332 USD</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analytics Card */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold" style={{color: '#066D5A'}}>Analytics</h3>
                        <svg className="w-5 h-5" style={{color: '#9E828F'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold mb-4" style={{color: '#066D5A'}}>$242.63</div>
                      
                      {/* Mini chart representation */}
                      <div className="flex items-end gap-1 h-16 mb-2">
                        <div className="w-8 rounded-t" style={{backgroundColor: '#066D5A', height: '80%'}}></div>
                        <div className="w-8 rounded-t" style={{backgroundColor: '#CABB9D', height: '60%'}}></div>
                        <div className="w-8 rounded-t" style={{backgroundColor: '#CABB9D', height: '50%'}}></div>
                      </div>
                      <div className="flex justify-between text-xs" style={{color: '#9E828F'}}>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium mt-1">
                        <span style={{color: '#066D5A'}}>64%</span>
                        <span style={{color: '#9E828F'}}>52%</span>
                        <span style={{color: '#9E828F'}}>46%</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics Card - Accent */}
                  <Card className="border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #CD5230, #e06b47)'}}>
                    <CardContent className="p-6 text-white">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold">Statistics</h3>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold mb-4">$184.44</div>
                      
                      {/* Chart with peak indicator */}
                      <div className="relative h-16 mb-2">
                        {/* Curved line representation */}
                        <svg className="w-full h-full" viewBox="0 0 100 40">
                          <path
                            d="M 10,30 Q 30,10 50,20 T 90,15"
                            stroke="white"
                            strokeWidth="2"
                            fill="none"
                            opacity="0.8"
                          />
                          <circle cx="70" cy="12" r="3" fill="white" />
                        </svg>
                        <div className="absolute top-0 right-6 bg-white text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                          727
                        </div>
                      </div>
                      <div className="flex justify-between text-xs opacity-75">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Partner Cashback */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold" style={{color: '#066D5A'}}>Cashback From Partners</h3>
                        <svg className="w-5 h-5" style={{color: '#9E828F'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      
                      {/* Partner badges */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            G
                          </div>
                          <div>
                            <div className="text-sm font-medium">Google</div>
                            <div className="text-xs" style={{color: '#9E828F'}}>Cashback: 4.2%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                            A
                          </div>
                          <div>
                            <div className="text-sm font-medium">Apple</div>
                            <div className="text-xs" style={{color: '#9E828F'}}>Cashback: 1.8%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Templates */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4" style={{color: '#066D5A'}}>Payment Templates</h3>
                      <div className="text-2xl font-bold mb-2" style={{color: '#066D5A'}}>$486.32</div>
                      <div className="text-sm mb-4" style={{color: '#9E828F'}}>
                        <div>Mandatory payments</div>
                        <div className="text-xs opacity-75">Essential dues</div>
                      </div>
                      
                      {/* User avatars */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full border-2 border-white" style={{backgroundColor: '#CABB9D'}}></div>
                          <div className="w-8 h-8 rounded-full border-2 border-white" style={{backgroundColor: '#DDA83E'}}></div>
                          <div className="w-8 h-8 rounded-full border-2 border-white" style={{backgroundColor: '#9E828F'}}></div>
                          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-semibold" style={{backgroundColor: '#066D5A'}}>
                            +8
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Links */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4" style={{color: '#066D5A'}}>Quick Links</h3>
                      <div className="text-sm mb-4" style={{color: '#9E828F'}}>Essential dues</div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" style={{color: '#066D5A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="text-xs font-medium">Request</div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" style={{color: '#066D5A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </div>
                          <div className="text-xs font-medium">Send</div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" style={{color: '#066D5A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                          <div className="text-xs font-medium">Receive</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row - Larger Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  
                  {/* Large Engagement Card */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg h-full" style={{background: 'linear-gradient(135deg, #DDA83E, #f4b942)'}}>
                      <CardContent className="p-8 text-white h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="text-sm opacity-90 mb-2">Organizational</div>
                              <h2 className="text-3xl font-bold">Engagement</h2>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            </div>
                          </div>
                          <p className="text-lg opacity-90 mb-6">
                            Develop your sense of belonging and an active involvement in meaningful...
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                              <span className="font-semibold">5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                              <span className="font-semibold">80%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Smaller category cards */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #9E828F, #b8a1a8)'}}>
                      <CardContent className="p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-sm opacity-90 mb-1">Organizational</div>
                            <h3 className="text-xl font-bold">Resilience</h3>
                          </div>
                          <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-4">
                          Learn how to tackle adversity, challenges and professional setbac...
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="text-sm font-semibold">4.1</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-sm font-semibold">12%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #066D5A, #0a8a72)'}}>
                      <CardContent className="p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-sm opacity-90 mb-1">Organizational</div>
                            <h3 className="text-xl font-bold">Growth</h3>
                          </div>
                          <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-4">
                          Create a development plan that best fits your goals and sense of purpose.
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="text-sm font-semibold">4.5</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-sm font-semibold">32%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette Display */}
          <Card>
            <CardHeader>
              <CardTitle>Your Color Palette</CardTitle>
              <CardDescription>Earthy, sophisticated tones for your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="w-full h-20 rounded-lg mb-2" style={{backgroundColor: '#9E828F'}}></div>
                  <div className="text-sm font-medium">Mountbatten Pink</div>
                  <div className="text-xs text-muted-foreground">#9E828F</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 rounded-lg mb-2" style={{backgroundColor: '#CABB9D'}}></div>
                  <div className="text-sm font-medium">Khaki</div>
                  <div className="text-xs text-muted-foreground">#CABB9D</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 rounded-lg mb-2" style={{backgroundColor: '#DDA83E'}}></div>
                  <div className="text-sm font-medium">Hunyadi Yellow</div>
                  <div className="text-xs text-muted-foreground">#DDA83E</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 rounded-lg mb-2" style={{backgroundColor: '#066D5A'}}></div>
                  <div className="text-sm font-medium">Pine Green</div>
                  <div className="text-xs text-muted-foreground">#066D5A</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 rounded-lg mb-2" style={{backgroundColor: '#CD5230'}}></div>
                  <div className="text-sm font-medium">Jasper</div>
                  <div className="text-xs text-muted-foreground">#CD5230</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Themed Components */}
          <div className="space-y-8">
            
            {/* Themed Cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Themed Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-2" style={{borderColor: '#066D5A', backgroundColor: '#f8fffe'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#066D5A'}}>Primary Card</CardTitle>
                    <CardDescription style={{color: '#9E828F'}}>
                      Using pine green and mountbatten pink
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3">Clean, professional design with your brand colors.</p>
                    <Button style={{backgroundColor: '#066D5A', borderColor: '#066D5A'}} className="text-white hover:opacity-90">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2" style={{borderColor: '#DDA83E', backgroundColor: '#fffdf7'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#066D5A'}}>Accent Card</CardTitle>
                    <CardDescription style={{color: '#9E828F'}}>
                      Featuring hunyadi yellow highlights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge style={{backgroundColor: '#DDA83E', color: '#066D5A'}} className="mb-2">Featured</Badge>
                    <p>Warm, inviting design that draws attention.</p>
                  </CardContent>
                </Card>

                <Card className="border-2" style={{borderColor: '#CD5230', backgroundColor: '#fefaf9'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#066D5A'}}>Alert Card</CardTitle>
                    <CardDescription style={{color: '#9E828F'}}>
                      Using jasper for important notices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge style={{backgroundColor: '#CD5230'}} className="mb-2 text-white">Important</Badge>
                    <p>Eye-catching design for critical information.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Themed Buttons */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Themed Button Variants</h3>
              <div className="flex gap-3 flex-wrap">
                <Button style={{backgroundColor: '#066D5A', borderColor: '#066D5A'}} className="text-white hover:opacity-90">
                  Primary
                </Button>
                <Button style={{backgroundColor: '#DDA83E', borderColor: '#DDA83E', color: '#066D5A'}} className="hover:opacity-90">
                  Secondary
                </Button>
                <Button style={{backgroundColor: '#CD5230', borderColor: '#CD5230'}} className="text-white hover:opacity-90">
                  Accent
                </Button>
                <Button variant="outline" style={{borderColor: '#066D5A', color: '#066D5A'}} className="hover:bg-gray-50">
                  Outline
                </Button>
                <Button variant="ghost" style={{color: '#9E828F'}} className="hover:bg-gray-50">
                  Ghost
                </Button>
              </div>
            </div>

            {/* Themed Dashboard Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Themed Dashboard Preview</CardTitle>
                <CardDescription>How your dashboard looks with the new color palette</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  {/* Header with theme */}
                  <div className="p-4 border-b" style={{backgroundColor: '#066D5A'}}>
                    <div className="flex justify-between items-center">
                      <h1 className="text-xl font-bold text-white">Tachi Publisher Dashboard</h1>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                          Settings
                        </Button>
                        <Button size="sm" style={{backgroundColor: '#DDA83E', color: '#066D5A'}} className="hover:opacity-90">
                          Connect Wallet
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats with themed colors */}
                  <div className="p-6" style={{backgroundColor: '#fefefe'}}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="border-l-4" style={{borderLeftColor: '#066D5A'}}>
                        <CardContent className="p-4">
                          <div className="text-sm" style={{color: '#9E828F'}}>Total Revenue</div>
                          <div className="text-2xl font-bold" style={{color: '#066D5A'}}>$12,345</div>
                          <div className="text-xs" style={{color: '#DDA83E'}}>+12% from last month</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-l-4" style={{borderLeftColor: '#DDA83E'}}>
                        <CardContent className="p-4">
                          <div className="text-sm" style={{color: '#9E828F'}}>Active Licenses</div>
                          <div className="text-2xl font-bold" style={{color: '#066D5A'}}>24</div>
                          <div className="text-xs" style={{color: '#066D5A'}}>3 new this week</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-l-4" style={{borderLeftColor: '#CD5230'}}>
                        <CardContent className="p-4">
                          <div className="text-sm" style={{color: '#9E828F'}}>Crawl Requests</div>
                          <div className="text-2xl font-bold" style={{color: '#066D5A'}}>1,234</div>
                          <div className="text-xs" style={{color: '#CD5230'}}>+5% today</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-l-4" style={{borderLeftColor: '#CABB9D'}}>
                        <CardContent className="p-4">
                          <div className="text-sm" style={{color: '#9E828F'}}>Success Rate</div>
                          <div className="text-2xl font-bold" style={{color: '#066D5A'}}>98.5%</div>
                          <div className="text-xs" style={{color: '#066D5A'}}>Excellent</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Action buttons with theme */}
                    <div className="flex gap-3 flex-wrap">
                      <Button style={{backgroundColor: '#066D5A'}} className="text-white hover:opacity-90">
                        Create License
                      </Button>
                      <Button style={{backgroundColor: '#DDA83E', color: '#066D5A'}} className="hover:opacity-90">
                        View Analytics
                      </Button>
                      <Button variant="outline" style={{borderColor: '#9E828F', color: '#9E828F'}} className="hover:bg-gray-50">
                        Download Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gradient Examples */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Gradient Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className="h-24 rounded-lg mb-4 flex items-center justify-center text-white font-semibold"
                      style={{background: 'linear-gradient(135deg, #066D5A, #DDA83E)'}}
                    >
                      Primary Gradient
                    </div>
                    <p className="text-sm text-muted-foreground">Pine Green to Hunyadi Yellow</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div 
                      className="h-24 rounded-lg mb-4 flex items-center justify-center text-white font-semibold"
                      style={{background: 'linear-gradient(135deg, #9E828F, #CABB9D)'}}
                    >
                      Subtle Gradient
                    </div>
                    <p className="text-sm text-muted-foreground">Mountbatten Pink to Khaki</p>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Visit <code className="bg-muted px-2 py-1 rounded">/ui-showcase</code> to iterate on your UI components.
          <br />
          Edit this file at <code className="bg-muted px-2 py-1 rounded">src/app/ui-showcase/page.tsx</code>
        </p>
      </div>
    </div>
  );
}
