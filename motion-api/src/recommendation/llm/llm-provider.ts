export const LLM_PROVIDERS = 'LLM_PROVIDERS';

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  complete(system: string, user: string): Promise<string>;
}

export class OpenAiCompatibleClient implements LlmProvider {
  constructor(
    readonly name: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async complete(system: string, user: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`${this.name} HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error(`${this.name} returned an empty response`);
    return content;
  }
}
