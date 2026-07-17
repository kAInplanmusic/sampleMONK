import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  doc, 
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { TrackPreset } from '../types';

// Web App configuration loaded from our auto-provisioned JSON
const firebaseConfig = {
  apiKey: "AIzaSyA_PfT8h83F9s0REeiKU-uXX-jQqaR2Lzo",
  authDomain: "identitymonk.firebaseapp.com",
  projectId: "identitymonk",
  storageBucket: "identitymonk.firebasestorage.app",
  messagingSenderId: "959327717347",
  appId: "1:959327717347:web:b1fd8b5c642483329502d6"
};

// Database ID configured in the blueprint
const DATABASE_ID = "ai-studio-tonetechnostatio-66b72757-3896-4550-bc13-f8d649b1796c";

let db: Firestore;

try {
  const app = initializeApp(firebaseConfig);
  // Initialize firestore with the custom databaseId provided by the platform
  db = initializeFirestore(app, {}, DATABASE_ID);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// MANDATORY connection verification as per skill guidelines
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Firestore connection check info (this is normal on fresh databases):", error);
    }
  }
}

// Test the connection immediately on module load
testConnection();

// Save a custom loop preset to Firestore
export async function savePresetToCloud(preset: Omit<TrackPreset, 'id'>): Promise<string> {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  try {
    const docRef = await addDoc(collection(db, 'presets'), {
      ...preset,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving preset to Firestore:", error);
    throw error;
  }
}

// Fetch loop presets from Firestore
export async function fetchPresetsFromCloud(): Promise<TrackPreset[]> {
  if (!db) {
    return [];
  }
  try {
    const q = query(collection(db, 'presets'), orderBy('createdAt', 'desc'), limit(12));
    const querySnapshot = await getDocs(q);
    const presets: TrackPreset[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      presets.push({
        id: doc.id,
        name: data.name || "Unnamed Cloud Preset",
        genre: data.genre || "Cloud Loop",
        bpm: data.bpm || 130,
        key: data.key || "C Minor",
        description: data.description || "A custom preset saved to sampleMONK cloud.",
        patterns: data.patterns || {
          kick: Array(16).fill(false),
          hat: Array(16).fill(false),
          clap: Array(16).fill(false),
          synth: Array(16).fill(false)
        },
        synthNotes: data.synthNotes || Array(16).fill(0),
        cutoff: data.cutoff ?? 800,
        resonance: data.resonance ?? 8,
        delayTime: data.delayTime ?? 0.25,
        decay: data.decay ?? 0.15
      });
    });
    return presets;
  } catch (error) {
    console.error("Error loading presets from Firestore:", error);
    return [];
  }
}
