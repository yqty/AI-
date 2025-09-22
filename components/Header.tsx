import React from 'react';

const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
    </svg>
);

interface HeaderProps {
    onOpenPromptManager: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenPromptManager }) => {
  return (
    <header className="relative text-center p-4 md:p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
        ViralForge AI
      </h1>
      <p className="text-lg md:text-xl text-gray-300">
        AI驱动的爆款短视频剧本生成器
      </p>
       <button
          onClick={onOpenPromptManager}
          className="absolute top-1/2 -translate-y-1/2 right-0 text-gray-400 hover:text-orange-400 transition-colors p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70"
          aria-label="管理提示词"
      >
          <SettingsIcon className="w-6 h-6"/>
      </button>
    </header>
  );
};

export default Header;
