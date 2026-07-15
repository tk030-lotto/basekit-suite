import { ILLMProvider } from '../../types';

export class GeminiLLMProvider implements ILLMProvider {
  private getApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('GEMINI_API_KEY') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    }
    return process.env.GEMINI_API_KEY || null;
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const apiKey = this.getApiKey();

    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'gemini',
            prompt,
            options,
            config: {
              geminiApiKey: apiKey
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
        console.error('[GeminiLLMProvider] Proxy Error:', err);
        return `Failed to generate text (Proxy): ${err.message}`;
      }
    }

    if (!apiKey) {
      return "Error: Gemini API Key is not set. Please set GEMINI_API_KEY in your environment or Settings panel.";
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    } catch (err: any) {
      console.error('[GeminiLLMProvider] Error generating text:', err);
      return `Failed to generate text from Gemini API: ${err.message}`;
    }
  }

  async generateJSON<T>(prompt: string, schema: any): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond strictly with JSON matching this JSON schema:\n${JSON.stringify(schema)}`;
    const rawResponse = await this.generateText(jsonPrompt);
    try {
      // Find JSON block if Gemini wrapped it in markdown code block
      const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as T;
    } catch (err) {
      console.error('[GeminiLLMProvider] Failed to parse JSON response:', rawResponse);
      throw new Error('Failed to parse Gemini response as JSON.');
    }
  }
}

export const geminiLLMProvider = new GeminiLLMProvider();
export default geminiLLMProvider;
