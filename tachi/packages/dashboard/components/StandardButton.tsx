import React, { useEffect } from 'react';

interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const StandardButton: React.FC<StandardButtonProps> = ({ 
  variant = 'primary', 
  size = 'xs',
  children, 
  className = '',
  style = {},
  disabled = false,
  ...props 
}) => {
  // Add CSS for hover effects
  useEffect(() => {
    const styleId = 'standard-button-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        .standard-button {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          border-radius: 0px;
          transition: all 0.3s ease;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .standard-button:not(:disabled):hover {
          transform: translateY(-2px) !important;
          filter: brightness(0.9) !important;
        }
        .standard-button:disabled {
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }, []);
  // Color variants
  const getBackgroundColor = () => {
    if (disabled) return '#888';
    
    switch (variant) {
      case 'primary': return '#FF7043';
      case 'secondary': return '#52796F';
      case 'success': return '#10b981';
      case 'warning': return '#d97706';
      case 'danger': return '#dc2626';
      case 'info': return '#3b82f6';
      default: return '#FF7043';
    }
  };

  // Darker color variants for hover
  const getDarkerColor = () => {
    if (disabled) return '#aaa';
    
    switch (variant) {
      case 'primary': return '#e55a37';
      case 'secondary': return '#3d5a51';
      case 'success': return '#059669';
      case 'warning': return '#b45309';
      case 'danger': return '#b91c1c';
      case 'info': return '#2563eb';
      default: return '#e55a37';
    }
  };

  // Size variants
  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'px-2 py-1 text-xs';
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'md': return 'px-4 py-2 text-sm';
      case 'lg': return 'px-6 py-3 text-base';
      default: return 'px-2 py-1 text-xs';
    }
  };

  // Get appropriate text color based on background
  const getTextColor = () => {
    // If color is explicitly set in style prop, use it
    if (style?.color) {
      return style.color;
    }
    
    // If a background color is overridden via style prop, determine text color
    if (style?.backgroundColor) {
      const bg = style.backgroundColor;
      // Light backgrounds need dark text
      if (bg === '#FAF9F6' || bg === '#ccc' || bg === '#f9f9f9' || bg.includes('rgb(250')) {
        return '#333';
      }
      // Gray backgrounds (like #888) need dark text for contrast
      if (bg === '#888' || bg === '#999' || bg === '#aaa') {
        return '#333';
      }
    }
    
    if (disabled) return '#333'; // Darker text for better contrast on disabled buttons
    
    switch (variant) {
      case 'secondary': return 'white'; // #52796F background works with white text
      case 'primary': return 'white';   // #FF7043 background works with white text  
      case 'success': return 'white';
      case 'warning': return 'white';
      case 'danger': return 'white';
      case 'info': return 'white';
      default: return 'white';
    }
  };

  // Determine final text color (style prop takes precedence)
  const finalTextColor = style?.color || getTextColor();

  const baseStyle: React.CSSProperties = {
    backgroundColor: getBackgroundColor(),
    border: `3px solid ${getBackgroundColor()}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    color: finalTextColor,
    ...style
  };

  const baseClasses = `standard-button ${getSizeClasses()} ${className}`;

  return (
    <button
      className={baseClasses}
      style={baseStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default StandardButton;