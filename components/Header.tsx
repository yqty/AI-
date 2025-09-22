
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
        ViralForge AI
      </h1>
      <p className="text-lg md:text-xl text-gray-300">
        AI驱动的爆款短视频剧本生成器
      </p>
    </header>
  );
};

export default Header;
