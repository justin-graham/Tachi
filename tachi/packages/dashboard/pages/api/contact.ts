import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  email: z.string().email('Please enter a valid email address').max(100),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate the request body
    const validatedData = contactSchema.parse(req.body);
    
    // Log the contact form submission (in a real app, you'd save to database or send email)
    console.log('Contact form submission:', {
      ...validatedData,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Add to CRM system
    // 4. Send auto-reply to user
    
    // For now, we'll just return success
    res.status(200).json({ 
      success: true, 
      message: 'Thank you for your message. We\'ll get back to you soon!' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }

    // Log error appropriately based on environment
    if (process.env.NODE_ENV !== 'production') {
      console.error('Contact form error:', error);
    }
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}

// Rate limiting would be implemented here in a real app
// You might use libraries like:
// - express-rate-limit
// - redis for distributed rate limiting
// - upstash/redis for serverless environments