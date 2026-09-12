import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">403 Access Forbidden</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your current user role lacks the strict permission privileges required to view or modify this resource.
        </p>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
