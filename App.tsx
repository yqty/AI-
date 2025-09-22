import React, { useState, useCallback } from 'react';
import type { ViralScript } from './types';
import { fetchTrendingTopics, generateScriptsFromTopics } from './services/geminiService';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ScriptCard from './components/ScriptCard';

const RocketIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12.5 18H11v-6l-2.29 2.29L7.29 12.87 12 8.16l4.71 4.71-1.42 1.42L13 12v6h-.5z" transform="rotate(-45 12 12)"/>
        <path d="M5.47 18.53c.89-1.95 2.5-3.66 4.45-4.55l.8-.36.36-.8C12.04 10.97 13.75 9.36 15.7 8.47c1.95-.89 4.1-.48 5.66 1.07l-1.42 1.42c-1.1-1.1-2.73-1.37-4.22-.84-.99.35-1.89.96-2.61 1.77l-.36.36.8.36c1.89.85 3.51 2.47 4.39 4.37l-1.42 1.42c-1.12-2.12-3.11-3.74-5.46-4.31v.01l-1.63-.73-.73-1.63v.01c-.57-2.35-2.19-4.34-4.31-5.46l1.42-1.42c2.12 1.12 3.74 3.11 4.31 5.46h-.01l1.63.73.73 1.63h-.01c2.35.57 4.34 2.19 5.46 4.31l-1.42 1.42c-.53-1.49-1.14-2.89-2.21-4.09l-.16-.18c-1.29-1.43-3.1-2.31-5.06-2.31-1.96 0-3.77.88-5.06 2.31l-.16.18c-1.07 1.2-1.68 2.6-2.21 4.09L5.47 18.53z"/>
    </svg>
);

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [trendingTopics, setTrendingTopics] = useState<string | null>(null);
    const [scripts, setScripts] = useState<ViralScript[]>([]);
    const [error, setError] = useState<string | null>(null);

    const parseScriptsResponse = (rawText: string): ViralScript[] => {
        // Split by "故事 X:"/"故事 X：", removing the delimiter. Filter out empty strings from the split.
        const stories = rawText.split(/故事\s?\d+\s*[:：]/).filter(s => s.trim().length > 20);
        
        // Fallback for when the main splitter fails but the content seems to be there.
        if (stories.length === 0 && rawText.includes('标题')) {
            stories.push(rawText);
        }

        return stories.map((storyText, index) => {
            const cleanStoryText = storyText.replace(/\*\*/g, ''); // Remove markdown bolding

            // Regexes are now flexible with colons (： vs :), spacing, and missing subsequent sections (using |$)
            const titleMatch = cleanStoryText.match(/标题\s*[-–—:：]\s*(.*)/);
            const structureMatch = cleanStoryText.match(/五幕结构\s*[:：]([\s\S]*?)(?:模式 & 结合方法\s*[:：]|脚本大纲\s*[:：]|$)/);
            const modeMatch = cleanStoryText.match(/模式 & 结合方法\s*[:：]([\s\S]*?)(?:脚本大纲\s*[:：]|$)/);
            const outlineMatch = cleanStoryText.match(/脚本大纲\s*[:：]([\s\S]*)/);

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

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setScripts([]);
        setTrendingTopics(null);

        try {
            const topics = await fetchTrendingTopics(setLoadingMessage);
            setTrendingTopics(topics);

            setLoadingMessage('正在整合热点并锻造爆款剧本...');
            const rawScripts = await generateScriptsFromTopics(topics);
            
            const parsedScripts = parseScriptsResponse(rawScripts);
            if(parsedScripts.length === 0) {
              throw new Error("AI未能生成有效的剧本。可能是当前热点不适合改编，或返回格式有误。请稍后重试。");
            }
            setScripts(parsedScripts);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('发生未知错误');
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                <Header />

                <main className="mt-8">
                    <div className="flex justify-center">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <RocketIcon className="w-6 h-6 mr-3"/>
                            {isLoading ? '生成中...' : '一键生成爆款剧本'}
                        </button>
                    </div>

                    {isLoading && <LoadingSpinner message={loadingMessage} />}
                    
                    {error && (
                        <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            <p className="font-bold">发生错误</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {scripts.length > 0 && !isLoading && (
                        <div className="mt-12">
                            {trendingTopics && (
                                <div className="mb-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                    <h2 className="text-xl font-bold text-gray-200 mb-2">当前分析的热点：</h2>
                                    <p className="text-gray-300 whitespace-pre-wrap">{trendingTopics}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-8">
                                {scripts.map(script => (
                                    <ScriptCard key={script.id} script={script} />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!isLoading && scripts.length === 0 && !error && (
                        <div className="text-center mt-12 p-8 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl">
                            <h2 className="text-2xl font-semibold text-gray-300">准备好引爆流量了吗？</h2>
                            <p className="text-gray-400 mt-2">点击按钮，ViralForge AI 将自动搜索当前热点，并为您量身打造三个具有病毒式传播潜力的短视频剧本。</p>
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