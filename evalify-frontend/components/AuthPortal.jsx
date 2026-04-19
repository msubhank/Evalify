import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthPortal = ({ onLogin, onSignupSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    regNo: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          setError(error.message);
        } else {
          try {
            // Fetch user from Postgres
            const res = await axios.get(`${API_URL}/auth/${data.user.id}`);
            const fetchedUser = res.data;
            fetchedUser.joinedClasses = fetchedUser.joinedClasses || []; // Safeguard
            onLogin(fetchedUser);
          } catch (apiError) {
            console.error("Failed to fetch user from DB", apiError);
            setError('User profile not found in database.');
          }
        }
      } else {
        // Pre-flight check for duplicate Student Registration Number
        if (role === 'STUDENT' && formData.regNo) {
          try {
            const regCheck = await axios.get(`${API_URL}/auth/check-regno/${encodeURIComponent(formData.regNo)}`);
            if (regCheck.data.exists) {
              setError('This Registration Number is already associated with an account.');
              setLoading(false);
              return;
            }
          } catch (apiError) {
            console.error("Failed to check regNo uniqueness", apiError);
            setError('Could not verify Registration Number. Please try again.');
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: role,
              regNo: role === 'STUDENT' ? formData.regNo : null,
              joinedClasses: []
            }
          }
        });

        if (error) {
          setError(error.message);
        } else {
          try {
            // Sync user to PostgreSQL Database
            await axios.post(`${API_URL}/auth/sync`, {
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              role: role,
              regNo: role === 'STUDENT' ? formData.regNo : null
            });
            onSignupSuccess();
          } catch (apiError) {
            console.error("Failed to sync user to DB", apiError);
            console.error("Error Response Data:", apiError.response?.data);
            setError(`Registration succeeded, but failed to sync profile. ${apiError.response?.data?.error || apiError.message}`);
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: window.location.origin
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      alert("Password reset link sent to your email!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />

      <div className="absolute top-10 left-10">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-white flex items-center space-x-2 transition-colors font-medium"
        >
          <span>← Back to Home</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center text-white text-3xl font-black mb-6 shadow-xl shadow-blue-600/20">
            EV
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Evalify</h1>
          <p className="text-slate-400 font-medium">
            {isLogin ? 'Sign in to your workspace' : 'Create your learning profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div className="flex bg-slate-800/50 p-1.5 rounded-2xl mb-4 border border-white/5">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'STUDENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${role === 'TEACHER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Teacher
                </button>
              </div>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {role === 'STUDENT' && (
                <input
                  type="text"
                  placeholder="Registration Number (e.g. FA22-BSSE-001)"
                  className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
                  value={formData.regNo}
                  onChange={e => setFormData({ ...formData, regNo: e.target.value })}
                  required
                />
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {isLogin && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] mt-4 ${isLogin ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-slate-400 hover:text-blue-400 text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;