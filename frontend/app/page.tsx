'use client';
import React, { useState } from 'react';
import { StreamLayout } from '../components/StreamLayout';
import { B2BModal } from '../components/B2BModal';
import { MasterTrackTerminal } from '../components/MasterTrackTerminal';

export default function Home() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const handleJoin = (roomId: string, username: string) => {
    setRoomId(roomId);
    setUsername(username);
  };

  if (!roomId) {
    return <B2BModal onJoin={handleJoin} />;
  }

  return (
    <>
      <StreamLayout roomId={roomId} username={username || ''}>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl font-bold">sample-monk</h1>
          <p className="text-gray-400 mt-4">Room: {roomId} | User: {username}</p>
        </div>
      </StreamLayout>
      <MasterTrackTerminal />
    </>
  );
}
