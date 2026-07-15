import { ILLMProvider } from '../../types';

export class OllamaLLMProvider implements ILLMProvider {
  private getEndpoint(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('OLLAMA_ENDPOINT') || 'http://localhost:11434';
    }
    return process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  private getModel(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('OLLAMA_MODEL') || 'llama3';
    }
    return process.env.OLLAMA_MODEL || 'llama3';
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const endpoint = this.getEndpoint();
    const model = this.getModel();

    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'ollama',
            prompt,
            options,
            config: {
              ollamaEndpoint: endpoint,
              ollamaModel: model
            }
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.text;
      } catch (err: any) {
        console.error('[OllamaLLMProvider] Proxy Error:', err);
        return `Failed to generate text (Proxy): ${err.message}`;
      }
    }

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data?.response || 'No response generated.';
    } catch (err: any) {
      console.error('[OllamaLLMProvider] Error generating text:', err);
      return `Failed to generate text from Ollama: ${err.message}. (Make sure Ollama is running at ${endpoint} and CORS is enabled via OLLAMA_ORIGINS="*")`;
    }
  }

  async generateJSON<T>(prompt: string, schema: any): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond strictly with JSON matching this schema:\n${JSON.stringify(schema)}`;
    const rawResponse = await this.generateText(jsonPrompt, { format: 'json' });
    try {
      const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err: any) {
      console.error('[OllamaLLMProvider] Failed to parse JSON response:', rawResponse);
      throw new Error(`Failed to parse Ollama response as JSON: ${err.message}`);
    }
  }
}

export const ollamaLLMProvider = new OllamaLLMProvider();
export default ollamaLLMProvider;
