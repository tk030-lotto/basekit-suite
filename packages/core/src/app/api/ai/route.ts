import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, prompt, options, config } = body;

    if (provider === 'ollama') {
      const endpoint = config?.ollamaEndpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
      const model = config?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3';

      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Proxy error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({ success: true, text: data?.response || '' });
    } else {
      // Default to Gemini
      const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'Gemini API Key is not set.' }, { status: 400 });
      }

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
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini Proxy error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return NextResponse.json({ success: true, text });
    }
  } catch (err: any) {
    console.error('[AI Proxy API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
