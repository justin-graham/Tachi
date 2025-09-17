import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InlineField } from './InlineField';

// Zod validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(), // Honeypot field
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactSentenceProps {
  onSubmitSuccess: () => void;
  onSubmitError: (error: string) => void;
}

export const ContactSentence: React.FC<ContactSentenceProps> = ({
  onSubmitSuccess,
  onSubmitError
}) => {
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setFocus
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      message: '',
      email: '',
      company: '', // Honeypot
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Check honeypot - if filled, silently drop
      if (data.company && data.company.trim() !== '') {
        // Silently fail for bots
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          message: data.message,
          email: data.email,
        }),
      });

      if (response.ok) {
        reset();
        onSubmitSuccess();
      } else {
        const errorData = await response.text();
        onSubmitError(errorData || 'Failed to send message');
      }
    } catch (error) {
      onSubmitError('Network error. Please try again.');
    }
  };

  const moveToMessage = () => {
    setFocus('message');
  };

  const moveToEmail = () => {
    setFocus('email');
  };

  const submitForm = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <div className="contact-sentence">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Honeypot field - hidden from users */}
        <input
          {...register('company')}
          type="text"
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
            tabIndex: -1
          }}
          autoComplete="off"
        />

        <div className="sentence-lines space-y-3">
          <p className="heading text-[clamp(32px,5.5vw,72px)] leading-tight font-normal text-[#FF7043]">
            Hello Tachi, my name is{' '}
            <InlineField
              name="name"
              as="input"
              placeholder="TYPE YOUR NAME"
              register={register}
              error={errors.name}
              autoFocus
              onEnterPress={moveToMessage}
            />
          </p>
          
          <p className="heading text-[clamp(32px,5.5vw,72px)] leading-tight font-normal text-[#FF7043]">
            I would like to{' '}
            <InlineField
              name="message"
              as="textarea"
              placeholder="TYPE YOUR MESSAGE"
              register={register}
              error={errors.message}
              onEnterPress={moveToEmail}
            />
          </p>
          
          <p className="heading text-[clamp(32px,5.5vw,72px)] leading-tight font-normal text-[#FF7043]">
            You can reach me by email at{' '}
            <InlineField
              name="email"
              as="input"
              placeholder="TYPE YOUR EMAIL ADDRESS"
              register={register}
              error={errors.email}
              onSubmit={submitForm}
            />
          </p>
        </div>

        {/* Helper text and submit button */}
        <div className="mt-12 space-y-6">
          <p className="text-sm text-[#FF7043] opacity-70">
            Press Enter to move between fields, or Shift+Enter for new lines in your message.
          </p>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-[clamp(18px,2.5vw,24px)] font-medium text-[#FF7043] border-b-2 border-[#FF7043] hover:border-[#E5633A] transition-colors duration-200 disabled:opacity-50"
            style={{
              background: 'none',
              padding: '0 0 4px 0',
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {isSubmitting ? 'Sending…' : 'Send message'}
          </button>
        </div>

        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-medium mb-2">Please fix the following:</p>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.name && <li>• {errors.name.message}</li>}
              {errors.message && <li>• {errors.message.message}</li>}
              {errors.email && <li>• {errors.email.message}</li>}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};