import React, { useEffect, useRef } from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface InlineFieldProps {
  name: 'name' | 'message' | 'email';
  as: 'input' | 'textarea';
  placeholder: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  autoFocus?: boolean;
  onEnterPress?: () => void;
  onSubmit?: () => void;
}

export const InlineField: React.FC<InlineFieldProps> = ({
  name,
  as,
  placeholder,
  register,
  error,
  autoFocus,
  onEnterPress,
  onSubmit
}) => {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (as === 'textarea' && ref.current) {
      const textarea = ref.current as HTMLTextAreaElement;
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      
      textarea.addEventListener('input', adjustHeight);
      adjustHeight(); // Initial adjustment
      
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [as]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (as === 'textarea') {
        // In textarea: Shift+Enter = newline, Enter = move to next field
        if (!e.shiftKey) {
          e.preventDefault();
          onEnterPress?.();
        }
      } else {
        // In input: Enter = next field or submit
        e.preventDefault();
        if (name === 'email') {
          onSubmit?.();
        } else {
          onEnterPress?.();
        }
      }
    }
  };

  const baseStyles = `
    background: transparent
    border: none
    outline: none
    font-family: "Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    font-weight: 400
    line-height: 1.2
    color: #FF7043
    border-bottom: 3px solid #FF7043
    border-radius: 0
    transition: all 0.2s ease
    resize: none
    padding: 0
    margin: 0
    display: inline
    vertical-align: baseline
    min-width: 200px
  `;

  const focusStyles = `
    focus:border-bottom-color: #E5633A
    focus:border-bottom-width: 4px
  `;

  const errorStyles = error ? 'border-bottom-color: #dc2626' : '';

  const commonProps = {
    ...register(name),
    ref,
    autoFocus,
    onKeyDown: handleKeyDown,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    style: {
      fontSize: 'inherit',
      lineHeight: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      borderBottom: `3px solid ${error ? '#dc2626' : '#FF7043'}`,
      borderRadius: '0',
      transition: 'all 0.2s ease',
      resize: 'none' as const,
      padding: '0 0 4px 0',
      margin: '0',
      display: 'inline',
      verticalAlign: 'baseline',
      minWidth: as === 'textarea' ? '450px' : '300px',
      color: '#FF7043',
    }
  };

  return (
    <>
      {/* Visually hidden label for accessibility */}
      <label htmlFor={name} className="sr-only">
        {name === 'name' && 'Your name'}
        {name === 'message' && 'Your message'}
        {name === 'email' && 'Your email address'}
      </label>
      
      {as === 'input' ? (
        <input
          id={name}
          type={name === 'email' ? 'email' : 'text'}
          placeholder={placeholder}
          className={`inline-field ${errorStyles}`}
          {...commonProps}
          onFocus={(e) => {
            e.target.style.borderBottomWidth = '4px';
            e.target.style.borderBottomColor = '#E5633A';
          }}
          onBlur={(e) => {
            e.target.style.borderBottomWidth = '3px';
            e.target.style.borderBottomColor = error ? '#dc2626' : '#FF7043';
          }}
        />
      ) : (
        <textarea
          id={name}
          placeholder={placeholder}
          className={`inline-field ${errorStyles}`}
          rows={1}
          {...commonProps}
          style={{
            ...commonProps.style,
            overflow: 'hidden',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          onFocus={(e) => {
            e.target.style.borderBottomWidth = '4px';
            e.target.style.borderBottomColor = '#E5633A';
          }}
          onBlur={(e) => {
            e.target.style.borderBottomWidth = '3px';
            e.target.style.borderBottomColor = error ? '#dc2626' : '#FF7043';
          }}
        />
      )}
      
      {/* Error message */}
      {error && (
        <div id={`${name}-error`} className="text-red-600 text-sm mt-1 block">
          {error.message}
        </div>
      )}
    </>
  );
};