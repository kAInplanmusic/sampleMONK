# DB1: Asset DB Schema (Firestore)

## Collections

### 1. `assets`
- `id`: String (Firestore ID)
- `type`: String ("sample", "stem", "recording")
- `path`: String (GCS URI)
- `name`: String
- `createdAt`: Timestamp
- `metadata`: Map
  - `duration`: Number
  - `sampleRate`: Number
  - `bpm`: Number
  - `tags`: Array<String>

### 2. `presets`
- `id`: String (Firestore ID)
- `name`: String
- `data`: Map (JSON representation of preset)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
