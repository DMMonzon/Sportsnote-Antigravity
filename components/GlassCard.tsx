import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-[rgba(30,41,59,0.4)] backdrop-blur-[12px] border-[1px] border-white rounded-2xl ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
