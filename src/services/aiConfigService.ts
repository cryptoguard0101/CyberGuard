import { AiConfig } from "../types";
import { GoogleGenAI } from "@google/genai";

const CONFIG_KEY = 'kmu-cyberguard-ai-config';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'CLOUD', // Default to Gemini
  geminiApiKey: process.env.API_KEY || '',
  ollamaUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3'
};

export const getAiConfig = (): AiConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(stored);
    // Merge with default to ensure all keys are present
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveAiConfig = (config: AiConfig) => {
  // Normalize URL (remove trailing slash)
  const cleanUrl = config.ollamaUrl.replace(/\/$/, '');
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, ollamaUrl: cleanUrl }));
};

export const isAiConfigured = (): boolean => {
  const config = getAiConfig();
  if (config.provider === 'CLOUD') {
    return !!config.geminiApiKey;
  }
  if (config.provider === 'OLLAMA') {
    // For Ollama, we assume it's configured if the user has selected it.
    // The connection check happens elsewhere. This is for UI enablement.
    return true;
  }
  return false;
};

export const triggerAiConfigWizard = () => {
  window.dispatchEvent(new CustomEvent('open-ai-wizard'));
};


export const checkOllamaConnection = async (url: string): Promise<boolean> => {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    
    // Attempt 1: Check Version/Tags (Lightweight)
    // This confirms server is reachable and CORS is allowed
    const response = await fetch(`${cleanUrl}/api/tags`, {
        method: 'GET',
    });
    
    if (!response.ok) return false;

    // Optional: Check if model exists in the list
    // const data = await response.json();
    // const modelExists = data.models?.some((m: { name: string }) => m.name.includes(model));
    
    // We return true if server is reachable, even if model isn't found (better UX to show server is ok but model missing)
    return true; 
  } catch (error) {
    console.error("Ollama Connection Check Failed:", error);
    return false;
  }
};

export const checkGeminiConnection = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Use a very simple, non-streaming call to test authentication
        await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: 'test'
        });
        return true;
    } catch (error) {
        console.error("Gemini Connection Check Failed:", error);
        return false;
    }
};