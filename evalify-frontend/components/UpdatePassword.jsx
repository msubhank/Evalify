import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const UpdatePassword = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Password successfully updated! You have been logged in automatically.");
      onPasswordUpdated();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl relative z-10 text-center animate-fade-in">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center text-white text-3xl font-black mb-6 shadow-xl shadow-blue-600/20">
          EV
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup New Password</h2>
        <p className="text-slate-400 mb-8 text-sm">Please enter a new password for your account.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all text-left"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
