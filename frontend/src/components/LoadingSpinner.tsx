import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Analyzing your profile with AI...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-slate-200">{message}</p>
        <p className="text-sm text-slate-400">Processing your request...</p>
      </div>
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
