import os
import firebase_admin
from firebase_admin import credentials, firestore
import librosa
import time
import json

# Firebase init
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {'projectId': 'sample-monk'})
db = firestore.client()

def tag_audio(file_path):
    # Analyze audio
    y, sr = librosa.load(file_path)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    
    # Simple tagging logic
    tags = ["audio", "sample"]
    if tempo > 120: tags.append("fast")
    else: tags.append("slow")
    
    return {
        "bpm": float(tempo),
        "tags": tags,
        "indexed_at": firestore.SERVER_TIMESTAMP
    }

def process_task(doc_ref, task_data):
    file_path = task_data.get("file_path")
    if not file_path:
        doc_ref.update({"status": "error", "error": "No file path provided"})
        return

    print(f"Processing: {file_path}")
    try:
        # Simulate processing time
        metadata = tag_audio(file_path)
        
        # Update task with result
        doc_ref.update({
            "status": "completed",
            "metadata": metadata
        })
        print(f"Completed: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        doc_ref.update({"status": "error", "error": str(e)})

def listen_for_tasks():
    print("Library AI Service listening for tasks...")
    # Watch the 'tasks' collection for new pending jobs
    tasks_ref = db.collection('tasks').where('status', '==', 'pending')
    
    while True:
        docs = tasks_ref.stream()
        for doc in docs:
            process_task(doc.reference, doc.to_dict())
        
        # Sleep before checking again to avoid excessive CPU usage
        time.sleep(5)

if __name__ == "__main__":
    listen_for_tasks()
