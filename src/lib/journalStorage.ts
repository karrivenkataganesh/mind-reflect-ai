import { JournalInteraction, ChatTurn } from '../types';

const STORAGE_KEY = 'mindreflect_journal_interactions_v1';

/**
 * Initial sample reflection for first-time visitors
 */
const DEFAULT_WELCOME_INTERACTION: JournalInteraction = {
  id: 'entry_welcome_reflection',
  userId: 'local-user',
  title: 'Welcome to MindReflect: Your Private Sanctuary',
  mood: 'Reflective',
  turns: [
    {
      id: 'turn_welcome_user',
      sender: 'user',
      content: 'I want to start journaling regularly to clear my mind and gain fresh perspectives.',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'turn_welcome_gemini',
      sender: 'gemini',
      content: `Welcome to **MindReflect**. This is your private, distraction-free space for cognitive reflection and thoughtful inquiry.

### How Your Journal Works
- **100% Private & Local**: Your entries are stored exclusively in your browser's private local storage. No external accounts or cloud databases.
- **Multimodal AI Companion**: Powered by Gemini with a multi-model fallback ladder (*Gemini 3.6 Flash*, *3.1 Flash-Lite*, and *3.7 Flash*) for thoughtful reflections and inquiry.
- **Reflection Modes**: Toggle between **Reflect** (empathetic insights), **Brainstorm** (structured ideas), and **Deep Questions** (Socratic inquiry).
- **Executive Summaries**: Click **Generate Summary** at any time to synthesize key takeaways and actionable mindfulness steps.

Feel free to continue this reflection, or click **+ New Reflection** in the sidebar to start a new entry!`,
      timestamp: Date.now() - 3500000,
      modelUsed: 'gemini-3.6-flash',
    },
  ],
  summary: {
    summary: 'An introductory reflection on establishing a mindful, distraction-free journaling habit with Gemini.',
    keyTakeaways: [
      'Reflections are stored safely in local browser storage without external accounts.',
      'Gemini provides cognitive framing, brainstorming, and executive summaries.',
    ],
    tags: ['welcome', 'mindfulness', 'reflection'],
    suggestedAction: 'Create your first personal reflection topic using the prompt starters below.',
  },
  tags: ['welcome', 'mindfulness', 'reflection'],
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 3500000,
  pinned: true,
};

/**
 * Loads all journal interactions from local storage.
 */
export function loadJournalInteractions(): JournalInteraction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial welcome interaction
      saveAllJournalInteractions([DEFAULT_WELCOME_INTERACTION]);
      return [DEFAULT_WELCOME_INTERACTION];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAllJournalInteractions([DEFAULT_WELCOME_INTERACTION]);
      return [DEFAULT_WELCOME_INTERACTION];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load journal interactions from local storage:', err);
    return [DEFAULT_WELCOME_INTERACTION];
  }
}

/**
 * Saves all journal interactions array to local storage.
 */
export function saveAllJournalInteractions(interactions: JournalInteraction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions));
  } catch (err) {
    console.error('Failed to write interactions to local storage:', err);
    throw new Error('Local storage quota exceeded or storage disabled.');
  }
}

/**
 * Saves or updates a single journal interaction in local storage.
 */
export function saveJournalInteraction(interaction: JournalInteraction): JournalInteraction[] {
  const current = loadJournalInteractions();
  const index = current.findIndex((item) => item.id === interaction.id);

  const updatedItem: JournalInteraction = {
    ...interaction,
    updatedAt: Date.now(),
  };

  let next: JournalInteraction[];
  if (index >= 0) {
    next = [...current];
    next[index] = updatedItem;
  } else {
    next = [updatedItem, ...current];
  }

  saveAllJournalInteractions(next);
  return next;
}

/**
 * Deletes a journal interaction by ID.
 */
export function deleteJournalInteraction(id: string): JournalInteraction[] {
  const current = loadJournalInteractions();
  const filtered = current.filter((item) => item.id !== id);
  saveAllJournalInteractions(filtered);
  return filtered;
}

/**
 * Exports all journal reflections as a downloadable JSON file.
 */
export function exportJournalAsJSON(): void {
  const interactions = loadJournalInteractions();
  const exportPayload = {
    app: 'MindReflect',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    totalEntries: interactions.length,
    interactions,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `mindreflect_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Imports journal reflections from JSON string.
 */
export function importJournalFromJSON(jsonString: string): { success: boolean; count?: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const items: JournalInteraction[] = Array.isArray(data)
      ? data
      : Array.isArray(data.interactions)
      ? data.interactions
      : null;

    if (!items) {
      return { success: false, error: 'Invalid JSON format. Expected an array of interactions or a MindReflect backup.' };
    }

    const current = loadJournalInteractions();
    const currentMap = new Map(current.map((it) => [it.id, it]));

    for (const item of items) {
      if (item && item.id && item.title) {
        currentMap.set(item.id, item);
      }
    }

    const merged = Array.from(currentMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    saveAllJournalInteractions(merged);

    return { success: true, count: items.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse JSON file.' };
  }
}

/**
 * Clears all journal data and resets to initial welcome note.
 */
export function resetJournalInteractions(): JournalInteraction[] {
  localStorage.removeItem(STORAGE_KEY);
  return [DEFAULT_WELCOME_INTERACTION];
}
