import React, { useState, useCallback } from 'react';
import type { ViralScript, AnalyzedTopic } from './types';
import { fetchTrendingTopics, generateScriptsFromTopics } from './services/geminiService';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ScriptCard from './components/ScriptCard';
import TopicSelector from './components/TopicSelector';

type AppStatus = 'idle' | 'fetchingTopics' | 'topicsReady' | 'generatingScripts' | 'scriptsReady' | 'error';

const RocketIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
         <path d="M15.5 12c0-1.09-.43-2.09-1.14-2.83l-1.42-1.42c-.2-.2-.51-.2-.71 0l-4.24 4.24c-.2.2-.2.51 0 .71l1.42 1.42C10.41 15.07 11.41 15.5 12.5 15.5s2.09-.43 2.83-1.14l1.42-1.42c.2-.2.2-.51 0-.71zM12.5 14c-.47 0-.92-.18-1.25-.51l-1.42-1.42 2.83-2.83 1.42 1.42c.32.33.51.78.51 1.25s-.18.92-.51 1.25c-.33.33-.78.51-1.25.51z"/>
         <path d="M9.57 15.84l-1.42-1.42-4.24 4.24c-.2.2-.2.51 0 .71l1.42 1.42c.2.2.51.2.71 0l4.24-4.24c.2-.2.2-.51 0-.71z"/>
    </svg>
);

const App: React.FC = () => {
    const [appStatus, setAppStatus] = useState<AppStatus>('idle');
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [analyzedTopics, setAnalyzedTopics] = useState<AnalyzedTopic[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
    const [scripts, setScripts] = useState<ViralScript[]>([]);
    const [error, setError] = useState<string | null>(null);

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
            // We want to stay on the topicsReady screen
            setTimeout(() => {
                setError(null);
                setAppStatus('topicsReady');
            }, 3000);
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

            const rawScripts = await generateScriptsFromTopics(selectedTopics);
            
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
    }, [analyzedTopics, selectedTopicIds]);
    
    const isLoading = appStatus === 'fetchingTopics' || appStatus === 'generatingScripts';

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                <Header />

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
        </div>
    );
};

export default App;
