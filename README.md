# DeepSeek V4 Copilot Extension

Use DeepSeek V4-Flash and V4 Pro directly in GitHub Copilot Chat with real-time cost control.

DeepSeek delivers GPT-4 class coding at a fraction of the price. This extension makes it safe to use daily by tracking every token and stopping runaway bills.

---

## Why DeepSeek V4 Copilot Extension?

| vs. ChatGPT/Claude | DeepSeek V4 Copilot Advantage |
| --- | --- |
| $10–30 per 1M output tokens | **$0.28 per 1M output tokens** for V4-Flash |
| No cost visibility | **Live spend in status bar** after each message |
| Risk of surprise bills | **Hard daily budget cap** — extension blocks calls at $1/day |
| Vendor lock-in | **Your API key, your data.** Keys stored in OS Keychain, never sent to us |

**Key benefits:**

1. **90–100× cheaper** than GPT-4o / Claude for most coding tasks
2. **Zero-trust security**: API key never leaves your machine. Uses VSCode SecretStorage
3. **Spend guardrails**: Set 4000 input / 1000 output token limits. See cost before you hit enter
4. **Two models**: `V4-Flash` for fast, cheap coding — `V4 Pro` for deep reasoning with chain-of-thought
5. **1M token context window** on both models — entire codebases fit in one request

---

## Installation

### Step 1 — Install the extension

Install **DeepSeek V4 Copilot Extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com).

After installation, reload VS Code when prompted.

> **Prerequisite**: You need [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed and active. DeepSeek models appear in the Copilot Chat model picker.

### Step 2 — Get a DeepSeek API key

1. Go to [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Sign up or log in (new accounts get 5M free tokens)
3. Create a new API key and copy it

### Step 3 — Add your API key to the extension

Open the Command Palette (`Cmd+Shift+P` on macOS / `Ctrl+Shift+P` on Windows/Linux) and run:

```
DeepSeek: Set API Key
```

Paste your key when prompted. It is saved immediately to your OS secure storage:
- **macOS**: Keychain
- **Windows**: Credential Manager
- **Linux**: Secret Service

The extension never transmits your key anywhere other than directly to `api.deepseek.com`.

### Step 4 — Start chatting

1. Open Copilot Chat: `Ctrl+Cmd+I` (macOS) / `Ctrl+Alt+I` (Windows/Linux)
2. Click the **model dropdown** at the top of the chat panel
3. Select **DeepSeek V4-Flash** or **DeepSeek V4 Pro**

You're ready. Ask it to refactor code, explain errors, write tests, or anything else.

---

## Model Reference

| | V4-Flash | V4 Pro |
| --- | --- | --- |
| **Best for** | Everyday coding, fast iteration | Complex algorithms, deep reasoning |
| **Context window** | 1M tokens | 1M tokens |
| **Max output** | 384K tokens | 384K tokens |
| **Input price** | $0.14 / 1M tokens | $0.435 / 1M tokens |
| **Output price** | $0.28 / 1M tokens | $0.87 / 1M tokens |
| **Reasoning mode** | Optional (thinking on/off) | Full chain-of-thought traces |
| **Architecture** | 284B MoE, 13B activated | 284B MoE, 13B activated |

> Prices are official DeepSeek API rates as of May 2026. V4 Pro pricing is permanent from June 2026 onward.

---

## Usage

### Daily workflow

1. Select code in the editor → open Copilot Chat → ask your question
2. Check cost in the VS Code status bar: `$(credit-card) DeepSeek: $0.0023`
3. If daily budget is hit, the extension blocks new messages and shows the reset time

### Commands

| Command | Purpose |
| --- | --- |
| `DeepSeek: Set API Key` | Save or update your API key. Stored encrypted by the OS. |
| `DeepSeek: Test API Key` | Verify your key works. Displays it masked as `sk-xxx...x123`. |
| `DeepSeek: Show Session Spend` | Popup showing total session cost + current DeepSeek rates. |
| `DeepSeek: Refresh Pricing` | Sync the latest $/token rates from DeepSeek. |

### Cost control defaults

The extension ships with conservative limits to keep you under $20/month:

| Setting | Default | What it prevents |
| --- | --- | --- |
| `deepseek.maxInputTokens` | 4000 tokens | Accidental massive pastes (both models support 1M but you pay per token) |
| `deepseek.maxOutputTokens` | 1000 tokens | Runaway long responses (≈ 70 lines of code) |
| Daily cap | $1.00 | At 500 messages/day this is ~$0.002/message on Flash |

To change limits: **Settings** → search `deepseek.maxInputTokens` or `deepseek.maxOutputTokens`.

> Both V4-Flash and V4 Pro support up to **1M input tokens** and **384K output tokens** natively — the extension defaults are intentionally conservative for cost control. Raise them freely once you're comfortable with your usage.

### Best practices for big files

While both models support a 1M token context window, keeping prompts focused keeps costs low:

1. **Select the relevant function**, not the whole file — you pay per token
2. **Ask for diffs**: "Return a unified diff, not the full file" — significantly cheaper than full-file responses
3. **One bug per message**: "Fix the race condition" not "fix everything"
4. **Use V4-Flash for most tasks.** Switch to V4 Pro only when you need deep reasoning or complex multi-step problem solving — it's about 3× the cost of Flash

---

## FAQ

**Q: Is my code sent to DeepSeek?**
A: Yes, like all Copilot Chat models — only the text you explicitly submit. Use `.gitignore` and avoid sending secrets. DeepSeek's API policy states no training on your data.

**Q: What happens when I hit $1.00?**
A: The extension blocks new requests and shows a `Daily budget $1.00 hit` message. It resets when you restart VS Code. This prevents accidental large bills.

**Q: Can I increase the limits?**
A: Yes. Set `deepseek.maxOutputTokens: 8192` for longer responses, or higher. Both models support up to 384K output tokens. Set `deepseek.maxInputTokens` up to the 1M context limit if needed.

**Q: V4-Flash vs V4 Pro — which should I use?**
A: Flash is fast, cheap ($0.14/$0.28 per 1M), and excellent for everyday coding tasks. Pro ($0.435/$0.87 per 1M) adds full chain-of-thought reasoning traces and performs better on complex multi-step problems. Use Flash by default and switch to Pro only when Flash falls short.

**Q: Do I need a GitHub Copilot subscription?**
A: Yes. This extension adds DeepSeek as a language model provider inside GitHub Copilot Chat. An active Copilot subscription is required.

**Q: Does DeepSeek offer a free tier?**
A: New API accounts receive 5 million free tokens to get started. After that, it's pay-per-use with no minimum spend or monthly fees.

---

## Privacy & Security

1. **API key**: Stored via `vscode.SecretStorage`. Encrypted at rest by your OS. Never visible to this extension's authors.
2. **Telemetry**: None. The extension makes zero network calls except directly to `api.deepseek.com`.
3. **Data routing**: DeepSeek's API infrastructure is based in China. All API requests route through DeepSeek's servers. Do not submit proprietary or sensitive code if this is a concern for your organisation.
4. **Open source**: MIT licensed. Audit the full source at [github.com/crazyyi/deepseek-v4-copilot-extension](https://github.com/crazyyi/deepseek-v4-copilot-extension).

---

## License

MIT © 2026

---

**Found this useful? [Star the repo on GitHub](https://github.com/crazyyi/deepseek-v4-copilot-extension) — it helps others discover it.**

Issues or feature requests? [Open an issue](https://github.com/crazyyi/deepseek-v4-copilot-extension/issues).