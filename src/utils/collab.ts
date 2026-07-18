import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// A simple local identity for demo purposes
const getLocalUserId = () => {
  let id = localStorage.getItem('samplemonk_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('samplemonk_user_id', id);
  }
  return id;
};

const getLocalUserName = () => {
  let name = localStorage.getItem('samplemonk_user_name');
  if (!name) {
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta'];
    name = 'Operator ' + names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random()*100);
    localStorage.setItem('samplemonk_user_name', name);
  }
  return name;
};

const getLocalUserColor = () => {
  let color = localStorage.getItem('samplemonk_user_color');
  if (!color) {
    const colors = ['#38bdf8', '#fbbf24', '#e879f9', '#34d399', '#f43f5e', '#a78bfa'];
    color = colors[Math.floor(Math.random() * colors.length)];
    localStorage.setItem('samplemonk_user_color', color);
  }
  return color;
};

export const localUser = {
  id: getLocalUserId(),
  name: getLocalUserName(),
  color: getLocalUserColor()
};

export interface CollabSession {
  locks: Record<string, string>;
  playback: {
    isPlaying: boolean;
    bpm: number;
  };
  sequencer: {
    patterns: any;
    synthNotes: number[];
  };
  mastering: {
    cutoff: number;
    resonance: number;
    delayTime: number;
    decay: number;
  };
  activeUsers: Record<string, { name: string; color: string; lastSeen: number }>;
}

const DEFAULT_SESSION: CollabSession = {
  locks: {},
  playback: { isPlaying: false, bpm: 130 },
  sequencer: {
    patterns: {
      kick: Array(16).fill(false),
      hat: Array(16).fill(false),
      clap: Array(16).fill(false),
      synth: Array(16).fill(false),
      snare: Array(16).fill(false),
      tom: Array(16).fill(false),
      perc: Array(16).fill(false),
      bass: Array(16).fill(false)
    },
    synthNotes: Array(16).fill(0)
  },
  mastering: {
    cutoff: 800,
    resonance: 8,
    delayTime: 0.25,
    decay: 0.15
  },
  activeUsers: {}
};

export function useCollabSession(sessionId: string = 'main_studio') {
  const [session, setSession] = useState<CollabSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!db) return;
    
    const docRef = doc(db, 'sessions', sessionId);
    
    // Heartbeat & initialization
    const initSession = async () => {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
           ...DEFAULT_SESSION,
           activeUsers: {
             [localUser.id]: {
               name: localUser.name,
               color: localUser.color,
               lastSeen: Date.now()
             }
           },
           updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, {
          [`activeUsers.${localUser.id}`]: {
            name: localUser.name,
            color: localUser.color,
            lastSeen: Date.now()
          },
          updatedAt: serverTimestamp()
        });
      }
    };
    
    initSession();

    // Heartbeat every 10s
    const heartbeat = setInterval(() => {
      updateDoc(docRef, {
        [`activeUsers.${localUser.id}.lastSeen`]: Date.now(),
        updatedAt: serverTimestamp()
      }).catch(console.error);
    }, 10000);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CollabSession;
        // Clean up stale users (inactive for 30s)
        const now = Date.now();
        let cleanedUsers = { ...data.activeUsers };
        let userChanged = false;
        
        for (const [uid, user] of Object.entries(cleanedUsers)) {
          if (now - user.lastSeen > 30000 && uid !== localUser.id) {
            delete cleanedUsers[uid];
            userChanged = true;
          }
        }
        
        if (userChanged) {
          data.activeUsers = cleanedUsers;
          // also drop locks for offline users
          const newLocks = { ...data.locks };
          for (const [mod, uid] of Object.entries(newLocks)) {
             if (!cleanedUsers[uid]) {
                delete newLocks[mod];
             }
          }
          data.locks = newLocks;
          updateDoc(docRef, { activeUsers: cleanedUsers, locks: newLocks });
        }

        setSession(data);
        setIsConnected(true);
      }
    });

    return () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
  }, [sessionId]);

  // Methods to update session
  const acquireLock = useCallback((moduleId: string) => {
    if (!db || !session) return false;
    // Check if someone else has it
    if (session.locks[moduleId] && session.locks[moduleId] !== localUser.id) {
      return false; // locked by someone else
    }
    updateDoc(doc(db, 'sessions', sessionId), {
      [`locks.${moduleId}`]: localUser.id
    });
    return true;
  }, [session, sessionId]);

  const releaseLock = useCallback((moduleId: string) => {
    if (!db || !session) return;
    if (session.locks[moduleId] === localUser.id) {
       updateDoc(doc(db, 'sessions', sessionId), {
         [`locks.${moduleId}`]: null
       });
    }
  }, [session, sessionId]);

  const updatePlayback = useCallback((updates: Partial<CollabSession['playback']>) => {
    if (!db) return;
    updateDoc(doc(db, 'sessions', sessionId), {
      playback: { ...session?.playback, ...updates },
      updatedAt: serverTimestamp()
    });
  }, [session, sessionId]);

  const updateSequencer = useCallback((updates: Partial<CollabSession['sequencer']>) => {
    if (!db) return;
    updateDoc(doc(db, 'sessions', sessionId), {
      sequencer: { ...session?.sequencer, ...updates },
      updatedAt: serverTimestamp()
    });
  }, [session, sessionId]);

  const updateMastering = useCallback((updates: Partial<CollabSession['mastering']>) => {
    if (!db) return;
    updateDoc(doc(db, 'sessions', sessionId), {
      mastering: { ...session?.mastering, ...updates },
      updatedAt: serverTimestamp()
    });
  }, [session, sessionId]);

  return {
    session,
    isConnected,
    localUser,
    acquireLock,
    releaseLock,
    updatePlayback,
    updateSequencer,
    updateMastering,
    // Helper to check if locked by someone else
    isLocked: (moduleId: string) => session?.locks[moduleId] && session.locks[moduleId] !== localUser.id,
    getLockOwner: (moduleId: string) => session?.locks[moduleId] ? session.activeUsers[session.locks[moduleId]] : null
  };
}
