const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const DATABASE_ID = 'ai-studio-samplemonk-66b72757-3896-4550-bc13-f8d649b1796c';
const db = getFirestore(DATABASE_ID);
const bucket = getStorage().bucket('sample-monk-samples');

async function run() {
  const samplesDir = path.join(__dirname, 'public', 'samples');
  if (!fs.existsSync(samplesDir)) {
    console.log('No samples directory found.');
    return;
  }
  
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.wav'));
  console.log(`Found ${files.length} .wav files to upload.`);

  for (const file of files) {
    const filePath = path.join(samplesDir, file);
    const destination = `samples/${file}`;
    const baseName = file.replace('.wav', '');

    try {
      console.log(`Uploading ${file}...`);
      await bucket.upload(filePath, {
        destination,
        metadata: {
          contentType: 'audio/wav',
        }
      });
      console.log(`Successfully uploaded ${file} to Storage.`);

      // Since we created a custom bucket, the public URL pattern is usually this:
      // But we need to make it public.
      await bucket.file(destination).makePublic();

      const url = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination)}`;

      await db.collection('samples').add({
        name: baseName,
        category: 'mids',
        type: 'Firebase Sample',
        url: url,
        description: 'Uploaded from local',
        parameters: { frequency: 1000, decay: 0.3 },
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`Added ${baseName} to Firestore.`);

      // Delete the file
      fs.unlinkSync(filePath);
      console.log(`Deleted local file ${filePath}`);

    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }

  console.log('All done.');
}

run().catch(console.error);
