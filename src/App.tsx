/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking initial authentication state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-xl shadow-teal-500/25 animate-pulse">
            <Sparkles className="w-7 h-7 text-slate-950" />
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-teal-400/40 border-t-transparent animate-spin pointer-events-none" />
        </div>
        <p className="text-sm font-semibold text-white tracking-wide">Authenticating with Firebase...</p>
        <p className="text-xs text-slate-400 mt-1">Verifying your Google session</p>
      </div>
    );
  }

  // Redirect / display Login if unauthenticated; otherwise Dashboard
  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
