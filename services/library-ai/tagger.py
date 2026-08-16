#!/usr/bin/env python3
"""
Library-AI Tagger – GOOGLE/FIRESTORE-ENTKOPPELT.

Frueher wartete dieser Service auf Aufgaben in einer Firestore-`tasks`-Collection.
Jetzt arbeitet er rein LOKAL als Kommandozeilen-Tool:
    python tagger.py <audio_datei.wav> [--out ausgabe.json]

Analysiert eine Audiodatei (BPM, Tags) und schreibt das Ergebnis als JSON-Datei
lokal weg. Es besteht KEINERLEI Verbindung zu Firebase/Firestore/Google.
"""
import argparse
import hashlib
import json
import os
import time

import librosa

def get_file_hash(file_path: str) -> str:
    return hashlib.md5(file_path.encode()).hexdigest()

def tag_audio(file_path: str) -> dict:
    y, sr = librosa.load(file_path)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

    tags = ["audio", "sample"]
    if tempo and tempo > 120:
        tags.append("fast")
    else:
        tags.append("slow")

    return {
        "bpm": float(tempo),
        "tags": tags,
        "indexed_at": time.time(),
    }

def main() -> None:
    parser = argparse.ArgumentParser(description="Lokaler Audio-Tagger (Google-frei).")
    parser.add_argument("file_path", help="Pfad zur Audiodatei (.wav/.mp3 etc.)")
    parser.add_argument("--out", default="tagged.json", help="Ausgabedatei fuer das JSON (default: tagged.json)")
    args = parser.parse_args()

    if not os.path.exists(args.file_path):
        print(f"Fehler: Datei nicht gefunden: {args.file_path}")
        raise SystemExit(1)

    print(f"Analysiere {args.file_path} ...")
    metadata = tag_audio(args.file_path)
    result = {
        "hash": get_file_hash(args.file_path),
        "file_path": args.file_path,
        "metadata": metadata,
    }
    with open(args.out, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Fertig. Ergebnis in {args.out} geschrieben.")

if __name__ == "__main__":
    main()
