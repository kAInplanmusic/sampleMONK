# DB2: Session DB Schema (Firestore / In-Memory)

## Collections

### 1. `sessions`
- `id`: String (Firestore ID)
- `active`: Boolean
- `users`: Array<Map>
  - `userId`: String
  - `role`: String
- `state`: Map (Active tracks, levels, etc.)
  - `trackStates`: Map<String, Map> (TrackID -> State)
  - `masterLevel`: Number
- `updatedAt`: Timestamp
