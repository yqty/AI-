
import React from 'react';
import type { ViralScript } from '../types';

interface ScriptCardProps {
  script: ViralScript;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ script }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:border-orange-500">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-orange-400 mb-4">{script.title}</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-200 text-lg mb-2">五幕结构:</h4>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{script.fiveActStructure.trim()}</p>
          </div>
          
          <div className="border-t border-gray-700 my-4"></div>

          <div>
            <h4 className="font-semibold text-gray-200 text-lg mb-2">模式 & 结合方法:</h4>
            <p className="text-gray-300 bg-gray-700/50 inline-block px-3 py-1 rounded-md">{script.modeAndMethod.trim()}</p>
          </div>
          
          <div className="border-t border-gray-700 my-4"></div>

          <div>
            <h4 className="font-semibold text-gray-200 text-lg mb-2">脚本大纲:</h4>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{script.scriptOutline.trim()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptCard;
