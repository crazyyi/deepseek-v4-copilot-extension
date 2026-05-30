import * as vscode from 'vscode';
import { DeepSeekProvider } from './provider';

const SECRET_KEY = 'deepseek.apiKey';

export function activate(context: vscode.ExtensionContext) {
	const provider = new DeepSeekProvider(context);

	context.subscriptions.push(
		vscode.lm.registerLanguageModelChatProvider('deepseek', provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('deepseek.setApiKey', async () => {
			const key = await vscode.window.showInputBox({
				prompt: 'Enter your DeepSeek API key (starts with sk-)',
				password: true,
				ignoreFocusOut: true,
			});
			if (key) {
				await context.secrets.store(SECRET_KEY, key);
				vscode.window.showInformationMessage('DeepSeek API key saved. Models are now available in Copilot Chat.');
				// Safe refresh - ignore if command doesn't exist
				try {
					await vscode.commands.executeCommand('workbench.action.chat.refreshModelPicker');
				} catch { /* VSCode <1.93 doesn't have this */ }
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('deepseek.testApiKey', async () => {  // Fixed: was deepseekSafe
			const apiKey = await context.secrets.get(SECRET_KEY);
			if (!apiKey) {
				vscode.window.showErrorMessage('No API key set. Run "DeepSeek: Set API Key"');  // Fixed message
				return;
			}

			const masked = `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;

			try {
				const res = await fetch('https://api.deepseek.com/v1/models', {
					headers: { 'Authorization': `Bearer ${apiKey}` }
				});
				if (res.ok) {
					vscode.window.showInformationMessage(`API key valid: ${masked}`);
				} else {
					vscode.window.showErrorMessage(`API key invalid: ${masked} | HTTP ${res.status}`);
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Can't reach DeepSeek: ${e.message}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('deepseek.showSpend', async () => {
			const spend = await provider.getSessionSpend();
			const pricing = await provider.getCurrentPricing();

			const msg = `Session spend: $${spend.toFixed(4)} USD\n\nCurrent rates:\nChat in: $${pricing['deepseek-chat'].input}/M  out: $${pricing['deepseek-chat'].output}/M\nReasoner in: $${pricing['deepseek-reasoner'].input}/M  out: $${pricing['deepseek-reasoner'].output}/M`;

			vscode.window.showInformationMessage(msg, { modal: true });
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('deepseek.refreshPricing', async () => {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Refreshing DeepSeek pricing...",
				cancellable: false
			}, async () => {
				try {
					await provider.refreshPricing();
					vscode.window.showInformationMessage('DeepSeek pricing updated');
				} catch (e: any) {
					vscode.window.showErrorMessage(`Failed to refresh pricing: ${e.message}`);
				}
			});
		})
	);
}

export function deactivate() { }