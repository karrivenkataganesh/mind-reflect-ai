import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Trash2,
  Pin,
  Sparkles,
  Smile,
  Tag,
  Clock,
  Filter,
  PanelLeftClose,
  X,
} from 'lucide-react';
import { JournalInteraction, ReflectionMood } from '../types';

interface HistorySidebarProps {
  interactions: JournalInteraction[];
  activeId: string | null;
  onSelect: (interaction: JournalInteraction) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (interaction: JournalInteraction) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const MOOD_COLORS: Record<ReflectionMood, { bg: string; text: string; border: string }> = {
  Mindful: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Grateful: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Focused: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Challenged: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  Inspired: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Reflective: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  Anxious: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Joyful: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  interactions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onTogglePin,
  isOpen,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<ReflectionMood | 'All'>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSelectItem = (item: JournalInteraction) => {
    onSelect(item);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  const handleNewReflection = () => {
    onNew();
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  const filtered = interactions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.turns.some((t) => t.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMood = selectedMood === 'All' || item.mood === selectedMood;

    return matchesSearch && matchesMood;
  });

  // Sort pinned items to top, then by updatedAt desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="absolute inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
        />
      )}

      <aside
        id="reflection-history-sidebar-panel"
        className={`absolute md:relative inset-y-0 left-0 z-20 shrink-0 h-full flex flex-col bg-slate-950/95 md:bg-slate-950/40 backdrop-blur-2xl md:backdrop-blur-xl border-r border-white/15 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-80 sm:w-80 md:w-72 lg:w-80 xl:w-96 translate-x-0 opacity-100'
            : '-translate-x-full md:-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden md:p-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header Action: New Reflection & Close Toggle */}
        <div className="min-h-[4rem] px-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleNewReflection}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold text-sm shadow-lg shadow-teal-500/20 backdrop-blur-sm transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          <button
            onClick={onCloseMobile}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer shrink-0"
            title="Collapse History Panel"
          >
            <PanelLeftClose className="w-5 h-5 hidden md:block" />
            <X className="w-5 h-5 md:hidden" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 pb-2 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entries, keywords, thoughts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/50 backdrop-blur-md border border-white/10 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30 transition"
            />
          </div>

          {/* Mood quick filter pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <button
              onClick={() => setSelectedMood('All')}
              className={`px-2.5 py-1 rounded-xl transition whitespace-nowrap cursor-pointer backdrop-blur-md ${
                selectedMood === 'All'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10'
              }`}
            >
              All ({interactions.length})
            </button>
            {(['Reflective', 'Mindful', 'Grateful', 'Focused', 'Challenged', 'Inspired'] as ReflectionMood[]).map(
              (mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(selectedMood === mood ? 'All' : mood)}
                  className={`px-2 py-1 rounded-xl transition whitespace-nowrap cursor-pointer backdrop-blur-md ${
                    selectedMood === mood
                      ? `${MOOD_COLORS[mood].bg} ${MOOD_COLORS[mood].text} border ${MOOD_COLORS[mood].border} font-semibold shadow-sm`
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {mood}
                </button>
              )
            )}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 my-4">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">No reflections found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || selectedMood !== 'All'
                  ? 'Try clearing your search or mood filter.'
                  : 'Start your first private AI journal reflection!'}
              </p>
            </div>
          ) : (
            sorted.map((item) => {
              const isActive = item.id === activeId;
              const moodStyle = MOOD_COLORS[item.mood] || MOOD_COLORS.Reflective;
              const dateStr = new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = new Date(item.updatedAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`group relative p-3.5 rounded-2xl border transition duration-200 cursor-pointer backdrop-blur-md ${
                    isActive
                      ? 'bg-teal-500/10 border-teal-400/40 shadow-[0_0_18px_rgba(20,184,166,0.15)] ring-1 ring-teal-400/20'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 mb-1">
                        {item.pinned && (
                          <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        <h3
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-teal-300' : 'text-slate-200'
                          }`}
                        >
                          {item.title || 'Untitled Reflection'}
                        </h3>
                      </div>

                      {/* Snippet preview */}
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.summary?.summary ||
                          (item.turns.length > 0
                            ? item.turns[0].content
                            : 'Empty reflection')}
                      </p>

                      {/* Meta badges */}
                      <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium backdrop-blur-sm ${moodStyle.bg} ${moodStyle.text} ${moodStyle.border}`}
                        >
                          {item.mood}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {dateStr} • {timeStr}
                          </span>
                        </span>

                        <span className="text-[10px] text-slate-400 bg-white/[0.05] border border-white/5 px-1.5 py-0.5 rounded-md">
                          {item.turns.length} {item.turns.length === 1 ? 'turn' : 'turns'}
                        </span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-col items-end space-y-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(item);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded-lg transition cursor-pointer"
                        title={item.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Delete Inline Overlay */}
                  {confirmDeleteId === item.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-rose-500/40 p-3 flex flex-col justify-center items-center text-center z-10 shadow-2xl"
                    >
                      <p className="text-xs font-semibold text-rose-300">Delete this entry?</p>
                      <p className="text-[10px] text-slate-400 mb-2">This cannot be undone in Firestore.</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onDelete(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium cursor-pointer shadow-md"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 rounded-lg text-xs font-medium border border-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
