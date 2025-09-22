import { DEFAULT_SCRIPT_PROMPT } from '../constants';
import type { CustomPrompt } from '../types';

const PROMPTS_STORAGE_KEY = 'viralforge_ai_prompts';

const DEFAULT_PROMPT: CustomPrompt = {
  id: 'default-prompt-1',
  name: '默认生成模型 (ViralForge AI)',
  content: DEFAULT_SCRIPT_PROMPT,
  isDefault: true,
};

export function getPrompts(): CustomPrompt[] {
  try {
    const storedPrompts = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (storedPrompts) {
      // Ensure the default prompt is always present and up-to-date
      const parsedPrompts = JSON.parse(storedPrompts) as CustomPrompt[];
      const hasDefault = parsedPrompts.some(p => p.isDefault);
      if (!hasDefault) {
         return [DEFAULT_PROMPT, ...parsedPrompts.filter(p => !p.isDefault)];
      }
      return parsedPrompts.map(p => p.isDefault ? DEFAULT_PROMPT : p);
    } else {
      // Initialize with the default prompt if nothing is stored
      const initialPrompts = [DEFAULT_PROMPT];
      localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(initialPrompts));
      return initialPrompts;
    }
  } catch (error) {
    console.error("Failed to load prompts from local storage:", error);
    // Return default as a fallback
    return [DEFAULT_PROMPT];
  }
}

export function savePrompts(prompts: CustomPrompt[]): void {
  try {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error("Failed to save prompts to local storage:", error);
  }
}
