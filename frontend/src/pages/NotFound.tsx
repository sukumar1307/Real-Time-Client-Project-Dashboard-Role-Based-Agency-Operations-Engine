import React from 'react';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">404 Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested dashboard URL route does not exist or has been relocated.
        </p>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
