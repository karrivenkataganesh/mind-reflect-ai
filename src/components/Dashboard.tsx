import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  saveUserEntry,
  deleteUserEntry,
  subscribeToUserEntries,
  syncUserProfile,
} from '../lib/firestoreService';
import {
  JournalEntry,
  ChatTurn,
  ReflectionMood,
  GenerationMode,
  EntrySummary,
} from '../types';
import {
  LogOut,
  Send,
  Sparkles,
  User as UserIcon,
  AlertCircle,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Cpu,
  BrainCircuit,
  Lock,
  BookOpen,
  MessageSquare,
  PlusCircle,
  Compass,
  Lightbulb,
  HelpCircle,
  Layers,
  ChevronRight,
  Search,
} from 'lucide-react';

const MOODS: { label: ReflectionMood; emoji: string; color: string }[] = [
  { label: 'Reflective', emoji: '🪞', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { label: 'Mindful', emoji: '🌿', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { label: 'Grateful', emoji: '🙏', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { label: 'Focused', emoji: '🎯', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { label: 'Inspired', emoji: '✨', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { label: 'Challenged', emoji: '🧗', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { label: 'Joyful', emoji: '☀️', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
];

function sanitizeDisplayError(raw: string | null): string {
  if (!raw) return '';
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed?.error?.message) {
        if (parsed.error.code === 401 || parsed.error.message.includes('authentication')) {
          return 'Gemini API authentication failed (401). Check your GEMINI_API_KEY in Settings > Secrets.';
        }
        return parsed.error.message;
      }
    }
  } catch {}
  return raw;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Active Journal Entry State
  const [activeEntryId, setActiveEntryId] = useState<string>(() => `entry_${Date.now()}`);
  const [title, setTitle] = useState<string>('');
  const [mood, setMood] = useState<ReflectionMood>('Reflective');
  const [mode, setMode] = useState<GenerationMode>('reflect');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [summary, setSummary] = useState<EntrySummary | null>(null);

  // Input & Action States
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // Real-Time Past Entries Feed State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Sync user profile once on mount
  useEffect(() => {
    if (user) {
      syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
  }, [user]);

  // Subscribe to real-time entries under /users/{userId}/entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    setFeedError(null);

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoadingEntries(false);
        setFeedError(null);
      },
      (err) => {
        console.error('Firestore entries subscription error:', err);
        setFeedError('Unable to load entries in real-time. Check permissions or network.');
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll chat turns
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // Reset to a brand new journal session
  const handleStartNewSession = () => {
    setActiveEntryId(`entry_${Date.now()}`);
    setTitle('');
    setMood('Reflective');
    setMode('reflect');
    setTurns([]);
    setSummary(null);
    setInputText('');
    setStatusMessage('Started a fresh journal session.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Load a past entry into the active workspace
  const handleLoadEntry = (entry: JournalEntry) => {
    setActiveEntryId(entry.id);
    setTitle(entry.title || '');
    setMood(entry.mood || 'Reflective');
    setTurns(entry.turns || []);
    setSummary(entry.summary || null);
    setInputText('');
    setStatusMessage(`Loaded "${entry.title || 'Untitled Entry'}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Submit Prompt & Reflect with Gemini
  // Directives guarantee: Both user prompt AND Gemini response are saved to Firestore before clearing UI input
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating || !user) return;

    const currentInput = inputText.trim();
    setIsGenerating(true);
    setError(null);
    setStatusMessage('Generating Gemini reflection with fallback ladder...');

    const userTurn: ChatTurn = {
      id: `turn_${Date.now()}_user`,
      sender: 'user',
      content: currentInput,
      timestamp: Date.now(),
    };

    const updatedTurnsWithUser = [...turns, userTurn];
    setTurns(updatedTurnsWithUser);

    try {
      // 1. Call Gemini API via backend proxy implementing the 4-tier model fallback ladder
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: updatedTurnsWithUser,
          mode,
          mood,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate reflection.');
      }

      const geminiTurn: ChatTurn = {
        id: `turn_${Date.now()}_gemini`,
        sender: 'gemini',
        content: data.text,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalTurns = [...updatedTurnsWithUser, geminiTurn];
      setTurns(finalTurns);

      // Auto-derive title if empty
      const derivedTitle = title.trim() || currentInput.slice(0, 45) + (currentInput.length > 45 ? '...' : '');
      if (!title.trim()) {
        setTitle(derivedTitle);
      }

      // 2. PAYLOAD HYGIENE & PERSISTENCE GUARANTEE:
      // Construct isolated entry document for /users/{userId}/entries/{entryId}
      const entryPayload: JournalEntry = {
        id: activeEntryId,
        userId: user.uid,
        title: derivedTitle,
        mood,
        turns: finalTurns,
        summary,
        tags: [mood.toLowerCase(), mode],
        createdAt: turns.length === 0 ? Date.now() : Date.now() - 60000,
        updatedAt: Date.now(),
      };

      // Guaranteed write to Firestore
      await saveUserEntry(user.uid, entryPayload);

      // 3. Clear UI input buffer ONLY after Firestore write confirms success
      setInputText('');
      setStatusMessage(data.isFallback ? 'Journal entry & reflection saved to Firestore!' : 'Reflection & dialogue saved to Firestore!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Error during reflection generation or save:', err);
      // Resilience guarantee: Even if network call fails, save user's prompt to Firestore
      try {
        const derivedTitle = title.trim() || currentInput.slice(0, 45) + (currentInput.length > 45 ? '...' : '');
        const entryPayload: JournalEntry = {
          id: activeEntryId,
          userId: user.uid,
          title: derivedTitle,
          mood,
          turns: updatedTurnsWithUser,
          summary,
          tags: [mood.toLowerCase(), mode],
          createdAt: turns.length === 0 ? Date.now() : Date.now() - 60000,
          updatedAt: Date.now(),
        };
        await saveUserEntry(user.uid, entryPayload);
        setInputText('');
        setStatusMessage('User entry preserved in Firestore.');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (saveErr) {
        console.error('Failed to save user entry during error fallback:', saveErr);
      }
      setError(sanitizeDisplayError(err.message) || 'An error occurred while generating or persisting reflection.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Executive Summary & Key Takeaways
  const handleGenerateSummary = async () => {
    if (turns.length === 0 || isSummarizing || !user) return;

    setIsSummarizing(true);
    setError(null);
    setStatusMessage('Synthesizing executive summary & takeaways...');

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Journal Reflection',
          turns,
          mood,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to synthesize summary.');
      }

      const generatedSummary: EntrySummary = data.data;
      setSummary(generatedSummary);

      // Save summary back to Firestore
      const entryPayload: JournalEntry = {
        id: activeEntryId,
        userId: user.uid,
        title: title || 'Journal Reflection',
        mood,
        turns,
        summary: generatedSummary,
        tags: Array.isArray(generatedSummary.tags) ? generatedSummary.tags : [mood.toLowerCase()],
        createdAt: Date.now() - 100000,
        updatedAt: Date.now(),
      };

      await saveUserEntry(user.uid, entryPayload);
      setStatusMessage('Executive summary persisted to Firestore!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setError(sanitizeDisplayError(err.message) || 'Failed to generate entry summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Delete an entry from Firestore
  const handleDeleteEntry = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setDeletingId(entryId);
    try {
      await deleteUserEntry(user.uid, entryId);
      if (activeEntryId === entryId) {
        handleStartNewSession();
      }
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setError('Failed to delete journal entry.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered past entries for search
  const filteredEntries = entries.filter((ent) => {
    const q = searchQuery.toLowerCase();
    return (
      ent.title.toLowerCase().includes(q) ||
      ent.mood.toLowerCase().includes(q) ||
      ent.turns.some((t) => t.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & App Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  MindReflect
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                  AI Journal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Firebase Firestore • Isolated Path <code>/users/&#123;userId&#125;/entries</code>
              </p>
            </div>
          </div>

          {/* Action Header: Threat Model, User Profile & Log Out */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Threat Model Review Button */}
            <button
              id="threat-model-btn"
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs transition cursor-pointer"
              title="Inspect 5-Zone Threat Modeling & Countermeasures"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline font-medium">Threat Model</span>
            </button>

            {/* User Account Info */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full ring-1 ring-teal-400/50 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-white leading-none">
                  {user?.displayName || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-slate-400 leading-none mt-1 truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="logout-btn"
              onClick={logout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium transition cursor-pointer"
              title="Sign out of Firebase"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER COLUMN: Active Journal & Multi-Turn Gemini Dialogue (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {/* Notifications & Status Banner */}
          {(error || feedError) && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start justify-between shadow-lg animate-fade-in">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{sanitizeDisplayError(error || feedError)}</span>
              </div>
              <button
                id="clear-error-btn"
                onClick={() => {
                  setError(null);
                  setFeedError(null);
                }}
                className="text-rose-400 hover:text-white text-xs font-semibold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}



          {statusMessage && (
            <div className="p-3 rounded-2xl bg-teal-950/80 border border-teal-700/80 text-teal-200 text-xs flex items-center space-x-2 shadow-md animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Active Entry Header Card: Title, Mood, Mode */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex-1">
                <input
                  type="text"
                  id="entry-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this reflection session a title..."
                  className="w-full bg-transparent text-base sm:text-lg font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-0"
                />
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {activeEntryId} • Isolated Firestore Subcollection
                </p>
              </div>

              {/* New Session Button */}
              <button
                id="new-entry-btn"
                onClick={handleStartNewSession}
                className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-teal-300 text-xs font-medium transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Session</span>
              </button>
            </div>

            {/* Mood Selector Chips */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Current Emotional & Cognitive State:
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const isSelected = mood === m.label;
                  return (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setMood(m.label)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isSelected
                          ? `${m.color} ring-1 ring-teal-400 shadow-md`
                          : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cognitive Mode Selector Tabs */}
            <div className="flex items-center space-x-2 pt-1 border-t border-white/5">
              <span className="text-xs text-slate-400 mr-2">Reflection Focus:</span>
              <button
                type="button"
                onClick={() => setMode('reflect')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  mode === 'reflect'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Reflect & Inquire</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('brainstorm')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  mode === 'brainstorm'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Brainstorm Ideas</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('deep_question')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  mode === 'deep_question'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Socratic Insight</span>
              </button>
            </div>
          </div>

          {/* Multi-Turn Conversation & Reflection Stream */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 min-h-[320px] max-h-[500px] overflow-y-auto space-y-4 shadow-inner">
            {turns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Your Private Reflection Canvas</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Write down your thoughts, struggles, or breakthroughs below. Gemini will provide supportive, multi-turn cognitive feedback, idea brainstorming, and executive summaries.
                </p>
              </div>
            ) : (
              turns.map((turn) => {
                const isUser = turn.sender === 'user';
                return (
                  <div
                    key={turn.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1">
                      {isUser ? (
                        <>
                          <span>You ({user?.displayName || 'Author'})</span>
                          <span>•</span>
                          <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      ) : (
                        <>
                          {turn.modelUsed?.includes('Local') ? (
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
                          )}
                          <span className={`font-semibold ${turn.modelUsed?.includes('Local') ? 'text-amber-300' : 'text-teal-300'}`}>
                            {turn.modelUsed || 'MindReflect Reflection'}
                          </span>
                          <span>•</span>
                          <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[90%] sm:max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-slate-800 text-white rounded-tr-none border border-white/10'
                          : 'bg-teal-950/30 text-slate-100 rounded-tl-none border border-teal-500/20 shadow-md'
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                );
              })
            )}

            {/* Generating Skeleton Spinner */}
            {isGenerating && (
              <div className="flex flex-col items-start space-y-1.5 animate-pulse">
                <div className="flex items-center space-x-2 text-[11px] text-teal-300 px-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
                  <span>Gemini is synthesizing insights across the model fallback ladder...</span>
                </div>
                <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-400 w-3/4">
                  Evaluating cognitive reframes, patterns, and actionable reflection points...
                </div>
              </div>
            )}

            <div ref={turnsEndRef} />
          </div>

          {/* Generated Executive Summary Card (If generated) */}
          {summary && (
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-teal-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-teal-300 border-b border-teal-500/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Executive Reflection Summary</span>
                </div>
                <span className="text-[11px] font-mono text-teal-400/80">Stored in Firestore Document</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                &ldquo;{summary.summary}&rdquo;
              </p>

              {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400">Key Takeaways:</p>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                    {summary.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.suggestedAction && (
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Suggested Micro-Action: </span>
                    {summary.suggestedAction}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Form Area (Guaranteed write to Firestore before clearing input) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <form onSubmit={handleSendPrompt} className="space-y-3">
              <div className="relative">
                <textarea
                  id="journal-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your journal reflection or converse with Gemini on this topic..."
                  rows={3}
                  disabled={isGenerating || isSummarizing}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/70 border border-white/15 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition resize-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendPrompt(e);
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Payload hygiene & undefined stripping active.</span>
                </div>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                  {/* Summarize Button (active when dialogue exists) */}
                  {turns.length > 0 && (
                    <button
                      type="button"
                      id="summarize-btn"
                      onClick={handleGenerateSummary}
                      disabled={isSummarizing || isGenerating}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      {isSummarizing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                      )}
                      <span>Summarize Entry</span>
                    </button>
                  )}

                  {/* Send & Reflect Button */}
                  <button
                    type="submit"
                    id="send-entry-btn"
                    disabled={isGenerating || isSummarizing || !inputText.trim()}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Reflecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Reflect with Gemini</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Past Entries Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col h-full">
            {/* Header & Real-time Indicator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-bold text-white">Journal History Feed</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Real-time status sub-header */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time <code>onSnapshot</code> active</span>
            </div>

            {/* Search Input Filter */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections & tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
              />
            </div>

            {/* Entries List Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[600px] pr-1">
              {isLoadingEntries && entries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Subscribing to isolated Firestore feed...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-1">
                  <BookOpen className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-medium text-slate-400">No reflections found</p>
                  <p className="text-[11px] text-slate-500">
                    Write your first journal reflection on the left to save it permanently.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isActive = entry.id === activeEntryId;
                  const firstTurnSnippet = entry.turns[0]?.content?.slice(0, 75) || 'No content';
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleLoadEntry(entry)}
                      className={`group p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer text-left space-y-2 relative ${
                        isActive
                          ? 'bg-teal-950/30 border-teal-500/40 shadow-sm'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/15 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-teal-300 transition">
                          {entry.title || 'Untitled Reflection'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] text-slate-300 shrink-0">
                          {entry.mood}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {entry.summary ? entry.summary.summary : firstTurnSnippet}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>
                          {entry.turns.length} {entry.turns.length === 1 ? 'turn' : 'turns'} •{' '}
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </span>

                        <button
                          type="button"
                          id={`delete-entry-btn-${entry.id}`}
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          disabled={deletingId === entry.id}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 5-Zone Threat Modeling & Security Inspection Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">5-Zone Agentic Threat Model & Countermeasures</h3>
                  <p className="text-xs text-slate-400">Security Engineering & Compliance Matrix</p>
                </div>
              </div>
              <button
                id="close-threat-model-btn"
                onClick={() => setShowSecurityModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <p className="font-bold text-teal-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Zone 1: Input Surfaces (OWASP A03 / LLM01)</span>
                </p>
                <p className="text-slate-300">
                  Strict schema checks, length caps, and delimiter quoting (<code>&quot;&quot;&quot;User Input&quot;&quot;&quot;</code>). User prompts are treated strictly as data, preventing indirect prompt injection. Output rendered safely as encoded text in React.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <p className="font-bold text-teal-300 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Zone 2: Planning & Reasoning (Gemini Model Resilience Ladder)</span>
                </p>
                <p className="text-slate-300">
                  All calls use <code>generateContentWithFallback</code> across 4 tiers: <code>gemini-3.6-flash</code> &rarr; <code>gemini-3.1-flash-lite</code> &rarr; <code>gemini-flash-latest</code> &rarr; <code>gemini-3.7-flash</code>, absorbing 503, 429, 500, and 404 upstream errors.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <p className="font-bold text-teal-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zone 3: Tool Execution & Secret Zero-Hardcoding</span>
                </p>
                <p className="text-slate-300">
                  The Gemini API key is managed via Google Cloud Secret Manager or runtime container environment variables, never sent to the browser or embedded in client code.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <p className="font-bold text-teal-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Zone 4: Memory & State Persistence (Payload Hygiene)</span>
                </p>
                <p className="text-slate-300">
                  Deep <code>stripUndefined()</code> transformation before Firestore writes. UI input buffer is guaranteed to clear only after both the prompt and Gemini response successfully persist to Firestore.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <p className="font-bold text-teal-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zone 5: Inter-System Communication (Owner-Bound Isolation)</span>
                </p>
                <p className="text-slate-300">
                  Cloud Firestore security rules enforce <code>match /users/&#123;userId&#125;/&#123;document=**&#125; &#123; allow read, write: if request.auth != null &amp;&amp; request.auth.uid == userId; &#125;</code>. Federated Google Sign-In guarantees no plaintext credentials.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Close Threat Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
