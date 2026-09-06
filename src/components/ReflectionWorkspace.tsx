import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Pin,
  Trash2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Compass,
  SlidersHorizontal,
  X,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import {
  JournalInteraction,
  ChatTurn,
  ReflectionMood,
  GenerationMode,
  EntrySummary,
} from '../types';

interface ReflectionWorkspaceProps {
  interaction: JournalInteraction | null;
  onSaveInteraction: (interaction: JournalInteraction) => Promise<void>;
  onDeleteInteraction: (id: string) => void;
  onOpenSummaryModal: (summary: EntrySummary) => void;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  syncError: string | null;
  onRetrySave: () => void;
}

const MOODS: { label: ReflectionMood; emoji: string; color: string; desc: string }[] = [
  { label: 'Reflective', emoji: '🪞', color: 'text-teal-400', desc: 'Self-inquiry & insights' },
  { label: 'Challenged', emoji: '⚡', color: 'text-rose-400', desc: 'Overcoming friction & stress' },
  { label: 'Mindful', emoji: '🌿', color: 'text-emerald-400', desc: 'Presence & grounding' },
  { label: 'Grateful', emoji: '🙏', color: 'text-amber-400', desc: 'Appreciation & blessing' },
  { label: 'Focused', emoji: '🎯', color: 'text-blue-400', desc: 'Priorities & execution' },
  { label: 'Inspired', emoji: '💡', color: 'text-purple-400', desc: 'Creativity & vision' },
  { label: 'Anxious', emoji: '🌊', color: 'text-orange-400', desc: 'De-escalation & calm' },
  { label: 'Joyful', emoji: '✨', color: 'text-yellow-400', desc: 'Celebration & energy' },
];

