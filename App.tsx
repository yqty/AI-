import React, { useState, useCallback, useEffect } from 'react';
import type { ViralScript, AnalyzedTopic, CustomPrompt } from './types';
import { fetchTrendingTopics, generateScriptsFromTopics } from './services/geminiService';
import { getPrompts, savePrompts } from './services/promptService';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ScriptCard from './components/ScriptCard';
import TopicSelector from './components/TopicSelector';
import PromptManager from './components/PromptManager';

type AppStatus = 'idle' | 'fetchingTopics' | 'topicsReady' | 'generatingScripts' | 'scriptsReady' | 'error';

const RocketIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.85,3.13a.5.5,0,0,0-.7,0L9.4,5.87a1.5,1.5,0,0,0-.43.83L7.79,10.2a.5.5,0,0,0,.49.6h3.44a.5.5,0,0,0,.49-.6L11,6.7a1.5,1.5,0,0,0-.43-.83ZM10.22,8.3l.57-2.35a.5.5,0,0,1,.14-.28L12,4.56l1.07,1.11a.5.5,0,0,1,.14.28L13.78,8.3Z"/>
        <path d="M12,12.22a4.49,4.49,0,0,0-4.49,4.49V19.8h9V16.71A4.49,4.49,0,0,0,12,12.22Zm3,6.08H9V16.71a3,3,0,0,1,6,0Z"/>
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
    </svg>
);

