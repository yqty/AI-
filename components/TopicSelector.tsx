import React from 'react';
import type { AnalyzedTopic } from '../types';

interface TopicSelectorProps {
  topics: AnalyzedTopic[];
  selectedIds: Set<string>;
  onToggle: (topicId: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ topics, selectedIds, onToggle }) => {
  return (
    <div className="space-y-6 animate-fade-in">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100">第1步：选择创作热点</h2>
            <p className="text-gray-400 mt-1">请选择您想用来生成视觉故事的全球热点（可多选）。</p>
        </div>
      {topics.map(topic => (
        <label
          key={topic.id}
          htmlFor={`topic-${topic.id}`}
          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            selectedIds.has(topic.id)
              ? 'bg-gray-700/50 border-orange-500 ring-2 ring-orange-500'
              : 'bg-gray-800 border-gray-700 hover:border-gray-500'
          }`}
        >
          <input
            type="checkbox"
            id={`topic-${topic.id}`}
            checked={selectedIds.has(topic.id)}
            onChange={() => onToggle(topic.id)}
            className="h-6 w-6 mt-1 rounded bg-gray-900 border-gray-600 text-orange-500 focus:ring-orange-600 focus:ring-2 shrink-0"
          />
          <div className="ml-4">
            <span className="font-bold text-lg text-orange-400">{topic.category}类热点</span>
            <p className="text-gray-300">{topic.text}</p>
          </div>
        </label>
      ))}
    </div>
  );
};

export default TopicSelector;
