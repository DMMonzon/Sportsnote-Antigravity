
import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'tonal';
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '',
  disabled = false
}) => {
  // MD3 standard button heights and shapes
  const baseStyles = "px-6 py-2.5 h-10 rounded-full font-medium text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 tracking-wide md3-transition";
  
  const variants = {
    // MD3 Filled Button
    primary: "bg-primary text-onPrimary shadow-sm hover:shadow-md",
    // MD3 Tonal Button
    tonal: "bg-secondaryContainer text-onSecondaryContainer hover:bg-opacity-80",
    // MD3 Outlined Button
    outline: "border border-outline text-primary bg-transparent hover:bg-primary/5",
    // Unified Secondary (Using Tonal style for clarity)
    secondary: "bg-secondaryContainer text-onSecondaryContainer hover:bg-opacity-80",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-38 cursor-not-allowed grayscale' : ''}`}
    >
      {children}
    </button>
  );
};
