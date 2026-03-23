import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Analyzing your profile...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-white/5 border-t-violet-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-violet-400 animate-pulse" />
        </div>
        {/* Glow */}
        <div className="absolute inset-0 rounded-full animate-pulse-ring" style={{ boxShadow: '0 0 30px rgba(139,92,246,0.2)' }} />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-slate-200">{message}</p>
        <p className="text-sm text-slate-500">Processing your request...</p>
      </div>
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
