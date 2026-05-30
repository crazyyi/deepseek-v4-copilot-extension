# DeepSeek Safe for VSCode

Use DeepSeek V4-Flash and V4 Pro directly in GitHub Copilot Chat with real-time cost control.

DeepSeek delivers GPT-4 class coding at 1/10th the price. This extension makes it safe to use daily by tracking every token and stopping runaway bills.

## Why DeepSeek Safe

| vs. ChatGPT/Claude | DeepSeek Safe Advantage |
| --- | --- |
| $10-20 per 1M tokens | **$0.14 per 1M tokens** for V4-Flash |
| No cost visibility | **Live spend in status bar** after each message |
| Risk of surprise bills | **Hard daily budget cap** - extension blocks calls at $1/day |
| Vendor lock-in | **Your API key, your data**. Keys stored in OS Keychain, never sent to us |

**Key benefits:**
1. **95% cheaper** than GPT-4o for code tasks
2. **Zero-trust security**: API key never leaves your machine. Uses VSCode SecretStorage
3. **Spend guardrails**: Set 4000 input / 1000 output limits. See cost before you hit enter
4. **Two models**: `V4-Flash` for fast code, `V4 Pro` for deep reasoning with chain-of-thought

## Setup - 60 seconds

**1. Install**  
Install from VSCode Marketplace. Reload VSCode.

**2. Add API key**  
`Cmd+Shift+P` → `DeepSeek: Set API Key` → paste your key from platform.deepseek.com/api_keys

Your key is saved to Windows Credential Manager / macOS Keychain / Linux Secret Service. We can't read it.

**3. Start chatting**  
Open Copilot Chat `Ctrl+Cmd+I` → Click model dropdown → Select `DeepSeek V4-Flash`.

Done. Ask it to refactor code, explain errors, or write tests.

## Usage

### **Daily workflow**
1. Select code in editor → right-click → `Copilot: Explain This` → uses DeepSeek
2. Check cost: Look at VSCode status bar: `$(credit-card) DeepSeek: $0.0023`
3. Budget hit? Extension blocks new messages at $1.00/day and shows reset time

### **Commands**
| Command | Purpose |
| --- | --- |
| `DeepSeek: Set API Key` | Save/update key. Stored encrypted by OS. |
| `DeepSeek: Test API Key` | Verify key works. Shows `sk-xxx...x123` masked. |
| `DeepSeek: Show Session Spend` | Popup with total cost + current DeepSeek rates. |
| `DeepSeek: Refresh Pricing` | Sync latest $/token from DeepSeek docs. |

### **Cost control defaults**
Extension ships with safe limits to keep you under $20/month:

- **Max input: 4000 tokens** ≈ 3 pages of code. Prevents accidental 100k token pastes.
- **Max output: 1000 tokens** ≈ 70 lines of code. Stops runaway essays.
- **Daily cap: $1.00**. At 500 messages/day this is $0.002/message.

Change limits: Settings → `deepseek.maxInputTokens`

### **Best practices for big files**
DeepSeek has 64k context, but 4k in/1k out keeps costs low.

1. **Don't paste whole files**. Select the function → Copilot Chat → "Fix bug in this".
2. **Ask for diffs**: "Return a unified diff, not full file". 10x cheaper.
3. **One bug per message**: "Fix the race condition" not "fix everything".
4. **Use V4-Flash 95% of time**. Switch to V4 Pro only for complex algorithms.

## FAQ

**Q: Is my code sent to DeepSeek?**  
A: Yes, like all Copilot Chat models. Only the text you submit. Use `.gitignore` and don't send secrets. DeepSeek's API policy: no training on your data.

**Q: What happens at $1.00?**  
A: Extension throws `Daily budget $1.00 hit`. Resets when you restart VSCode. Prevents $100 accidents.

**Q: Can I increase limits?**  
A: Yes. Set `deepseek.maxOutputTokens: 4096` for ~300 line answers. Cost: $0.0017/message on Flash = $0.85/day at 500 msgs.

**Q: V4-Flash vs V4 Pro?**  
A: Flash = fast, cheap, great for coding. Pro = slower, 5x cost, uses reasoning traces. Use Pro only when Flash fails.

## Privacy & Security

1. **API key**: Stored via `vscode.SecretStorage`. Encrypted at rest by your OS. We never see it.
2. **Telemetry**: None. Extension makes zero network calls except to `api.deepseek.com`.
3. **Code**: Open source MIT. Audit it: github.com/yourname/deepseek-safe

## License
MIT © 2026 Your Name

---

**Star us on GitHub if this saved you money.** Issues? github.com/yourname/deepseek-safe/issues