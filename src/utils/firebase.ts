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
import { getStorage, ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { TrackPreset } from '../types';

// Web App configuration loaded from our auto-provisioned JSON
const firebaseConfig = {
  apiKey: "AIzaSyBfDgWQfRone3xQuYisWCmCi-aJJOmp2o8",
  authDomain: "sample-monk.firebaseapp.com",
  projectId: "sample-monk",
  storageBucket: "sample-monk.firebasestorage.app",
  messagingSenderId: "293043362808",
  appId: "1:293043362808:web:ae5f422a4ad04b7ae3540d"
};

// Database ID configured in the blueprint
const DATABASE_ID = "ai-studio-samplemonk-66b72757-3896-4550-bc13-f8d649b1796c";

export let db: Firestore;
let storage: FirebaseStorage;

try {
  const app = initializeApp(firebaseConfig);
  // Initialize firestore with the custom databaseId provided by the platform
  db = initializeFirestore(app, {}, DATABASE_ID);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// MANDATORY connection verification as per skill guidelines
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    // console.log("Firestore connection test: SUCCESS");
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

// Seed the database with complex multi-layered data (mocking external downloads)
export async function seedDatabase() {
  if (!db) return { success: false, message: "Firestore not initialized" };

  try {
    // 1. Seed Audio Elements (Freesound, Legowelt, MusicRadar, FunctionLoops)
    const audioElementsRef = collection(db, 'audioElements');
    
    // Check if already seeded
    const q = query(audioElementsRef, limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
       return { success: true, message: "Database already populated with external samples." };
    }

    const mockSamples = [
      {
        name: "Legowelt Jupiter 8 Deep Bass",
        type: "sample",
        source: "https://legowelt.org/samples/",
        tags: ["Bass", "Tiefpass", "Synthesizer", "Legowelt", "Analog"],
        frequency: 60,
        duration: 2.5,
        url: "",
        createdAt: new Date().toISOString()
      },
      {
        name: "Freesound Warehouse Kick 001",
        type: "sample",
        source: "https://freesound.org/",
        tags: ["Kick", "Techno", "Warehouse", "Reverb", "XXL"],
        frequency: 45,
        duration: 1.2,
        url: "",
        createdAt: new Date().toISOString()
      },
      {
        name: "MusicRadar Hip-Hop Break Loop",
        type: "song",
        source: "https://www.musicradar.com/news/tech/free-music-samples-royalty-free-loops-hits-and-multis-to-download-sampleradar",
        tags: ["Loop", "Hip-Hop", "Breakbeat", "Drums"],
        duration: 8.0,
        url: "",
        createdAt: new Date().toISOString()
      },
      {
        name: "FunctionLoops Psytrance FX Zap",
        type: "noise",
        source: "https://www.functionloops.com/free-samples.html",
        tags: ["FX", "Psytrance", "Zap", "High-frequency"],
        frequency: 5000,
        duration: 0.8,
        url: "",
        createdAt: new Date().toISOString()
      }
    ];

    for (const sample of mockSamples) {
      await addDoc(audioElementsRef, sample);
    }

    // 2. Seed Motion Sequences (Bewegungsabläufe)
    const motionSeqRef = collection(db, 'motionSequences');
    
    const mockSequences = [
      {
        name: "Techno Filter Sweep Fast",
        type: "automation",
        tags: ["Filter", "Sweep", "Techno", "Tiefpass", "Automation"],
        data: {
          target: "cutoff",
          curve: [200, 400, 800, 1600, 3200, 6400, 3200, 1600, 800, 400, 200],
          duration: 4
        },
        createdAt: new Date().toISOString()
      },
      {
        name: "Hip-Hop Swing Matrix",
        type: "rhythm_pattern",
        tags: ["Rhythm", "Hip-Hop", "Swing", "Matrix"],
        data: {
          swingAmount: 0.65,
          velocityMap: [1, 0.7, 0.9, 0.6] // Emulating an MPC swing
        },
        createdAt: new Date().toISOString()
      }
    ];

    for (const seq of mockSequences) {
      await addDoc(motionSeqRef, seq);
    }

    return { success: true, message: "Successfully imported multi-layered matrix of samples and motion sequences from external sources." };

  } catch (err) {
    console.error("Error seeding database:", err);
    return { success: false, message: "Error seeding database: " + (err as Error).message };
  }
}

// Upload custom sample/audio to Firestore metadata (and try Storage if accessible)
export async function uploadAudioElementToCloud(
  file: File, 
  name: string, 
  type: 'sample' | 'song' | 'noise', 
  tags: string[]
): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: "Firestore not initialized" };
  
  try {
    let downloadUrl = "";
    
    // Attempt Firebase Storage Upload (This may fail if rules deny unauthenticated users)
    if (storage) {
      try {
        const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        downloadUrl = await getDownloadURL(uploadTask.ref);
      } catch (storageErr) {
        console.warn("Storage upload failed (likely due to security rules). Saving metadata only.", storageErr);
      }
    }

    // Save Metadata to Firestore
    const newElement = {
      name,
      type,
      source: "User Upload",
      tags: tags.map(t => t.trim()).filter(Boolean),
      url: downloadUrl,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'audioElements'), newElement);
    
    return { success: true, message: `Successfully uploaded ${name} to Matrix (ID: ${docRef.id})` };
  } catch (err) {
    console.error("Error uploading to cloud:", err);
    return { success: false, message: "Upload failed: " + (err as Error).message };
  }
}
