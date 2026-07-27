import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PluginButtonProps {
  id: string;
  icon: LucideIcon;
  short: string;
  isActive: boolean;
  state: string;
  onClick: () => void;
}

export const PluginButton = React.memo(({ icon: Icon, short, isActive, state, onClick }: PluginButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center h-20 rounded-xl border transition-all ${
        isActive
          ? state === 'PRO'
            ? 'bg-purple-900/50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
            : 'bg-orange-900/30 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.2)] animate-pulse'
          : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] font-bold mt-2 uppercase">{short}</span>
    </button>
  );
});