const MOOD_PROMPT_STARTERS: Record<ReflectionMood, string[]> = {
  Reflective: [
    'Today I noticed an interesting realization about my habits...',
    'Looking back at recent events, what patterns am I repeating?',
    'What belief of mine was questioned or shifted lately?',
    'What is an unspoken truth I need to acknowledge today?',
  ],
  Challenged: [
    'A challenge I faced today that tested my patience was...',
    'What obstacle is draining most of my mental energy right now?',
    'How can I reframe this current adversity into a learning milestone?',
    'What is within my direct control versus what must I let go of?',
  ],
  Mindful: [
    'Right now, my body and breath are telling me...',
    'What sensory details am I noticing in this present moment?',
    'What emotion is arising right now without judging or suppressing it?',
    'How can I bring calm and intentional presence to the rest of today?',
  ],
  Grateful: [
    'Three small, unexpected things I am genuinely grateful for today:',
    'Who is someone whose presence made my life kinder this week?',
    'What is a simple comfort or privilege I often take for granted?',
    'What recent accomplishment or personal growth moment am I proud of?',
  ],
  Focused: [
    'My singular highest-leverage priority for today is...',
    'What distraction or friction point do I need to eliminate right now?',
    'What would a successful, highly productive day look like in concrete terms?',
    'What 20% of effort will yield 80% of my desired progress?',
  ],
  Inspired: [
    'A creative spark or novel idea that excited me recently was...',
    'If fear of failure wasn’t a factor, what bold project would I start?',
    'What book, conversation, or insight recently opened my mind?',
    'How can I turn this inspiration into an actionable experiment today?',
  ],
  Anxious: [
    'The catastrophic "what-if" thought occupying my mind is...',
    'What is the realistic counter-evidence to this worry?',
    'What grounding step can help me regain composure right now?',
    'If a close friend felt this anxiety, what reassuring advice would I give them?',
  ],
  Joyful: [
    'A moment that brought a genuine smile to my face today was...',
    'How can I celebrate and anchor this positive feeling right now?',
    'What sparked laughter, warmth, or delight in my day?',
    'How can I share this uplifting energy with someone around me?',
  ],
};

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  interaction,
  onSaveInteraction,
  onDeleteInteraction,
  onOpenSummaryModal,
  onToggleSidebar,
  isSidebarOpen,
  syncError,
  onRetrySave,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('reflect');
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(interaction?.title || 'New Reflection');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showOptionBoard, setShowOptionBoard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Sync local title with prop
  useEffect(() => {
    if (interaction) {
      setLocalTitle(interaction.title);
    }
  }, [interaction?.id, interaction?.title]);

  // Auto scroll to bottom of transcript on new turn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  }, [interaction?.turns.length, isGenerating]);

  const handleMessagesScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  if (!interaction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-transparent backdrop-blur-md">
        <Sparkles className="w-12 h-12 text-teal-400 mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold text-white mb-2">No Reflection Selected</h2>
        <p className="text-sm max-w-md mb-6 text-slate-300">
          Choose an entry from your history sidebar or begin a fresh private reflection.
        </p>
        <button
          onClick={onToggleSidebar}
          className="md:hidden px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-xl font-semibold text-xs cursor-pointer shadow-lg shadow-teal-500/20"
        >
          Open History
        </button>
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (interaction && localTitle.trim() && localTitle !== interaction.title) {
      onSaveInteraction({
        ...interaction,
        title: localTitle.trim(),
      });
    }
  };

  const handleMoodSelect = (mood: ReflectionMood) => {
    if (interaction) {
      onSaveInteraction({
        ...interaction,
        mood,
      });
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    const userTurn: ChatTurn = {
      id: 'turn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      sender: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedTurns = [...interaction.turns, userTurn];

    // Optimistically update & persist user's prompt immediately
    const updatedInteraction: JournalInteraction = {
      ...interaction,
      // If title is default, suggest title from first message
      title:
        interaction.title === 'New Reflection' || interaction.title === 'Untitled Reflection'
          ? textToSend.slice(0, 45) + (textToSend.length > 45 ? '...' : '')
          : interaction.title,
      turns: updatedTurns,
      updatedAt: Date.now(),
    };

    setInputMessage('');
    setIsGenerating(true);

    try {
      // First save user's turn to Firestore (guaranteed transaction verification)
      await onSaveInteraction(updatedInteraction);

      // Request Gemini response via server API
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: updatedTurns,
          mode: generationMode,
          mood: interaction.mood,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();

      const geminiTurn: ChatTurn = {
        id: 'turn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        sender: 'gemini',
        content: data.text,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalInteraction: JournalInteraction = {
        ...updatedInteraction,
        turns: [...updatedTurns, geminiTurn],
        updatedAt: Date.now(),
      };

      // Persist final conversation to Firestore
      await onSaveInteraction(finalInteraction);
    } catch (err: any) {
      console.error('Error generating reflection:', err);
      // Append an error turn so user is notified
      const errorTurn: ChatTurn = {
        id: 'turn_err_' + Date.now(),
        sender: 'gemini',
        content: `*Error generating response:* ${err?.message || 'Could not connect to Gemini service. Please check your connection and try again.'}`,
        timestamp: Date.now(),
      };
      await onSaveInteraction({
        ...updatedInteraction,
        turns: [...updatedTurns, errorTurn],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (interaction.turns.length === 0 || isSummarizing) return;

    try {
      setIsSummarizing(true);
      setSummaryError(null);
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: interaction.title,
          turns: interaction.turns,
          mood: interaction.mood,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const resData = await res.json();
      const summaryData: EntrySummary = resData.data;

      // Update interaction with summary and tags
      const updated = {
        ...interaction,
        summary: summaryData,
        tags: summaryData.tags || interaction.tags,
        updatedAt: Date.now(),
      };

      await onSaveInteraction(updated);
      onOpenSummaryModal(summaryData);
    } catch (err: any) {
      console.error('Error summarizing:', err);
      setSummaryError(err?.message || 'Could not generate executive summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyTurn = (turnId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTurnId(turnId);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentMoodObj = MOODS.find((m) => m.label === interaction.mood) || MOODS[0];

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-transparent text-slate-100 overflow-hidden relative">
      {/* Top Action Bar / Header */}
      <div className="min-h-[4rem] px-4 sm:px-6 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          {/* Re-open Sidebar Button when collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition cursor-pointer border border-white/10 shrink-0"
              title="Open History Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-teal-400" />
            </button>
          )}

          {/* Editable Title */}
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).blur()}
            placeholder="Reflection Title..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-white focus:outline-none focus:bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-transparent focus:border-white/15 transition backdrop-blur-sm"
          />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Executive Summary Button */}
          <button
            onClick={interaction.summary ? () => onOpenSummaryModal(interaction.summary!) : handleGenerateSummary}
            disabled={interaction.turns.length === 0 || isSummarizing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold backdrop-blur-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Generate or view Gemini Executive Synthesis"
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="hidden sm:inline">
              {interaction.summary ? 'View Synthesis' : 'Generate Summary'}
            </span>
          </button>

          {/* Delete Entry */}
          <button
            onClick={() => onDeleteInteraction(interaction.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Delete this reflection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persistence Error Banner with Retry */}
      {syncError && (
        <div className="bg-rose-950/80 backdrop-blur-xl border-b border-rose-800/80 p-2.5 px-4 flex items-center justify-between text-xs text-rose-200 shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Storage Warning: {syncError}</span>
          </div>
          <button
            onClick={onRetrySave}
            className="px-3 py-1 bg-rose-700/80 hover:bg-rose-600 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-sm"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Summary Error Banner */}
      {summaryError && (
        <div className="bg-amber-950/80 backdrop-blur-xl border-b border-amber-800/80 p-2.5 px-4 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Summary Notice: {summaryError}</span>
          </div>
          <button
            onClick={() => setSummaryError(null)}
            className="px-3 py-1 bg-amber-800/80 hover:bg-amber-700 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Conversation / Journal Reflection Scroll Area */}
      <div
        id="reflection-messages-container"
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6 scroll-smooth relative"
      >
        {interaction.turns.length === 0 ? (
          <div className="max-w-xl mx-auto py-10 text-center bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Begin Your Journal Reflection</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Write whatever is on your mind. Gemini will provide thoughtful reflections, cognitive
              perspectives, and follow-up inquiry.
            </p>

            {/* Mood Selector Tabs / Pills */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Choose Reflection Mood
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOODS.map((m) => {
                  const isSelected = interaction.mood === m.label;
                  return (
                    <button
                      key={m.label}
                      onClick={() => handleMoodSelect(m.label)}
                      className={`p-2.5 rounded-2xl border transition text-left cursor-pointer flex items-center space-x-2 backdrop-blur-md ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-400/50 shadow-md ring-1 ring-teal-400/30'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300'
                      }`}
                    >
                      <span className="text-lg shrink-0">{m.emoji}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${m.color}`}>{m.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Starter Chips */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Inspiration Starters • <span className={currentMoodObj.color}>{interaction.mood}</span>
                </p>
                <span className="text-[10px] text-slate-400">Click to reflect instantly</span>
              </div>
              {(MOOD_PROMPT_STARTERS[interaction.mood] || MOOD_PROMPT_STARTERS.Reflective).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 hover:border-teal-400/40 text-xs text-slate-200 text-left transition flex items-center justify-between group cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <span className="pr-2 leading-relaxed">{prompt}</span>
                  <div className="flex items-center space-x-1 shrink-0 text-slate-400 group-hover:text-teal-400 transition">
                    <span className="text-[10px] hidden group-hover:inline font-medium">Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          interaction.turns.map((turn) => {
            const isUser = turn.sender === 'user';

            return (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 sm:gap-4 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Sender Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md backdrop-blur-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-teal-500 to-emerald-600 text-slate-950 font-bold'
                      : 'bg-white/[0.08] border border-white/15 text-teal-300'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative group rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-[85%] sm:max-w-[80%] backdrop-blur-2xl ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 border border-teal-400/40 text-teal-50 rounded-tr-none shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]'
                      : 'bg-white/[0.04] border border-white/10 text-slate-100 rounded-tl-none shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between space-x-3 mb-2">
                    <span className="text-[11px] font-semibold tracking-wide opacity-80">
                      {isUser ? 'You' : 'Gemini Companion'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {turn.modelUsed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-teal-300 font-mono border border-white/10 backdrop-blur-sm">
                          {turn.modelUsed}
                        </span>
                      )}
                      <button
                        onClick={() => handleCopyTurn(turn.id, turn.content)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition cursor-pointer text-xs"
                        title="Copy text"
                      >
                        {copiedTurnId === turn.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content body */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm text-slate-100">{turn.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-teal-300 prose-a:text-teal-400">
                      <ReactMarkdown>{turn.content}</ReactMarkdown>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-right opacity-60">
                    {new Date(turn.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Loading Spinner for Gemini response */}
        {isGenerating && (
          <div className="flex gap-3 sm:gap-4 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 text-teal-400 flex items-center justify-center shrink-0 backdrop-blur-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center space-x-3 shadow-lg">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Gemini is reflecting on your thoughts with cognitive depth...</span>
            </div>
          </div>
        )}

        {/* Floating Scroll to Latest Button */}
        {showScrollBottom && (
          <div className="sticky bottom-2 flex justify-end pr-2 pointer-events-none z-20">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-teal-300 hover:text-teal-200 border border-teal-500/30 shadow-xl backdrop-blur-md text-xs font-medium cursor-pointer transition active:scale-95"
              title="Scroll to latest response"
            >
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Scroll to latest</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with Clean Options Button */}
      <div id="reflection-composer-section" className="p-4 sm:p-6 pt-2 bg-slate-900/50 backdrop-blur-2xl border-t border-white/10 space-y-2 shrink-0">
        {/* Compact Options Toolbar above textarea */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            id="open-options-board-btn"
            onClick={() => setShowOptionBoard(true)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-teal-400/40 text-slate-200 hover:text-white transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 text-xs font-semibold"
            title="Open Reflection Options Board"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
            <span>Options</span>
          </button>

          <span className="text-[10px] text-slate-400 hidden md:inline shrink-0">
            Press Ctrl + Enter to Send
          </span>
        </div>

        {/* Textarea Input Composer */}
        <div className="relative rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/15 focus-within:border-teal-400/70 focus-within:ring-1 focus-within:ring-teal-400/30 transition shadow-inner">
          <textarea
            ref={textareaRef}
            rows={3}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your thoughts, emotions, dilemmas, or reflections..."
            className="w-full p-3.5 pr-14 text-sm bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
            disabled={isGenerating}
          />

          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isGenerating}
              className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-teal-500/25 cursor-pointer active:scale-95"
              title="Send Reflection"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Reflection Options Board Modal */}
      <AnimatePresence>
        {showOptionBoard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-slate-950/95 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Option Board Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-400 flex items-center justify-center shadow-inner">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Reflection Options Board
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Customize your AI reflection mode, mood mindset, and prompt starters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOptionBoard(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Close options board"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Option Board Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-slate-200">
                {/* Section 1: AI Reflection Mode */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      1. AI Reflection Mode
                    </span>
                    <span className="text-[11px] text-slate-400">Adaptive response persona</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={() => setGenerationMode('reflect')}
                      className={`p-3 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                        generationMode === 'reflect'
                          ? 'bg-teal-500/20 text-white font-semibold border-teal-400 ring-1 ring-teal-400/40 shadow-md'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300">
                          <Compass className="w-4 h-4" />
                        </div>
                        {generationMode === 'reflect' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-400 text-slate-950 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Reflective Guide</div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          Empathic listening & mirror inquiry
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setGenerationMode('brainstorm')}
                      className={`p-3 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                        generationMode === 'brainstorm'
                          ? 'bg-amber-500/20 text-white font-semibold border-amber-400 ring-1 ring-amber-400/40 shadow-md'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        {generationMode === 'brainstorm' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Brainstorm Ideas</div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          Actionable solutions & fresh angles
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setGenerationMode('deep_question')}
                      className={`p-3 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                        generationMode === 'deep_question'
                          ? 'bg-cyan-500/20 text-white font-semibold border-cyan-400 ring-1 ring-cyan-400/40 shadow-md'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        {generationMode === 'deep_question' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">Socratic Inquiry</div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          Root-cause & probing questions
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Reflection Mood */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      2. Reflection Mood
                    </span>
                    <span className="text-[11px] text-slate-400">8 tailored mindset themes</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MOODS.map((m) => {
                      const isSelected = interaction.mood === m.label;
                      return (
                        <button
                          key={m.label}
                          onClick={() => handleMoodSelect(m.label)}
                          className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center space-x-2.5 ${
                            isSelected
                              ? 'bg-teal-500/20 border-teal-400 text-white font-semibold ring-1 ring-teal-400/40 shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300'
                          }`}
                        >
                          <span className="text-xl shrink-0">{m.emoji}</span>
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold truncate ${m.color}`}>{m.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Inspiration Starters for Active Mood */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>3. Inspiration Starters • {interaction.mood}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Click to insert or send</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(MOOD_PROMPT_STARTERS[interaction.mood] || MOOD_PROMPT_STARTERS.Reflective).map((prompt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-teal-400/40 text-xs text-slate-200 transition flex items-center justify-between group gap-2 shadow-sm"
                      >
                        <button
                          onClick={() => {
                            setInputMessage(prompt);
                            setShowOptionBoard(false);
                            textareaRef.current?.focus();
                          }}
                          className="text-left flex-1 hover:text-teal-300 transition cursor-pointer line-clamp-2 leading-relaxed"
                          title="Insert into composer"
                        >
                          {prompt}
                        </button>
                        <button
                          onClick={() => {
                            handleSendMessage(prompt);
                            setShowOptionBoard(false);
                          }}
                          className="p-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 transition cursor-pointer shrink-0"
                          title="Send immediately to Gemini"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option Board Footer */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <span>Selected:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium">
                    {currentMoodObj.emoji} {interaction.mood}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-200 font-medium">
                    {generationMode === 'reflect'
                      ? 'Reflective Guide'
                      : generationMode === 'brainstorm'
                      ? 'Brainstorm'
                      : 'Socratic Inquiry'}
                  </span>
                </div>
                <button
                  onClick={() => setShowOptionBoard(false)}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-teal-500/20 active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
