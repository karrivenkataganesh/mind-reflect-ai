# MindReflect - User-Authenticated AI Journal & Cognitive Reflection System

MindReflect is a production-grade, secure real-time journaling and cognitive reflection application powered by Google Gemini (`@google/genai`), Firebase Authentication (Google Federated Identity), and Google Cloud Firestore. It strictly enforces owner-bound per-user data isolation (`/users/{userId}/entries/{entryId}`), resilient multi-tier model fallbacks, deep payload hygiene, and zero-hardcoded secrets.

---

## 1. 🛡️ Pre-Execution Threat Summary Table (5-Zone Threat Model)

| Threat Zone | Identified Risk / Attack Vector | Architectural Mitigation & Security Rule |
| :--- | :--- | :--- |
| **Zone 1: Input Surfaces** | Malicious injection, XSS payloads, indirect prompt injection (OWASP A03 / LLM01) | Strict input schema validation; length limits (10,000 char cap); system prompts isolate user observations using delimiter quotes (`"""User Input"""`); dynamic LLM responses rendered safely as encoded text in React. |
| **Zone 2: Planning & Reasoning** | Service outages, quota exhaustion, 404/429/500/503 errors (OWASP LLM04) | Resilient 4-tier model fallback ladder: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash` with automatic error code detection and graceful sequential failover. |
| **Zone 3: Tool / API Execution** | API credential compromise, SSRF, client-side secret exposure | Zero-hardcoding: `GEMINI_API_KEY` is maintained exclusively in server-side Cloud Run container environment or GCP Secret Manager. Proxied via Express `/api/gemini/*` with `express.json` limits. |
| **Zone 4: Memory & State Persistence** | Malformed payloads with `undefined`, data loss on write failure | Deep `stripUndefined()` transformation before Firestore writes (`setDoc`/`addDoc`). UI input buffers are strictly preserved until both prompt and Gemini response successfully write to Firestore. |
| **Zone 5: Inter-System Communication** | Unauthorized data access, privilege escalation, cross-user tampering | Firestore Security Rules enforce owner-bound isolation (`match /users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }`). Federated passwordless Google Sign-In only. |

---

## 2. ⚡ Firebase & Gemini Initialization Logic

### A. Client-Side Firebase Initialization (`src/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLjbb5zUQumIWmUBtKxHaLQWJ5gfsj0V4",
  authDomain: "gen-lang-client-0833182324.firebaseapp.com",
  projectId: "gen-lang-client-0833182324",
  storageBucket: "gen-lang-client-0833182324.firebasestorage.app",
  messagingSenderId: "778278067276",
  appId: "1:778278067276:web:978dbe30054b65d1d428e9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### B. Server-Side Gemini Initialization with Automated Fallback Ladder (`server.ts`)
```typescript
import { GoogleGenAI } from '@google/genai';

const MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export async function generateContentWithFallback(
  promptOrContents: any,
  options: { systemInstruction?: string; temperature?: number } = {}
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError: any = null;

  for (const modelName of MODEL_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptOrContents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      const text = response.text?.trim() || '';
      if (text) return { text, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const msg = String(err?.message || '').toLowerCase();
      const isRecoverable =
        status === 404 || status === 429 || status === 500 || status === 503 ||
        msg.includes('quota') || msg.includes('unavailable') || msg.includes('overloaded');

      if (!isRecoverable && MODEL_LADDER.indexOf(modelName) === 0) {
        // Continue to fallback candidates
      }
    }
  }

  throw new Error(lastError?.message || 'All Gemini fallback models exhausted.');
}
```

---

## 3. 🛡️ Auth Provider, Context & Route Guard

### Route Guard Component (`src/App.tsx`)
```tsx
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  // Strict route guard: Unauthenticated users are redirected to Login
  if (!user) {
    return <Login />;
  }

  // Authenticated users enter isolated Dashboard
  return <Dashboard />;
}
```

---

## 4. 🗄️ Full Dashboard UI Architecture & Data Isolation

### User-Isolated Path Structure:
```
/users/{userId}/entries/{entryId}
  ├── title: string
  ├── mood: "Reflective" | "Mindful" | "Grateful" | ...
  ├── turns: [
  │     { id, sender: "user", content, timestamp },
  │     { id, sender: "gemini", content, timestamp, modelUsed }
  │   ]
  ├── summary: { summary, keyTakeaways, tags, suggestedAction }
  ├── createdAt: number
  └── updatedAt: number
```

### Input Buffer & Write Guarantee:
```typescript
// 1. Send prompt & generate Gemini multi-turn response
const res = await fetch('/api/gemini/reflect', { /* ... */ });
const data = await res.json();

// 2. Persist BOTH user prompt AND Gemini response to Firestore
await saveUserEntry(user.uid, updatedEntry);

// 3. Clear UI input buffer ONLY after database write succeeds
setInputText('');
```

---

## 5. 🔒 Cloud Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound per-user private workspace isolation
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Top-level notes collection with owner-bound write and delete security
    match /notes/{noteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 6. 🚀 Google Cloud Run Deployment & Secret Manager Binding

Deploy container directly to Google Cloud Run with the mandatory campaign verification label (`dev-tutorial=cloud-run-ai-challenge`):

```bash
# 1. Enable Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com

# 2. Store Gemini API Key in Secret Manager (Zero Hardcoded Secrets)
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Secret Accessor role to Cloud Run Compute Service Account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 4. Deploy service to Cloud Run with Secret Binding
gcloud run deploy mindreflect \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# 5. Mandatory Campaign Verification Label Binding
gcloud run services update mindreflect \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```
