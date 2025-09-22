import { GoogleGenAI } from "@google/genai";
import { VIRAL_FORGE_AI_PROMPT } from '../constants';

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
        // Return empty string on failure for a specific category so Promise.all doesn't fail
        return ""; 
    }
}


export async function fetchTrendingTopics(updateLoadingMessage: (message: string) => void): Promise<string> {
    try {
        const categories = [
            { name: "搞笑", prompt: "使用中文，从推特/X、YouTube或主要新闻媒体中，找出一个近期最热门、最具病毒式传播潜力的搞笑或趣闻轶事。请提供一个简短的一句话摘要，并确保它有明确的喜剧或荒谬元素。" },
            { name: "情感", prompt: "使用中文，从推特/X、YouTube或主要新闻媒体中，找出一个近期最热门、最感人或温暖人心的情感故事。请提供一个简短的一句话摘要，并确保它能引发共鸣或触动人心。" },
            { name: "励志", prompt: "使用中文，从推特/X、YouTube或主要新闻媒体中，找出一个近期最热门的、关于克服困难、励志或展现坚韧精神的故事。请提供一个简短的一句话摘要，并确保它具有逆袭或鼓舞人心的核心。" }
        ];

        const topicPromises = categories.map(async (category) => {
            updateLoadingMessage(`正在搜索${category.name}类热点...`);
            const topic = await searchTopicByCategory(category.prompt);
            // Give context to the next model
            return topic ? `[${category.name}类热点] ${topic}` : null;
        });

        const topics = await Promise.all(topicPromises);
        
        const combinedTopics = topics.filter(topic => topic).join('\n');

        if (!combinedTopics) {
            throw new Error("未能从任何类别中找到热门话题。请检查网络连接或稍后重试。");
        }

        return combinedTopics;

    } catch (error) {
        console.error("Error fetching trending topics:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("无法获取热门话题。请稍后再试。");
    }
}

export async function generateScriptsFromTopics(topics: string): Promise<string> {
  try {
    const fullPrompt = `${VIRAL_FORGE_AI_PROMPT}\n\n[热点描述]：${topics}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
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