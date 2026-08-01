import React from 'react';
import { useDevice } from '../hooks/useDevice';

interface StreamLayoutProps {
  children: React.ReactNode;
  roomId: string;
  username: string;
}

export const StreamLayout: React.FC<StreamLayoutProps> = ({ children, roomId, username }) => {
  const device = useDevice();
  // We need to implement useRoom hook again as it was wiped by git reset
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <nav className="h-16 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Placeholder for icons */}
          <div className="text-sm font-mono text-gray-500">Plugin Icons Row</div>
        </div>
        <div className="text-xs text-neutral-400 font-mono">
           Room: {roomId} | User: {username}
        </div>
      </nav>

      <main className={`flex-1 overflow-auto p-4 ${device === 'mobile' ? 'p-2' : ''}`}>
        {children}
      </main>
      
      <footer className="text-xs text-gray-600 p-2 text-center">
        Mode: {device.toUpperCase()}
      </footer>
    </div>
  );
};
