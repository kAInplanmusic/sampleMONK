import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyA_PfT8h83F9s0REeiKU-uXX-jQqaR2Lzo",
  authDomain: "identitymonk.firebaseapp.com",
  projectId: "identitymonk",
  storageBucket: "identitymonk.firebasestorage.app",
  messagingSenderId: "959327717347",
  appId: "1:959327717347:web:b1fd8b5c642483329502d6"
};

const DATABASE_ID = "ai-studio-tonetechnostatio-66b72757-3896-4550-bc13-f8d649b1796c";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, DATABASE_ID);

async function seed() {
  const audioElementsRef = collection(db, 'audioElements');
  
  // Get all existing entries
  const existingDocs = await getDocs(query(audioElementsRef));
  const existingNames = new Set();
  existingDocs.forEach(doc => {
    existingNames.add(doc.data().name);
  });

  const samplesDir = path.join(process.cwd(), 'public', 'samples');
  if (!fs.existsSync(samplesDir)) {
    console.error("Samples directory does not exist!");
    process.exit(1);
  }

  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.wav'));
  
  let addedCount = 0;
  for (const file of files) {
    const baseName = file.replace('.wav', '');
    if (!existingNames.has(baseName)) {
      const docData = {
        name: baseName,
        type: "song",
        source: "Bandcamp / Uulee ZIP",
        tags: ["Low Entropy", "Ecstasy", "Uulee", "ZIP Import"],
        url: `/samples/${encodeURIComponent(file)}`,
        createdAt: new Date().toISOString()
      };
      await addDoc(audioElementsRef, docData);
      console.log(`Added: ${baseName}`);
      addedCount++;
    } else {
      console.log(`Skipped existing: ${baseName}`);
    }
  }
  
  console.log(`Done seeding ZIP files. Added ${addedCount} new files.`);
  process.exit(0);
}

seed();