const App: React.FC = () => {
    const [appStatus, setAppStatus] = useState<AppStatus>('idle');
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [analyzedTopics, setAnalyzedTopics] = useState<AnalyzedTopic[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
    const [scripts, setScripts] = useState<ViralScript[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string>('');
    const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
    
    useEffect(() => {
        const loadedPrompts = getPrompts();
        setPrompts(loadedPrompts);
        if (loadedPrompts.length > 0) {
            setSelectedPromptId(loadedPrompts[0].id);
        }
    }, []);

    const parseScriptsResponse = (rawText: string): ViralScript[] => {
        const stories = rawText.split(/故事\s?\d+\s*[:：]/).filter(s => s.trim().length > 20);
        
        if (stories.length === 0 && rawText.includes('标题')) {
            stories.push(rawText);
        }

        return stories.map((storyText, index) => {
            const cleanStoryText = storyText.replace(/\*\*/g, '');

            const titleMatch = cleanStoryText.match(/标题\s*[-–—:：]\s*(.*)/);
            const structureMatch = cleanStoryText.match(/五幕结构\s*[:：]([\s\S]*?)(?:模式 & 结合方法\s*[:：]|视觉大纲\s*[:：]|$)/);
            const modeMatch = cleanStoryText.match(/模式 & 结合方法\s*[:：]([\s\S]*?)(?:视觉大纲\s*[:：]|$)/);
            const outlineMatch = cleanStoryText.match(/视觉大纲\s*[:：]([\s\S]*)/);

            const cleanContent = (content: string | null | undefined): string => {
                return content ? content.trim().replace(/^\n+/, '').replace(/\n+$/, '') : '未提供';
            };

            return {
                id: index + 1,
                title: titleMatch ? cleanContent(titleMatch[1]) : '无标题',
                fiveActStructure: structureMatch ? cleanContent(structureMatch[1]) : '未提供',
                modeAndMethod: modeMatch ? cleanContent(modeMatch[1]) : '未提供',
                scriptOutline: outlineMatch ? cleanContent(outlineMatch[1]) : '未提供',
            };
        }).filter(script => script.title !== '无标题' && script.scriptOutline !== '未提供');
    };

    const handleFetchTopics = useCallback(async () => {
        setAppStatus('fetchingTopics');
        setError(null);
        setScripts([]);
        setAnalyzedTopics([]);

        try {
            const topics = await fetchTrendingTopics(setLoadingMessage);
            setAnalyzedTopics(topics);
            setSelectedTopicIds(new Set(topics.map(t => t.id))); // Select all by default
            setAppStatus('topicsReady');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '发生未知错误';
            setError(errorMessage);
            setAppStatus('error');
        } finally {
            setLoadingMessage('');
        }
    }, []);

    const handleToggleTopic = (topicId: string) => {
        setSelectedTopicIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topicId)) {
                newSet.delete(topicId);
            } else {
                newSet.add(topicId);
            }
            return newSet;
        });
    };

    const handleGenerateScripts = useCallback(async () => {
        if (selectedTopicIds.size === 0) {
            setError("请至少选择一个热点进行创作。");
            setAppStatus('error');
            setTimeout(() => {
                setError(null);
                setAppStatus('topicsReady');
            }, 3000);
            return;
        }

        const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
        if (!selectedPrompt) {
            setError("未能找到选定的提示词模型。");
            setAppStatus('error');
            return;
        }

        setAppStatus('generatingScripts');
        setError(null);
        setLoadingMessage('正在整合热点并锻造爆款剧本...');

        try {
            const selectedTopics = analyzedTopics
                .filter(t => selectedTopicIds.has(t.id))
                .map(t => `[${t.category}类热点] ${t.text}`)
                .join('\n');

            const rawScripts = await generateScriptsFromTopics(selectedTopics, selectedPrompt.content);
            
            const parsedScripts = parseScriptsResponse(rawScripts);
            if (parsedScripts.length === 0) {
                throw new Error("AI未能生成有效的剧本。可能是当前热点不适合改编，或返回格式有误。请稍后重试。");
            }
            setScripts(parsedScripts);
            setAppStatus('scriptsReady');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '发生未知错误';
            setError(errorMessage);
            setAppStatus('error');
        } finally {
            setLoadingMessage('');
        }
    }, [analyzedTopics, selectedTopicIds, prompts, selectedPromptId]);

    const handleSavePrompt = (promptToSave: { id?: string; name: string; content: string; }) => {
        let updatedPrompts: CustomPrompt[];
        if (promptToSave.id) {
            updatedPrompts = prompts.map(p => p.id === promptToSave.id ? { ...p, name: promptToSave.name, content: promptToSave.content } : p);
        } else {
            const newPrompt: CustomPrompt = {
                id: `custom-${Date.now()}`,
                name: promptToSave.name,
                content: promptToSave.content,
                isDefault: false,
            };
            updatedPrompts = [...prompts, newPrompt];
        }
        setPrompts(updatedPrompts);
        savePrompts(updatedPrompts);
    };

    const handleDeletePrompt = (promptId: string) => {
        const promptToDelete = prompts.find(p => p.id === promptId);
        if (promptToDelete?.isDefault) return;

        const updatedPrompts = prompts.filter(p => p.id !== promptId);
        setPrompts(updatedPrompts);
        savePrompts(updatedPrompts);
        
        if (selectedPromptId === promptId) {
            const defaultPrompt = updatedPrompts.find(p => p.isDefault) || updatedPrompts[0];
            if (defaultPrompt) {
                setSelectedPromptId(defaultPrompt.id);
            }
        }
    };
    
    const isLoading = appStatus === 'fetchingTopics' || appStatus === 'generatingScripts';

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                <Header onOpenPromptManager={() => setIsPromptModalOpen(true)} />

                <main className="mt-8">
                    {appStatus === 'idle' && (
                         <div className="flex justify-center">
                            <button
                                onClick={handleFetchTopics}
                                disabled={isLoading}
                                className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                <RocketIcon className="w-6 h-6 mr-3"/>
                                搜索全球热点
                            </button>
                        </div>
                    )}

                    {isLoading && <LoadingSpinner message={loadingMessage} />}
                    
                    {appStatus === 'error' && error && (
                        <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            <p className="font-bold">发生错误</p>
                            <p>{error}</p>
                            <button onClick={() => setAppStatus('idle')} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">重试</button>
                        </div>
                    )}
                    
                    {appStatus === 'topicsReady' && (
                        <div>
                           <TopicSelector topics={analyzedTopics} selectedIds={selectedTopicIds} onToggle={handleToggleTopic} />
                           
                           <div className="mt-8 text-center">
                                <label htmlFor="prompt-selector" className="block text-lg font-medium text-gray-300 mb-2">第2步：选择生成模型</label>
                                <select
                                    id="prompt-selector"
                                    value={selectedPromptId}
                                    onChange={(e) => setSelectedPromptId(e.target.value)}
                                    className="bg-gray-700 border border-gray-600 text-white text-lg rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full max-w-md mx-auto p-3"
                                >
                                    {prompts.map(prompt => (
                                        <option key={prompt.id} value={prompt.id}>
                                            {prompt.name}
                                        </option>
                                    ))}
                                </select>
                           </div>

                           <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleGenerateScripts}
                                    disabled={isLoading || selectedTopicIds.size === 0}
                                    className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    <RocketIcon className="w-6 h-6 mr-3"/>
                                    生成爆款剧本
                                </button>
                            </div>
                        </div>
                    )}

                    {appStatus === 'scriptsReady' && scripts.length > 0 && (
                        <div className="mt-12 animate-fade-in">
                            <div className="grid grid-cols-1 gap-8">
                                {scripts.map(script => (
                                    <ScriptCard key={script.id} script={script} />
                                ))}
                            </div>
                            <div className="text-center mt-12">
                               <button
                                    onClick={handleFetchTopics}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300"
                                >
                                    重新搜索热点
                                </button>
                            </div>
                        </div>
                    )}
                    
                     {appStatus === 'idle' && (
                        <div className="text-center mt-12 p-8 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl">
                            <h2 className="text-2xl font-semibold text-gray-300">准备好引爆全球流量了吗？</h2>
                            <p className="text-gray-400 mt-2">点击按钮，ViralForge AI 将搜索全球热点，供您选择并创作成无声但有力的视觉故事。</p>
                        </div>
                    )}
                </main>
            </div>
             <footer className="text-center w-full max-w-4xl mx-auto mt-12 py-6 border-t border-gray-800">
                <p className="text-gray-500">由 Gemini API 强力驱动</p>
            </footer>
             <PromptManager
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                prompts={prompts}
                onSave={handleSavePrompt}
                onDelete={handleDeletePrompt}
            />
        </div>
    );
};

export default App;