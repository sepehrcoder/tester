import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown>; id?: string };
  functionResponse?: {
    name: string;
    id?: string;
    response: Record<string, unknown>;
  };
  // Present on model-generated parts from "thinking" models (e.g. the 3.x
  // family) — MUST be echoed back verbatim on the next turn's contents, or
  // the API rejects the follow-up request with a 400. Never construct this
  // by hand; only ever copy it through from a prior response.
  thoughtSignature?: string;
}

export interface GeminiContent {
  role: 'user' | 'model' | 'function';
  parts: GeminiPart[];
}

interface GenerateOptions {
  contents: GeminiContent[];
  systemInstruction?: string;
  tools?: GeminiFunctionDeclaration[];
  jsonResponse?: boolean;
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Thin wrapper over the Gemini REST API (generateContent), not the
 * @google/genai SDK — the REST contract for text + function-calling is
 * small and stable, and hand-rolling it avoids pinning to an SDK version
 * that may drift out from under a fast-moving API.
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || undefined;
    this.model = this.config.get<string>(
      'GEMINI_MODEL',
      'gemini-flash-lite-latest',
    );
  }

  get enabled(): boolean {
    return !!this.apiKey;
  }

  /** Returns the model's response content (role + parts) for one turn. */
  async generate(opts: GenerateOptions): Promise<GeminiContent> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const body: Record<string, unknown> = { contents: opts.contents };
    if (opts.systemInstruction) {
      body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
    }
    if (opts.tools?.length) {
      body.tools = [{ functionDeclarations: opts.tools }];
    }
    if (opts.jsonResponse) {
      body.generationConfig = { responseMimeType: 'application/json' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(
        `${API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 500)}`);
      }

      const data = (await res.json()) as {
        candidates?: { content: GeminiContent; finishReason?: string }[];
      };
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error('Gemini returned no candidates');
      return candidate.content;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Best-effort variant for non-critical paths (moderation, auto-reply) — logs and returns null instead of throwing. */
  async generateSafe(opts: GenerateOptions): Promise<GeminiContent | null> {
    try {
      return await this.generate(opts);
    } catch (err) {
      this.logger.warn(`Gemini call failed: ${(err as Error).message}`);
      return null;
    }
  }
}
