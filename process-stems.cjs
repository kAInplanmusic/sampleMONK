const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const DATABASE_ID = 'ai-studio-samplemonk-66b72757-3896-4550-bc13-f8d649b1796c';
const db = getFirestore(DATABASE_ID);
const bucket = getStorage().bucket();

async function processTrack(filePath, baseName) {
  console.log(`\n--- Processing Track: ${baseName} ---`);
  
  // 1. Upload original track
  const trackDest = `tracks/${baseName}.wav`;
  console.log(`Uploading original track to ${trackDest}...`);
  await bucket.upload(filePath, { destination: trackDest, metadata: { contentType: 'audio/wav' } });
  const trackUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(trackDest)}?alt=media`;
  
  await db.collection('samples').add({
    name: baseName,
    category: 'full-track',
    type: 'Track',
    url: trackUrl,
    description: 'Original full track',
    tags: ['track', 'original', baseName],
    createdAt: FieldValue.serverTimestamp()
  });
  console.log('Saved track to Firestore.');

  // 2. Generate and upload stems
  const stemsDir = path.join(__dirname, 'temp_stems');
  if (!fs.existsSync(stemsDir)) fs.mkdirSync(stemsDir);

  const stems = [
    { name: 'Lows', filter: 'lowpass=f=250', type: 'lows' },
    { name: 'Mids', filter: 'bandpass=f=1200:width_type=h:w=1000', type: 'mids' },
    { name: 'Highs', filter: 'highpass=f=2500', type: 'highs' }
  ];

  for (const stem of stems) {
    const stemFile = path.join(stemsDir, `${baseName}_${stem.name}.wav`);
    console.log(`Generating stem: ${stem.name}...`);
    // Run ffmpeg
    execSync(`ffmpeg -y -i "${filePath}" -af "${stem.filter}" "${stemFile}"`, { stdio: 'ignore' });
    
    const stemDest = `stems/${baseName}_${stem.name}.wav`;
    console.log(`Uploading stem to ${stemDest}...`);
    await bucket.upload(stemFile, { destination: stemDest, metadata: { contentType: 'audio/wav' } });
    const stemUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(stemDest)}?alt=media`;
    
    await db.collection('samples').add({
      name: `${baseName} - ${stem.name}`,
      category: stem.type,
      type: 'Stem',
      url: stemUrl,
      description: `Stem (${stem.name}) extracted from ${baseName}`,
      tags: ['stem', stem.type, baseName],
      parentTrack: baseName,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`Saved ${stem.name} to Firestore.`);
    
    // Cleanup stem file
    fs.unlinkSync(stemFile);
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
