import fs from 'fs';
import path from 'path';
import axios from 'axios'; // Import axios
import dotenv from 'dotenv'; // Import dotenv to load environment variables

dotenv.config({ path: path.resolve(process.cwd(), '../.env.global') }); // Load .env.global

const QUEUE_FILE = path.join(process.cwd(), 'TASK_QUEUE.json');
const BACKEND_URL = process.env.BACKEND_CORE_URL || 'http://localhost:8000'; // Define backend URL

interface BackendTask {
  id: string;
  type: 'separate-stems' | 'generate-voice' | 'apply-fx' | 'render'; // Define possible task types
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

async function processTasks() {
  console.log('Worker: Checking for tasks...');

  if (!fs.existsSync(QUEUE_FILE)) return;

  const data: { tasks: BackendTask[] } = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));

  if (data.tasks.length === 0) return;

  const task = data.tasks.shift();
  if (!task) return; // Should not happen with shift() but good for type safety

  console.log(`Worker: Processing task: ${task.type} - ${task.id}`);
  task.status = 'processing'; // Update status immediately

  try {
    let response;
    switch (task.type) {
      case 'separate-stems':
        response = await axios.post(`${BACKEND_URL}/api/separate-stems`, task.payload);
        break;
      case 'generate-voice':
        response = await axios.post(`${BACKEND_URL}/api/generate-voice`, task.payload);
        break;
      case 'apply-fx':
        response = await axios.post(`${BACKEND_URL}/api/apply-fx`, task.payload);
        break;
      case 'render':
        response = await axios.post(`${BACKEND_URL}/api/render`, task.payload);
        // For render tasks, we might want to poll for status, but for now, just acknowledge it's started.
        console.log(`Worker: Render task ${task.id} started. Backend response:`, response.data);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    console.log(`Worker: Completed task: ${task.type} - ${task.id}`);
    task.status = 'completed';
    // Optionally, store response.data in task for detailed logging if needed
    // task.result = response.data;

  } catch (error) {
    console.error(`Worker: Failed task: ${task.type} - ${task.id}`, error);
    task.status = 'failed';
    // Optionally, store error details in task
    // task.error = error.message;
  }

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
}

// Poll every 10 seconds
setInterval(processTasks, 10000);
console.log('Worker: Started polling TASK_QUEUE.json');
