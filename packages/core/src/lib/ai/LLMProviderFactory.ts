import { ILLMProvider } from '../../types';
import { geminiLLMProvider } from './GeminiLLMProvider';
import { ollamaLLMProvider } from './OllamaLLMProvider';

export class LLMProviderFactory {
  public static getProvider(): ILLMProvider {
    if (typeof window !== 'undefined') {
      const selected = localStorage.getItem('basekit_ai_provider') || 'gemini';
      if (selected === 'ollama') {
        return ollamaLLMProvider;
      }
    } else {
      const selected = process.env.AI_PROVIDER || 'gemini';
      if (selected === 'ollama') {
        return ollamaLLMProvider;
      }
    }
    return geminiLLMProvider;
  }
}

export default LLMProviderFactory;
