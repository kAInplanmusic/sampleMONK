import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const storage = getStorage(app);

async function run() {
  try {
    await signInAnonymously(auth);
    const storageRef = ref(storage, 'test.txt');
    await uploadString(storageRef, 'hello world');
    console.log('Upload successful');
  } catch (e) {
    console.error('Upload failed:', e);
  }
}
run();
