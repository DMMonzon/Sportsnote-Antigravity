import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbProps {
  paths: { label: string; url?: string }[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ paths }) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/50 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit mb-6 shadow-lg">
      <button 
        onClick={() => {
          // If first path is dashboard and we click back, we could go -1 or directly to dashboard
          if (paths[0]?.url === '/dashboard') {
             navigate('/dashboard');
          } else {
             navigate(-1);
          }
        }} 
        className="hover:text-[#b4b4b4] transition-colors mr-2 flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10 text-white"
        title="Volver"
      >
        <i className="fa-solid fa-arrow-left"></i>
      </button>
      {paths.map((path, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-white/20 mx-1">/</span>}
          {path.url ? (
            <button 
              onClick={() => navigate(path.url!)}
              className="hover:text-[#b4b4b4] transition-colors"
            >
              {path.label}
            </button>
          ) : (
            <span className="text-white drop-shadow-md">{path.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
