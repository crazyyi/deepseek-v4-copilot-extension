/// <reference types="node" />
import * as vscode from 'vscode';

type Pricing = { input: number; output: number };
type PricingMap = Record<string, Pricing>;

// Map VS Code message roles to DeepSeek API roles
function convertMessages(messages: readonly vscode.LanguageModelChatRequestMessage[]) {
  return messages.map(msg => {
    let role: string;
    switch (msg.role) {
      case vscode.LanguageModelChatMessageRole.User:
        role = 'user';
        break;
      case vscode.LanguageModelChatMessageRole.Assistant:
        role = 'assistant';
        break;
      default:
        role = 'system';
        break;
    }
    return {
      role,
      content: msg.content
        .filter(p => p instanceof vscode.LanguageModelTextPart)
        .map(p => (p as vscode.LanguageModelTextPart).value)
        .join(''),
    };
  });
}

export class DeepSeekProvider implements vscode.LanguageModelChatProvider {
  private sessionSpendUSD = 0;
  private readonly DAILY_BUDGET = 1.0; // $1/day = $20/20days
  private readonly DEFAULT_MAX_INPUT_TOKENS = 4000;
  private outputChannel: vscode.OutputChannel;

  // Default pricing per 1M tokens (cache miss). Updated by refreshPricing()
  // Source: https://api-docs.deepseek.com/quick_start/pricing
  private pricing: PricingMap = {
    'deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'deepseek-v4-pro': { input: 0.435, output: 0.87 }
  };

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('DeepSeek');
    this.outputChannel.appendLine('DeepSeek provider initialized');
  }

  private getMaxInputTokens(): number {
    return this.context.globalState.get<number>('deepseek.maxInputTokens') ?? this.DEFAULT_MAX_INPUT_TOKENS;
  }

  async provideLanguageModelChatInformation(
    options: { silent: boolean },
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelChatInformation[]> {
    const maxInputTokens = this.getMaxInputTokens();
    return [
      {
        id: 'deepseek-v4-flash',
        name: 'DeepSeek V4-Flash',
        family: 'deepseek',
        version: '1.0.0',
        maxInputTokens,
        maxOutputTokens: 1000,
        capabilities: { toolCalling: true, imageInput: false },
      },
      {
        id: 'deepseek-v4-pro',
        name: 'DeepSeek V4 Pro (Thinking)',
        family: 'deepseek',
        version: '1.0.0',
        maxInputTokens,
        maxOutputTokens: 1000,
        capabilities: { toolCalling: true, imageInput: false },
        detail: 'Extended reasoning mode with step-by-step thinking',
      },
    ];
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    _options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (this.sessionSpendUSD >= this.DAILY_BUDGET) {
      throw new Error(`Daily budget hit: $${this.sessionSpendUSD.toFixed(2)}/$${this.DAILY_BUDGET}. Resets tomorrow or restart VSCode.`);
    }

    const apiKey = await this.context.secrets.get('deepseek.apiKey');
    if (!apiKey) {
      throw new Error('No DeepSeek API key set. Run "DeepSeek: Set API Key"');
    }

    const baseUrl = vscode.workspace.getConfiguration().get<string>('deepseek.baseUrl') ?? 'https://api.deepseek.com';
    const body = {
      model: model.id,
      messages: convertMessages(messages),
      stream: true,
      stream_options: { include_usage: true } // Request usage stats from DeepSeek
    };

    const abortController = new AbortController();

    // Set a 120s timeout to prevent hanging requests
    const REQUEST_TIMEOUT_MS = 120_000;
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
    token.onCancellationRequested(() => abortController.abort());

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok || !response.body) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    // Stream SSE chunks + track usage
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;
    const MAX_BUFFER_SIZE = 1_000_000; // 1MB safety limit for malformed streams

    try {
      while (true) {
        if (token.isCancellationRequested) {
          await reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        // eslint-disable-next-line curly
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Safety: prevent unbounded buffer growth from streams missing newlines
        if (buffer.length > MAX_BUFFER_SIZE) {
          await reader.cancel();
          throw new Error('Stream buffer exceeded 1MB limit. Aborting to prevent memory exhaustion.');
        }

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          // eslint-disable-next-line curly
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            const text = chunk.choices?.[0]?.delta?.content;
            // eslint-disable-next-line curly
            if (text) progress.report(new vscode.LanguageModelTextPart(text));

            // DeepSeek sends usage in the last chunk when stream_options.include_usage = true
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0;
              outputTokens = chunk.usage.completion_tokens ?? 0;
            }
          } catch { /* ignore malformed chunks */ }
        }
      }
    } finally {
      // Always release the reader lock to prevent resource leaks
      reader.releaseLock();
    }

    // Calculate and show cost after stream ends
    if (inputTokens > 0 || outputTokens > 0) {
      this.addCost(inputTokens, outputTokens, model.id);
      if (this.sessionSpendUSD >= this.DAILY_BUDGET * 0.9) {
        vscode.window.showWarningMessage(`90% of daily budget used: $${this.sessionSpendUSD.toFixed(2)}`);
      }
    }
  }

  // VSCode calls this to estimate token count before sending to the model.
  // Used for UI warnings like "This prompt is very long" and to enforce maxInputTokens.
  // DeepSeek has no public tokenizer, so we use a rough 4-chars-per-token estimate.
  async provideTokenCount(
    _model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    _token: vscode.CancellationToken
  ): Promise<number> {
    const content = typeof text === 'string'
      ? text
      : text.content.filter(p => p instanceof vscode.LanguageModelTextPart)
        .map(p => (p as vscode.LanguageModelTextPart).value)
        .join('');
    // Rough estimate: 1 token ≈ 4 characters for English/code
    return Math.ceil(content.length / 4);
  }

  // --- NEW METHODS FOR COMMANDS ---

  async getSessionSpend(): Promise<number> {
    return this.sessionSpendUSD;
  }

  async getCurrentPricing(): Promise<PricingMap> {
    return this.pricing;
  }

  async refreshPricing(): Promise<void> {
    // DeepSeek has no pricing API yet. Using hardcoded values from docs.
    // Source: https://api-docs.deepseek.com/quick_start/pricing
    this.pricing = {
      'deepseek-v4-flash': { input: 0.14, output: 0.28 },
      'deepseek-v4-pro': { input: 0.435, output: 0.87 }
    };
    this.outputChannel.appendLine(`Pricing refreshed: ${JSON.stringify(this.pricing)}`);
  }

  async getStoredMaxInputTokens(): Promise<number> {
    return this.getMaxInputTokens();
  }

  private addCost(inputTokens: number, outputTokens: number, modelId: string) {
    const p = this.pricing[modelId] ?? { input: 0, output: 0 };
    const cost = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
    this.sessionSpendUSD += cost;

    const msg = `$(credit-card) DeepSeek: $${this.sessionSpendUSD.toFixed(4)} | Last: ${inputTokens}in+${outputTokens}out = $${cost.toFixed(6)}`;
    vscode.window.setStatusBarMessage(msg, 5000);
    this.outputChannel.appendLine(`[${modelId}] ${inputTokens} input, ${outputTokens} output, $${cost.toFixed(6)}. Total: $${this.sessionSpendUSD.toFixed(4)}`);
  }
}