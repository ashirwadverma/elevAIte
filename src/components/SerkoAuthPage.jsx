import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Sparkles
} from 'lucide-react';

export default function SerkoAuthPage({ initialType = 'login' }) {
  const navigate = useNavigate();
  const [type, setType] = useState(initialType); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (type === 'signup') {
      if (!cleanEmail || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        // 1. Try Supabase remote sign-up
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { full_name: cleanName } }
          }).catch((err) => {
            console.warn('[Supabase signup warn]:', err?.message);
          });
        } catch {}

        // 2. Save registered user record in local storage so credentials can be verified on login
        try {
          const storedUsers = JSON.parse(localStorage.getItem('elevAIte_registered_users') || '[]');
          const filtered = storedUsers.filter(u => u.email.toLowerCase() !== cleanEmail.toLowerCase());
          filtered.push({
            name: cleanName,
            email: cleanEmail,
            password: password,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('elevAIte_registered_users', JSON.stringify(filtered));
        } catch {}

        // 3. DO NOT allow direct entry into dashboard!
        // Instead: switch to 'login' tab, clear password fields, and ask user to log in
        setPassword('');
        setConfirmPassword('');
        setType('login');
        setSuccess('Account created successfully! Please enter your password to log in.');
      } catch (err) {
        setError(err.message || 'Error creating account. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Login Flow ──
    if (type === 'login') {
      if (!cleanEmail || !password) {
        setError('Email and password are required.');
        return;
      }

      setLoading(true);
      try {
        let loggedIn = false;
        let loginError = '';

        // 1. Try Supabase cloud login
        try {
          const { data, error: supaErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          if (data?.session) {
            loggedIn = true;
          } else if (supaErr && !supaErr.message?.includes('fetch') && !supaErr.message?.includes('NetworkError')) {
            loginError = supaErr.message;
          }
        } catch (err) {
          if (!err?.message?.includes('fetch') && !err?.message?.includes('NetworkError')) {
            loginError = err?.message;
          }
        }

        // If cloud login succeeded, proceed to dashboard
        if (loggedIn) {
          setSuccess('Login successful! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 400);
          return;
        }

        // 2. Check registered accounts list (fallback when cloud Supabase is paused or offline)
        const storedUsers = JSON.parse(localStorage.getItem('elevAIte_registered_users') || '[]');
        const matched = storedUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
        const isDemo = cleanEmail.toLowerCase() === 'aashirwadverma88@gmail.com' || cleanEmail.toLowerCase() === 'demo.student@elevAIte.io';

        if (matched) {
          if (matched.password === password) {
            const localUser = {
              id: 'usr_' + Math.random().toString(36).substring(2, 10),
              email: cleanEmail,
              created_at: matched.created_at || new Date().toISOString(),
              user_metadata: { full_name: matched.name || cleanEmail.split('@')[0] }
            };
            const localSession = {
              access_token: 'local-token-' + Date.now(),
              user: localUser
            };
            localStorage.setItem('elevAIte_session', JSON.stringify(localSession));
            localStorage.setItem('elevAIte_user_profile', JSON.stringify(localUser));
            window.dispatchEvent(new Event('elevAIte_auth_change'));

            setSuccess('Login successful! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 400);
            return;
          } else {
            setError('Incorrect password. Please verify your credentials.');
            return;
          }
        } else if (isDemo) {
          const localUser = {
            id: 'usr_demo_user',
            email: cleanEmail,
            created_at: new Date().toISOString(),
            user_metadata: { full_name: 'Ashirwad Verma' }
          };
          const localSession = {
            access_token: 'local-token-' + Date.now(),
            user: localUser
          };
          localStorage.setItem('elevAIte_session', JSON.stringify(localSession));
          localStorage.setItem('elevAIte_user_profile', JSON.stringify(localUser));
          window.dispatchEvent(new Event('elevAIte_auth_change'));

          setSuccess('Login successful! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 400);
          return;
        }

        setError(loginError || 'Account not found with this email. Please check your email or create an account.');
      } catch (err) {
        setError(err.message || 'Login error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoFill = () => {
    setEmail('aashirwadverma88@gmail.com');
    setPassword('demoPass123!');
    if (type === 'signup') {
      setName('Ashirwad Verma');
      setConfirmPassword('demoPass123!');
    }
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#6ba4e8] via-[#8fc0f8] to-[#bedbfe] p-3 sm:p-6 md:p-10 font-['Inter',sans-serif] flex items-center justify-center">
      {/* Ambient background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-[450px] w-[450px] rounded-full bg-purple-300/30 blur-3xl" />
      </div>

      {/* Main Centered Floating Card */}
      <div className="relative w-full max-w-md sm:max-w-lg rounded-[32px] sm:rounded-[40px] bg-[#f4f8fd]/95 shadow-[0_30px_90px_rgba(20,50,130,0.22)] border border-white/80 backdrop-blur-2xl overflow-hidden">
        
        {/* Top Mini Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/50 bg-white/40 px-6 py-4 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-black transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to elevAIte</span>
          </Link>

          <Link to="/" className="font-['Poppins'] text-xl font-bold tracking-tight text-slate-900">
            elev<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">AI</span>te
          </Link>
        </div>

        {/* Clean Centered Auth Form */}
        <div className="p-6 sm:p-10">
          
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="inline-flex rounded-full bg-slate-200/70 p-1 mb-7 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setType('login');
                setError('');
                setSuccess('');
              }}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                type === 'login'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setType('signup');
                setError('');
                setSuccess('');
              }}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                type === 'signup'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Poppins'] tracking-tight">
            {type === 'login'
              ? 'Welcome back to your workspace'
              : 'Create your future-ready profile'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {type === 'login'
              ? 'Sign in with your email and password to access your dashboard.'
              : 'Join ambitious students and professionals using elevAIte AI.'}
          </p>

          {/* Quick Demo Fill Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100/70 transition shadow-xs"
            >
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Quick Demo Fill</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {type === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ashirwad Verma"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {type === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-sm font-semibold text-white shadow-md hover:bg-neutral-800 disabled:opacity-50 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>{type === 'login' ? 'Signing in…' : 'Creating profile…'}</span>
                </>
              ) : (
                <>
                  <span>{type === 'login' ? 'Log in' : 'Create profile'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            {type === 'login' ? (
              <>
                Don’t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setType('signup');
                    setError('');
                    setSuccess('');
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setType('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}
