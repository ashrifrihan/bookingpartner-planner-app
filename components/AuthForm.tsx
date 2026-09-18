'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthForm({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage('');

    if (authMode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed in. Loading your planner…');
        onLoggedIn?.();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else if (!data.session) {
        setMessage('Account created. Check your email if confirmation is enabled, then sign in.');
      } else {
        setMessage('Account created. Loading your planner…');
        onLoggedIn?.();
      }
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand-center">
          <img
            src="/bookingpartner.png"
            alt="BookingPartner.lk"
            className="brand-mark"
            width={56}
            height={56}
          />
        </div>
        <p className="eyebrow">BOOKINGPARTNER.LK</p>
        <h1>Backend Planner</h1>
        <p className="muted">
          Your 12-week build plan, private to your account and synced in realtime.
        </p>

        <form onSubmit={handleAuth} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <div className="password-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          <button className="primary-button" disabled={loading}>
            {loading ? 'Please wait…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <button
          type="button"
          className="text-button"
          onClick={() => {
            setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
            setMessage('');
          }}
        >
          {authMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
