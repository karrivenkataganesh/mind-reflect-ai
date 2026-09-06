import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Award, Download, BookOpen, LogIn, LogOut, Cloud } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  syncStatus: 'synced' | 'saving' | 'error';
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSecurityModal: () => void;
  onOpenEvaluationModal: () => void;
  onExportData: () => void;
  isViewingLanding?: boolean;
  onToggleLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  syncStatus,
  onSignIn,
  onSignOut,
  onOpenSecurityModal,
  onOpenEvaluationModal,
  onExportData,
  isViewingLanding,
  onToggleLanding,
}) => {
  return (
    <header className="w-full shrink-0 z-30 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 text-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onToggleLanding}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25 text-slate-950 font-bold backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">MindReflect</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-md text-teal-300 border border-teal-500/30 font-medium shadow-sm">
                Gemini • Firebase
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {user ? 'Cloud Firestore Synchronized • Authenticated' : 'AI Journaling & Cognitive Reflection'}
            </p>
          </div>
        </div>

        {/* Right Section Actions & Sync Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Storage & Sync Status Indicator */}
          <div className="flex items-center text-xs font-medium px-2.5 py-1 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-sm">
            {syncStatus === 'synced' && (
              <span className="flex items-center text-emerald-400 space-x-1.5" title={user ? 'Synced with Cloud Firestore' : 'Saved locally'}>
                {user ? <Cloud className="w-3.5 h-3.5 text-teal-400" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{user ? 'Firestore Synced' : 'Saved'}</span>
              </span>
            )}
            {syncStatus === 'saving' && (
              <span className="flex items-center text-amber-400 space-x-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="flex items-center text-rose-400 space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sync Warning</span>
              </span>
            )}
          </div>

          {/* Backup / Export Data Trigger */}
          <button
            id="navbar-export-backup-btn"
            onClick={onExportData}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition cursor-pointer shadow-sm"
            title="Download JSON backup of reflections"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline font-medium">Backup</span>
          </button>

          {/* About / Toggle Workspace Button */}
          {onToggleLanding && (
            <button
              onClick={onToggleLanding}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl backdrop-blur-md border transition cursor-pointer shadow-sm ${
                isViewingLanding
                  ? 'bg-teal-500/20 text-teal-200 border-teal-500/40'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border-white/10'
              }`}
              title={isViewingLanding ? 'Return to Journal Workspace' : 'Read Overview & Philosophy'}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium">{isViewingLanding ? 'Journal' : 'Overview'}</span>
            </button>
          )}

          {/* Evaluation Metrics Matrix Trigger */}
          <button
            id="navbar-eval-metrics-btn"
            onClick={onOpenEvaluationModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-amber-500/15 to-teal-500/15 hover:from-amber-500/25 hover:to-teal-500/25 backdrop-blur-md text-amber-200 hover:text-white border border-amber-500/30 hover:border-amber-400/50 transition cursor-pointer shadow-sm"
            title="View 4-Pillar Evaluation Metrics & System Health"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-semibold hidden sm:inline">Evaluation</span>
          </button>

          {/* Security & Threat Model Inspector Trigger */}
          <button
            onClick={onOpenSecurityModal}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition cursor-pointer shadow-sm"
            title="View Privacy & Threat Model"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-medium">Security</span>
          </button>

          {/* Firebase Authentication Button / Profile Pill */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-white/10">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full ring-2 ring-teal-400/40 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-400/30">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-200 font-medium hidden md:inline max-w-[100px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                id="navbar-signout-btn"
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                title="Sign Out of Firebase"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={onSignIn}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition cursor-pointer shadow-md shadow-teal-500/20"
              title="Sign In with Google via Firebase Auth"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
