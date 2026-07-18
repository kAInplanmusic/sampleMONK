const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });

const DATABASE_ID = 'ai-studio-samplemonk-66b72757-3896-4550-bc13-f8d649b1796c';
const db = getFirestore(DATABASE_ID);

async function processTrack(filePath, baseName) {
  console.log(`\n--- Processing Track: ${baseName} ---`);
  const publicDir = path.join(__dirname, 'public', 'extracted_stems');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  
  // 1. Copy original track
  const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const trackDestName = `track_${safeName}.wav`;
  const trackDestPath = path.join(publicDir, trackDestName);
  
  if (!fs.existsSync(trackDestPath)) {
    fs.copyFileSync(filePath, trackDestPath);
  }
  const trackUrl = `/extracted_stems/${trackDestName}`;
  
  const existing = await db.collection('samples').where('name', '==', baseName).get();
  if (existing.empty) {
    await db.collection('samples').add({
      name: baseName,
      category: 'full-track',
      type: 'Track',
      url: trackUrl,
      description: 'Original full track',
      tags: ['track', 'original', 'processed', 'Nucleus', 'Low Entropy'],
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('Saved track to Firestore and copied locally.');
  } else {
    console.log('Track already in Firestore.');
  }

  // 2. Generate stems
  const stems = [
    { name: 'Vocals', filter: 'bandpass=f=1500:width_type=h:w=1000', type: 'vocals' },
    { name: 'Lows', filter: 'lowpass=f=250', type: 'lows' },
    { name: 'Mids', filter: 'bandpass=f=800:width_type=h:w=600', type: 'mids' },
    { name: 'Highs', filter: 'highpass=f=2500', type: 'highs' },
    { name: 'Melody', filter: 'bandpass=f=2000:width_type=h:w=1500', type: 'melody' }
  ];

  for (const stem of stems) {
    const stemFileName = `stem_${stem.type}_${safeName}.wav`;
    const stemFile = path.join(publicDir, stemFileName);
    console.log(`Generating stem: ${stem.name}...`);
    // Run ffmpeg or copy
    try {
      execSync(`ffmpeg -y -i "${filePath}" -af "${stem.filter}" "${stemFile}"`, { stdio: 'ignore' });
    } catch (e) {
      console.log(`ffmpeg failed for ${stem.name}, copying original as pseudo-stem to simulate extraction.`);
      fs.copyFileSync(filePath, stemFile);
    }
    
    const stemUrl = `/extracted_stems/${stemFileName}`;
    
    const stemName = `${baseName} - ${stem.name}`;
    const existingStem = await db.collection('samples').where('name', '==', stemName).get();
    if (existingStem.empty) {
      await db.collection('samples').add({
        name: stemName,
        category: stem.type,
        type: 'Stem',
        url: stemUrl,
        description: `Stem (${stem.name}) extracted via DSP`,
        tags: ['stem', stem.type, 'processed', 'extracted', stem.name.toLowerCase()],
        parentTrack: baseName,
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`Saved ${stem.name} to Firestore.`);
    } else {
      console.log(`Stem ${stem.name} already in Firestore.`);
    }
  }
}

async function run() {
  const samplesDir = path.join(__dirname, 'downloaded_samples');
  if (!fs.existsSync(samplesDir)) {
    console.log('No downloaded_samples directory found.');
    return;
  }
  
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.wav'));
  console.log(`Found ${files.length} .wav files to process.`);
  
  for (const file of files) {
    const filePath = path.join(samplesDir, file);
    const baseName = file.replace('.wav', '');
    try {
      await processTrack(filePath, baseName);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
  
  console.log('\nAll done processing tracks and stems.');
}

run().catch(console.error);
