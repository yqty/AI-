import { GoogleGenAI } from "@google/genai";
import type { AnalyzedTopic } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function searchTopicByCategory(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error fetching topic for prompt:`, error);
        return ""; 
    }
}

export async function fetchTrendingTopics(updateLoadingMessage: (message: string) => void): Promise<AnalyzedTopic[]> {
    try {
        const categories = [
            // Chinese Topics
            { id: "funny-cn", name: "搞笑 (CN)", prompt: "使用中文，在全球范围内的推特/X、YouTube或TikTok上，找出一个近期最热门、最具病毒式传播潜力的搞笑或趣闻轶事。请用2-3句话描述这个热点，并关键性地分析出它之所以能病毒式传播的核心笑点和内在逻辑。" },
            { id: "emotional-cn", name: "情感 (CN)", prompt: "使用中文，在全球范围内的推特/X、YouTube或TikTok上，找出一个近期最热门、最能引发情感共鸣的感人故事。请用2-3句话描述这个热点，并关键性地分析出它能触动人心的情感内核和故事背景。" },
            { id: "inspirational-cn", name: "励志 (CN)", prompt: "使用中文，在全球范围内的推特/X、YouTube或TikTok上，找出一个近期最热门的、关于克服困难或励志逆袭的真实故事。请用2-3句话描述这个热点，并关键性地分析出其励志精神的核心以及能引发广泛共鸣的价值主张。" },
            // English Topics
            { id: "funny-en", name: "Funny (EN)", prompt: "Using English, find a recent, top-trending, and highly viral funny or anecdotal story from Twitter/X, YouTube, or TikTok worldwide. Please describe the topic in 2-3 sentences, and critically analyze the core comedic element and intrinsic logic that made it go viral." },
            { id: "emotional-en", name: "Emotional (EN)", prompt: "Using English, find a recent, top-trending, and emotionally resonant touching story from Twitter/X, YouTube, or TikTok worldwide. Please describe the topic in 2-3 sentences, and critically analyze the emotional core and story background that makes it so moving." },
            { id: "inspirational-en", name: "Inspirational (EN)", prompt: "Using English, find a recent, top-trending, true story about overcoming adversity or an inspirational comeback from Twitter/X, YouTube, or TikTok worldwide. Please describe the topic in 2-3 sentences, and critically analyze the core of its inspirational spirit and the value proposition that resonates widely." }
        ];

        const topicPromises = categories.map(async (category) => {
            updateLoadingMessage(`正在搜索全球${category.name}类热点...`);
            const topicText = await searchTopicByCategory(category.prompt);
            if (topicText) {
                return {
                    id: category.id,
                    category: category.name,
                    text: topicText
                };
            }
            return null;
        });

        const topics = await Promise.all(topicPromises);
        const validTopics = topics.filter((topic): topic is AnalyzedTopic => topic !== null);

        if (validTopics.length === 0) {
            throw new Error("未能从任何类别中找到热门话题。请检查网络连接或稍后重试。");
        }

        return validTopics;

    } catch (error) {
        console.error("Error fetching trending topics:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("无法获取全球热门话题。请稍后再试。");
    }
}

export async function generateScriptsFromTopics(topics: string, scriptPrompt: string): Promise<string> {
  try {
    const userContent = `[热点描述]：${topics}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContent,
      config: {
        systemInstruction: scriptPrompt,
        temperature: 0.8,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating scripts:", error);
    throw new Error("无法生成剧本。请稍后再试。");
  }
}