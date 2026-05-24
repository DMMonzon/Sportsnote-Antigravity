import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-[rgba(30,41,59,0.4)] backdrop-blur-[12px] border border-white/10 rounded-2xl ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
