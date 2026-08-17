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
      className={`flex flex-col items-center justify-center h-14 md:h-16 rounded-lg border transition-all select-none focus:outline-none focus:ring-2 focus:ring-offset-0 ${
        isActive
          ? state === 'PRO'
            ? 'bg-gradient-to-br from-purple-600/25 to-fuchsia-600/20 border-purple-500 shadow-[0_0_18px_rgba(236,72,153,0.35)]'
            : 'bg-cyan-900/25 border-cyan-400/60 shadow-[0_0_14px_rgba(34,211,238,0.3)] animate-pulse'
          : 'bg-black/60 border-neutral-800 hover:border-cyan-400/50 hover:bg-neutral-900/70'
      }`}
    >
      <Icon size={20} className={isActive ? (state === 'PRO' ? 'text-fuchsia-300' : 'text-cyan-300') : 'text-neutral-400'} />
      <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide ${isActive ? (state === 'PRO' ? 'text-fuchsia-200' : 'text-cyan-200') : 'text-neutral-500'}`}>{short}</span>
    </button>
  );
});
