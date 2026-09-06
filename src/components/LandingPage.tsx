import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Brain,
  CheckCircle,
  ArrowRight,
  Cpu,
  Database,
  Award,
  Sparkles,
  LogIn,
} from 'lucide-react';

interface LandingPageProps {
  onStartJournaling: () => void;
  onSignIn: () => void;
  onOpenSecurityModal: () => void;
  onOpenEvaluationModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartJournaling,
  onSignIn,
  onOpenSecurityModal,
  onOpenEvaluationModal,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-transparent text-slate-100">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center text-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/15 text-teal-300 text-xs font-medium mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Firebase Auth & Cloud Firestore • Tenant-Isolated Reflection Vault</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight drop-shadow-md"
        >
          Deep Reflections with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300">
            Gemini
          </span>
          , Secured by Firebase.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
        >
          An AI-powered reflective journaling companion. Converse with Gemini across multi-turn reflections,
          brainstorm solutions, and preserve your thoughts in Cloud Firestore with strict per-user data isolation.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-teal-500/25 transition duration-200 flex items-center justify-center space-x-3 cursor-pointer active:scale-95"
          >
            <LogIn className="w-5 h-5 text-slate-950" />
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onStartJournaling}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md text-white font-semibold text-sm border border-white/15 transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Open Journal Workspace</span>
          </button>

          <button
            id="landing-eval-metrics-btn"
            onClick={onOpenEvaluationModal}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-teal-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-teal-500/25 backdrop-blur-md text-amber-200 hover:text-white font-semibold text-sm border border-amber-500/30 transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Evaluation</span>
          </button>

          <button
            onClick={onOpenSecurityModal}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md text-slate-200 font-semibold text-sm border border-white/15 transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Security Spec</span>
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Multi-Turn Cognitive Companion</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Engage with Gemini across reflective inquiry, tactical ideation, or Socratic questioning with intelligent context distillation.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Cloud Firestore Persistence</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Reflections synchronize to Google Cloud Firestore under <code className="text-teal-300 text-xs font-mono">/users/{'{uid}'}/interactions</code> with strict owner-bound security rules.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Resilient Model Ladder</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Protected by an automated 4-tier model fallback ladder: Gemini 3.6 Flash ➔ 3.1 Flash-Lite ➔ Flash-Latest ➔ 3.7 Flash.
            </p>
          </div>
        </motion.div>

        {/* Security & Threat Countermeasures Pill Banner */}
        <div className="mt-12 w-full p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>
              <strong className="text-white">Tenant-Isolated Firestore:</strong> Access rules enforce <code className="text-teal-300 font-mono">request.auth.uid == userId</code> preventing unauthorized access across users.
            </span>
          </div>
          <div className="flex items-center space-x-6 shrink-0">
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">Google OAuth 2.0</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-teal-400" />
              <span className="text-slate-200">Real-Time Sync</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400 backdrop-blur-md">
        <p>MindReflect • Powered by Gemini & Firebase Cloud Firestore</p>
      </footer>
    </div>
  );
};
