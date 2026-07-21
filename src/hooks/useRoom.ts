import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RoomUser {
  uid: string;
  name: string;
}

export function useRoom(roomId: string | null, userId: string | null) {
  const [room, setRoom] = useState<{ hostId: string; users: RoomUser[] } | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoom(doc.data() as any);
      }
    });

    return () => unsub();
  }, [roomId]);

  const kickUser = async (targetUserId: string) => {
    if (!room || room.hostId !== userId) return; // Only host can kick
    
    const userToKick = room.users.find(u => u.uid === targetUserId);
    if (userToKick) {
      await updateDoc(doc(db, 'rooms', roomId!), {
        users: arrayRemove(userToKick)
      });
    }
  };

  return { room, kickUser };
}
