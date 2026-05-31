# DeepSeek V4 Copilot Extension

Use DeepSeek V4-Flash and V4 Pro directly in GitHub Copilot Chat with real-time cost control.

DeepSeek delivers GPT-4 class coding at 1/10th the price. This extension makes it safe to use daily by tracking every token and stopping runaway bills.

---

## Why DeepSeek V4 Copilot Extension?

| vs. ChatGPT/Claude | DeepSeek V4 Copilot Advantage |
| --- | --- |
| $10–20 per 1M tokens | **$0.14 per 1M tokens** for V4-Flash |
| No cost visibility | **Live spend in status bar** after each message |
| Risk of surprise bills | **Hard daily budget cap** — extension blocks calls at $1/day |
| Vendor lock-in | **Your API key, your data.** Keys stored in OS Keychain, never sent to us |

**Key benefits:**

1. **95% cheaper** than GPT-4o for code tasks
2. **Zero-trust security**: API key never leaves your machine. Uses VSCode SecretStorage
3. **Spend guardrails**: Set 4000 input / 1000 output token limits. See cost before you hit enter
4. **Two models**: `V4-Flash` for fast code, `V4 Pro` for deep reasoning with chain-of-thought

---

## Installation

### Step 1 — Install the extension

Install **DeepSeek V4 Copilot Extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com).

After installation, reload VS Code when prompted.

> **Prerequisite**: You need [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed and active. DeepSeek models appear in the Copilot Chat model picker.

### Step 2 — Get a DeepSeek API key

1. Go to [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Sign up or log in
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

The extension ships with safe limits to keep you under $20/month:

| Setting | Default | What it prevents |
| --- | --- | --- |
| `deepseek.maxInputTokens` | 4000 tokens | Accidental 100k token pastes (≈ 3 pages of code) |
| `deepseek.maxOutputTokens` | 1000 tokens | Runaway long responses (≈ 70 lines of code) |
| Daily cap | $1.00 | At 500 messages/day this is $0.002/message |

To change limits: **Settings** → search `deepseek.maxInputTokens` or `deepseek.maxOutputTokens`.

### Best practices for big files

DeepSeek supports 64k context, but keeping to 4k in / 1k out keeps costs low:

1. **Don't paste whole files.** Select the specific function → Copilot Chat → "Fix bug in this"
2. **Ask for diffs**: "Return a unified diff, not the full file" — 10x cheaper
3. **One bug per message**: "Fix the race condition" not "fix everything"
4. **Use V4-Flash 95% of the time.** Switch to V4 Pro only for complex algorithms or reasoning tasks

---

## FAQ

**Q: Is my code sent to DeepSeek?**
A: Yes, like all Copilot Chat models — only the text you explicitly submit. Use `.gitignore` and avoid sending secrets. DeepSeek's API policy states no training on your data.

**Q: What happens when I hit $1.00?**
A: The extension throws `Daily budget $1.00 hit` and blocks new requests. It resets when you restart VS Code. This prevents accidental $100+ bills.

**Q: Can I increase the limits?**
A: Yes. Set `deepseek.maxOutputTokens: 4096` for responses up to ~300 lines. Cost: ~$0.0017/message on Flash = ~$0.85/day at 500 messages.

**Q: V4-Flash vs V4 Pro — which should I use?**
A: Flash is fast, cheap, and great for everyday coding tasks. Pro is slower and 5x the cost but uses chain-of-thought reasoning traces. Use Pro only when Flash gives unsatisfactory results.

**Q: Do I need a GitHub Copilot subscription?**
A: Yes. This extension adds DeepSeek as a language model provider inside GitHub Copilot Chat. An active Copilot subscription is required.

---

## Privacy & Security

1. **API key**: Stored via `vscode.SecretStorage`. Encrypted at rest by your OS. Never visible to this extension's authors.
2. **Telemetry**: None. The extension makes zero network calls except directly to `api.deepseek.com`.
3. **Open source**: MIT licensed. Audit the full source at [github.com/crazyyi/deepseek-v4-copilot-extension](https://github.com/crazyyi/deepseek-v4-copilot-extension).

---

## License

MIT © 2026

---

**Found this useful? [Star the repo on GitHub](https://github.com/crazyyi/deepseek-v4-copilot-extension) — it helps others discover it.**

Issues or feature requests? [Open an issue](https://github.com/crazyyi/deepseek-v4-copilot-extension/issues).