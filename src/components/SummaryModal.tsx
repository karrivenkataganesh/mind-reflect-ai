import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, CheckCircle2, Tag, Compass, Copy, Check } from 'lucide-react';
import { EntrySummary } from '../types';

interface SummaryModalProps {
  summary: EntrySummary | null;
  entryTitle: string;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summary, entryTitle, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!summary) return null;

  const handleCopy = () => {
    const text = `Executive Summary for: ${entryTitle}\n\n${summary.summary}\n\nKey Takeaways:\n${summary.keyTakeaways.map((t) => `• ${t}`).join('\n')}\n\nSuggested Practice:\n${summary.suggestedAction || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] relative text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center backdrop-blur-md shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gemini Executive Synthesis</h2>
            <p className="text-xs text-slate-300 truncate max-w-xs">{entryTitle}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 mb-5 shadow-inner">
          <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2">
            Core Reflection Summary
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed">{summary.summary}</p>
        </div>

        {/* Key Takeaways */}
        {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Key Takeaways & Cognitive Insights</span>
            </h3>
            <ul className="space-y-2">
              {summary.keyTakeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-slate-200 p-3 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-start space-x-2.5 shadow-sm"
                >
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Micro-Action */}
        {summary.suggestedAction && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/50 to-slate-900/60 backdrop-blur-md border border-teal-500/30 mb-5 shadow-sm">
            <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Recommended Mindfulness Practice / Action</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200">{summary.suggestedAction}</p>
          </div>
        )}

        {/* Tags */}
        {summary.tags && summary.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-6">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {summary.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-teal-300 border border-white/10 font-medium backdrop-blur-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-medium border border-white/10 flex items-center space-x-2 transition cursor-pointer backdrop-blur-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg shadow-teal-500/20"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
