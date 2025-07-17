"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Globe, Building, Mail, FileText, Upload, Check, AlertTriangle, Eye, Shield } from 'lucide-react'
import { siteDetailsStepSchema, type SiteDetailsStepData } from '@/schemas/site-details'
import { generateDefaultTermsOfService, validateTermsContent } from '@/utils/terms-template'
import { IPFSUploader, type IPFSUploadResult } from '@/utils/ipfs-upload'

interface SiteDetailsStepProps {
  onComplete: (data: SiteDetailsStepData) => void
  isComplete: boolean
}

export function SiteDetailsStep({ onComplete, isComplete }: SiteDetailsStepProps) {
  const [currentTab, setCurrentTab] = useState<'details' | 'terms'>('details')
  const [generatedTerms, setGeneratedTerms] = useState<string>('')
  const [termsValidation, setTermsValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [ipfsResult, setIpfsResult] = useState<IPFSUploadResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [useCustomTerms, setUseCustomTerms] = useState(false)
  const [customTerms, setCustomTerms] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid: isFormValid },
    trigger,
    setValue,
    getValues
  } = useForm<SiteDetailsStepData>({
    resolver: zodResolver(siteDetailsStepSchema),
    mode: 'onChange',
    defaultValues: {
      termsAccepted: false,
      termsContent: '',
    }
  })

  const formData = watch()

  // Generate terms when form data changes
  const handleGenerateTerms = async () => {
    if (formData.domain && formData.websiteName && formData.companyName && formData.contactEmail) {
      const terms = generateDefaultTermsOfService({
        companyName: formData.companyName,
        websiteName: formData.websiteName,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        lastUpdated: new Date()
      })
      
      setGeneratedTerms(terms)
      setValue('termsContent', terms)
      setCurrentTab('terms')
      
      // Validate the generated terms
      const validation = validateTermsContent(terms)
      setTermsValidation(validation)
      
      // Trigger validation
      await trigger('termsContent')
    }
  }

  // Handle custom terms changes
  const handleCustomTermsChange = async (content: string) => {
    setCustomTerms(content)
    setValue('termsContent', content)
    const validation = validateTermsContent(content)
    setTermsValidation(validation)
    
    // Trigger validation
    await trigger('termsContent')
  }

  // Handle terms acceptance
  const handleTermsAcceptance = async (accepted: boolean) => {
    setTermsAccepted(accepted)
    setValue('termsAccepted', accepted)
    await trigger('termsAccepted')
  }

  // Upload terms to IPFS
  const handleUploadTerms = async () => {
    const termsContent = useCustomTerms ? customTerms : generatedTerms
    
    if (!termsContent || !termsValidation?.isValid || !termsAccepted) {
      return
    }

    // Validate the entire form before proceeding
    const isValid = await trigger()
    if (!isValid) {
      return
    }

    setIsUploading(true)
    
    try {
      const uploader = new IPFSUploader()
      const result = await uploader.uploadTermsOfService(termsContent, {
        websiteName: formData.websiteName,
        domain: formData.domain,
        companyName: formData.companyName
      })
      
      setIpfsResult(result)
      
      if (result.success && result.uri) {
        // Complete the step with enhanced validated data
        const completionData: SiteDetailsStepData = {
          ...getValues(),
          termsURI: result.uri,
          termsContent: termsContent,
          termsAccepted: true
        }
        onComplete(completionData)
      }
    } catch (error) {
      console.error('Failed to upload terms:', error)
      setIpfsResult({
        success: false,
        error: 'Failed to upload terms to IPFS'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const canProceed = isFormValid && 
    ((generatedTerms && !useCustomTerms) || (customTerms && useCustomTerms)) && 
    termsValidation?.isValid && 
    termsAccepted

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Globe className="h-6 w-6 text-blue-600" />
          <CardTitle>Site Details & Terms</CardTitle>
        </div>
        <CardDescription>
          Configure your website details and generate Terms of Service for crawlers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          <button
            onClick={() => setCurrentTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Website Details
          </button>
          <button
            onClick={() => setCurrentTab('terms')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'terms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Website Details Tab */}
        {currentTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Domain</span>
                </Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  {...register('domain')}
                />
                {errors.domain && (
                  <p className="text-sm text-red-600">{errors.domain.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteName">Website Name</Label>
                <Input
                  id="websiteName"
                  placeholder="My Awesome Website"
                  {...register('websiteName')}
                />
                {errors.websiteName && (
                  <p className="text-sm text-red-600">{errors.websiteName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of your website and content..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>Company Name</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corp"
                  {...register('companyName')}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Contact Email</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@example.com"
                  {...register('contactEmail')}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant={isFormValid ? "default" : "outline"} className={isFormValid ? "bg-green-100 text-green-800" : ""}>
                  {isFormValid ? "✓ Valid" : "Incomplete"}
                </Badge>
                {isFormValid && (
                  <span className="text-sm text-green-600">
                    All required fields completed
                  </span>
                )}
                {Object.keys(errors).length > 0 && (
                  <span className="text-sm text-red-600">
                    {Object.keys(errors).length} error(s) to fix
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleGenerateTerms}
                disabled={!isFormValid}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Terms</span>
              </Button>
            </div>
          </div>
        )}

        {/* Terms of Service Tab */}
        {currentTab === 'terms' && (
          <div className="space-y-4">
            {!generatedTerms && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Complete the website details first, then generate your Terms of Service
                </p>
                <Button onClick={() => setCurrentTab('details')} variant="outline">
                  Back to Details
                </Button>
              </div>
            )}

            {generatedTerms && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">Terms of Service</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = !useCustomTerms
                      setUseCustomTerms(next)
                      if (next) setCustomTerms(generatedTerms)
                    }}
                  >
                    {useCustomTerms ? 'Use Template' : 'Custom Terms'}
                  </Button>
                </div>

                {/* Terms Content */}
                {useCustomTerms ? (
                  <textarea
                    id="customTerms"
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter your custom terms of service..."
                    value={customTerms}
                    onChange={(e) => handleCustomTermsChange(e.target.value)}
                  />
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedTerms}</pre>
                  </div>
                )}

                {/* Validation Feedback */}
                {termsValidation && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {termsValidation.isValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          termsValidation.isValid ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {termsValidation.isValid ? 'Terms are valid' : 'Terms need attention'}
                      </span>
                    </div>
                    {termsValidation.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-600">Errors:</p>
                        {termsValidation.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">• {error}</p>
                        ))}
                      </div>
                    )}
                    {termsValidation.warnings.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-yellow-600">Suggestions:</p>
                        {termsValidation.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-yellow-600">• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Terms Acceptance */}
                <div className="border-t pt-4">
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Checkbox
                      checked={termsAccepted}
                      onCheckedChange={handleTermsAcceptance}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <Label className="text-sm font-medium text-blue-900">
                          Accept Terms of Service
                        </Label>
                      </div>
                      <p className="text-sm text-blue-800 mt-1">
                        I confirm that these terms of service accurately represent the usage rights and restrictions for crawling my website, and I agree to make them publicly available on the blockchain.
                      </p>
                      {errors.termsAccepted && (
                        <p className="text-sm text-red-600 mt-2">
                          {errors.termsAccepted.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* IPFS Upload Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-medium">IPFS Storage</h5>
                      <p className="text-sm text-gray-600">
                        Upload terms to IPFS for blockchain storage
                      </p>
                    </div>
                    
                    {!ipfsResult && (
                      <Button
                        onClick={handleUploadTerms}
                        disabled={!canProceed || isUploading}
                        className="flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{isUploading ? 'Uploading...' : 'Upload to IPFS'}</span>
                      </Button>
                    )}
                  </div>

                  {ipfsResult && (
                    <div className={`p-3 rounded-lg ${
                      ipfsResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {ipfsResult.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-green-800">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Terms uploaded to IPFS</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>IPFS Hash:</strong> <code className="bg-white px-1 rounded">{ipfsResult.hash}</code></p>
                            <p><strong>URI:</strong> <code className="bg-white px-1 rounded">{ipfsResult.uri}</code></p>
                          </div>
                          {ipfsResult.hash && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://ipfs.io/ipfs/${ipfsResult.hash}`, '_blank')}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View on IPFS</span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{ipfsResult.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {ipfsResult?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                Site details and terms configured successfully! Your Terms of Service are now stored on IPFS and ready for smart contract deployment.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
