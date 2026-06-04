import React from 'react';
import { supabase } from '../services/supabase';

const EmailConfirmation = ({ onBack }) => {

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onBack();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />
      
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl relative z-10 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center text-white text-3xl font-black mb-6 shadow-xl shadow-blue-600/20">
          📧
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
        <p className="text-slate-400 mb-8">
          We've sent a confirmation link to your email address. Click the link to verify your account and continue.
        </p>

        <button
          onClick={handleSignOut}
          className="w-full font-bold py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] bg-slate-700 hover:bg-slate-600 shadow-slate-700/20 text-slate-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmation;