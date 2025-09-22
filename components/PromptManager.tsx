import React, { useState, useEffect } from 'react';
import type { CustomPrompt } from '../types';

interface PromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: CustomPrompt[];
  onSave: (prompt: { id?: string; name: string; content: string; }) => void;
  onDelete: (promptId: string) => void;
}

const PromptManager: React.FC<PromptManagerProps> = ({ isOpen, onClose, prompts, onSave, onDelete }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<CustomPrompt | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedPrompt) {
      setName(selectedPrompt.name);
      setContent(selectedPrompt.content);
    } else {
      // Set to default prompt content when creating a new one
      const defaultPrompt = prompts.find(p => p.isDefault);
      setName('');
      setContent(defaultPrompt?.content || '');
    }
  }, [selectedPrompt, prompts]);
  
  useEffect(() => {
      // When opening, or if the selected prompt is deleted, select the default one.
      // By not depending on `selectedPrompt`, we avoid a feedback loop when intentionally
      // setting the selection to null (i.e., when creating a new prompt).
      const isSelectedPromptValid = selectedPrompt && prompts.some(p => p.id === selectedPrompt.id);
      if (isOpen && !isSelectedPromptValid) {
          setSelectedPrompt(prompts.find(p => p.isDefault) || prompts[0] || null);
      }
  }, [isOpen, prompts]);

  if (!isOpen) return null;

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleNewPrompt = () => {
    setSelectedPrompt(null);
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('提示词名称和内容不能为空。');
      return;
    }
    onSave({ id: selectedPrompt?.id, name, content });
    if (!selectedPrompt?.id) {
        handleNewPrompt();
    }
  };

  const handleDelete = () => {
    if (selectedPrompt && !selectedPrompt.isDefault) {
      if (window.confirm(`确定要删除提示词 "${selectedPrompt.name}" 吗？`)) {
        onDelete(selectedPrompt.id);
        handleNewPrompt();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="prompt-manager-title">
      <div className="bg-gray-800 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-900/50 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 id="prompt-manager-title" className="text-xl font-bold text-white">提示词管理</h2>
          </div>
          <div className="flex-grow overflow-y-auto">
            {prompts.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectPrompt(p)}
                className={`p-4 cursor-pointer border-l-4 ${selectedPrompt?.id === p.id ? 'bg-gray-700 border-orange-500 text-white' : 'border-transparent text-gray-300 hover:bg-gray-700/50'}`}
              >
                <p className="font-semibold truncate">{p.name}</p>
                {p.isDefault && <span className="text-xs text-gray-400">默认</span>}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <button onClick={handleNewPrompt} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors">
              + 创建新提示词
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="w-2/3 flex flex-col p-6">
          <h3 className="text-2xl font-bold text-orange-400 mb-4">{selectedPrompt ? '编辑提示词' : '创建新提示词'}</h3>
          <div className="flex flex-col space-y-4 flex-grow">
            <div>
              <label htmlFor="prompt-name" className="block text-sm font-medium text-gray-300 mb-1">提示词名称</label>
              <input
                id="prompt-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={selectedPrompt?.isDefault ?? false}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                placeholder="例如：科幻风格剧本模型"
              />
            </div>
            <div className="flex-grow flex flex-col">
              <label htmlFor="prompt-content" className="block text-sm font-medium text-gray-300 mb-1">提示词内容</label>
              <textarea
                id="prompt-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={selectedPrompt?.isDefault ?? false}
                className="w-full h-full flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 resize-none disabled:opacity-50"
                placeholder="在这里输入您的AI智能体角色提示词..."
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              {selectedPrompt && !selectedPrompt.isDefault && (
                <button onClick={handleDelete} className="text-red-500 hover:text-red-400 font-semibold transition-colors">
                  删除
                </button>
              )}
            </div>
            <div className="space-x-4">
              <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors">
                关闭
              </button>
              {!(selectedPrompt?.isDefault) && (
                 <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded transition-colors">
                  保存
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptManager;