import { vi } from 'vitest';
import * as assert from 'assert';
import * as sinon from 'sinon';

// ✅ hoisted so vi.mock factory can reference it
const mockProviderInstance = {
	getSessionSpend: vi.fn().mockResolvedValue(0),
	getCurrentPricing: vi.fn().mockResolvedValue({
		'deepseek-v4-flash': { input: 0.14, output: 0.28 },
		'deepseek-v4-pro': { input: 0.435, output: 0.87 }
	}),
	refreshPricing: vi.fn().mockResolvedValue(undefined),
	getStoredMaxInputTokens: vi.fn().mockResolvedValue(4000),
};

vi.mock('vscode', () => {
	const CancellationTokenSource = vi.fn(function (this: any) {
		this.token = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
		this.cancel = vi.fn();
		this.dispose = vi.fn();
	});
	return {
		lm: { registerLanguageModelChatProvider: vi.fn() },
		commands: { registerCommand: vi.fn(), executeCommand: vi.fn() },
		window: {
			showInputBox: vi.fn(),
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			withProgress: vi.fn(),
			createStatusBarItem: vi.fn(() => ({ command: '', text: '', tooltip: '', show: vi.fn() })),
		},
		Uri: {
			file: vi.fn((path: string) => ({ fsPath: path, toString: () => path })),
			parse: vi.fn(),
		},
		CancellationTokenSource,
		ProgressLocation: {
			Notification: 15,
			Window: 10,
			SourceControl: 1,
		},
		StatusBarAlignment: {
			Left: 0,
			Right: 1,
		},
	};
});

vi.mock('../provider', () => {
	// ✅ real constructor function so `new DeepSeekProvider()` works
	const DeepSeekProvider = vi.fn(function (this: any) {
		Object.assign(this, mockProviderInstance);
	});
	return { DeepSeekProvider };
});

import * as vscode from 'vscode';
import { activate } from '../extension';
import { DeepSeekProvider } from '../provider';

describe('DeepSeek Extension Tests', () => {
	let context: vscode.ExtensionContext;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		// reset all mock provider methods before each test
		mockProviderInstance.getSessionSpend.mockReset().mockResolvedValue(0);
		mockProviderInstance.getCurrentPricing.mockReset().mockResolvedValue({
			'deepseek-v4-flash': { input: 0.14, output: 0.28 },
			'deepseek-v4-pro': { input: 0.435, output: 0.87 }
		});
		mockProviderInstance.refreshPricing.mockReset().mockResolvedValue(undefined);
		mockProviderInstance.getStoredMaxInputTokens.mockReset().mockResolvedValue(4000);

		context = {
			subscriptions: [],
			secrets: {
				get: sandbox.stub(),
				store: sandbox.stub(),
				delete: sandbox.stub(),
				onDidChange: sandbox.stub()
			},
			globalState: { get: sandbox.stub(), update: sandbox.stub() },
			extensionUri: vscode.Uri.file(__dirname)
		} as unknown as vscode.ExtensionContext;

		sandbox.stub(vscode.lm, 'registerLanguageModelChatProvider');
		sandbox.stub(vscode.commands, 'registerCommand').callsFake(() => ({ dispose: () => { } }));
		sandbox.stub(vscode.commands, 'executeCommand');
		sandbox.stub(vscode.window, 'showInputBox');
		sandbox.stub(vscode.window, 'showInformationMessage');
		sandbox.stub(vscode.window, 'showErrorMessage');
		sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts, task) => {
			return task({ report: () => { } }, new vscode.CancellationTokenSource().token);
		});

		global.fetch = sandbox.stub() as any;
	});

	afterEach(() => {
		sandbox.restore();
		vi.clearAllMocks();
	});

	test('activate registers language model provider', () => {
		activate(context);
		const stub = vscode.lm.registerLanguageModelChatProvider as sinon.SinonStub;
		assert.ok(stub.calledOnce);
		assert.strictEqual(stub.firstCall.args[0], 'deepseek');
	});

	test('activate registers all 5 commands', () => {
		activate(context);
		const reg = vscode.commands.registerCommand as sinon.SinonStub;
		assert.strictEqual(reg.callCount, 5);
		const cmds = reg.getCalls().map(c => c.args[0]);
		assert.deepStrictEqual(cmds, [
			'deepseek.setApiKey',
			'deepseek.testApiKey',
			'deepseek.showSpend',
			'deepseek.refreshPricing',
			'deepseek.setMaxInputTokens'
		]);
	});

	test('deepseek.setApiKey saves key and refreshes model picker', async () => {
		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setApiKey')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves('sk-test1234567890');
		await cb();

		assert.ok((context.secrets.store as sinon.SinonStub).calledWith('deepseek.apiKey', 'sk-test1234567890'));
		assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith(
			'DeepSeek API key saved. Models are now available in Copilot Chat.'
		));
		assert.ok((vscode.commands.executeCommand as sinon.SinonStub).calledWith(
			'workbench.action.chat.refreshModelPicker'
		));
	});

	test('deepseek.setApiKey ignores if user cancels input', async () => {
		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setApiKey')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves(undefined);
		await cb();

		assert.ok((context.secrets.store as sinon.SinonStub).notCalled);
	});

	test('deepseek.testApiKey shows valid message on 200', async () => {
		(context.secrets.get as sinon.SinonStub).resolves('sk-1234567890abcdef');
		(global.fetch as sinon.SinonStub).resolves({ ok: true, status: 200 });

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.testApiKey')!.args[1];

		await cb();

		assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith(
			'API key valid: sk-1234...cdef'
		));
	});

	test('deepseek.testApiKey shows error if no key set', async () => {
		(context.secrets.get as sinon.SinonStub).resolves(undefined);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.testApiKey')!.args[1];

		await cb();

		assert.ok((vscode.window.showErrorMessage as sinon.SinonStub).calledWith(
			'No API key set. Run "DeepSeek: Set API Key"'
		));
	});

	test('deepseek.testApiKey shows invalid on 401', async () => {
		(context.secrets.get as sinon.SinonStub).resolves('sk-badkey1234567890');
		(global.fetch as sinon.SinonStub).resolves({ ok: false, status: 401 });

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.testApiKey')!.args[1];

		await cb();

		assert.ok((vscode.window.showErrorMessage as sinon.SinonStub).calledWith(
			'API key invalid: sk-badk...7890 | HTTP 401'
		));
	});

	test('deepseek.testApiKey handles fetch network error', async () => {
		(context.secrets.get as sinon.SinonStub).resolves('sk-1234567890abcdef');
		(global.fetch as sinon.SinonStub).rejects(new Error('ECONNREFUSED'));

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.testApiKey')!.args[1];

		await cb();

		assert.ok((vscode.window.showErrorMessage as sinon.SinonStub).calledWith(
			"Can't reach DeepSeek: ECONNREFUSED"
		));
	});

	test('deepseek.showSpend displays pricing info', async () => {
		mockProviderInstance.getSessionSpend.mockResolvedValue(0.1234);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.showSpend')!.args[1];

		await cb();

		const msg = (vscode.window.showInformationMessage as sinon.SinonStub).firstCall.args[0];
		assert.ok(msg.includes('Session spend: $0.1234 USD'));
		assert.ok(msg.includes('V4-Flash in: $0.14/M'));
		assert.ok(msg.includes('V4-Pro in: $0.435/M'));
	});

	test('deepseek.refreshPricing calls provider.refreshPricing', async () => {
		mockProviderInstance.refreshPricing.mockResolvedValue(undefined);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.refreshPricing')!.args[1];

		await cb();

		assert.ok(mockProviderInstance.refreshPricing.mock.calls.length === 1);
		assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith(
			'DeepSeek pricing updated'
		));
	});

	test('deepseek.refreshPricing shows error on failure', async () => {
		mockProviderInstance.refreshPricing.mockRejectedValue(new Error('Network error'));

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.refreshPricing')!.args[1];

		await cb();

		assert.ok((vscode.window.showErrorMessage as sinon.SinonStub).calledWith(
			'Failed to refresh pricing: Network error'
		));
	});

	test('deepseek.setMaxInputTokens sets token value and saves to globalState', async () => {
		mockProviderInstance.getStoredMaxInputTokens.mockResolvedValue(4000);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setMaxInputTokens')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves('8000');
		await cb();

		assert.ok((context.globalState.update as sinon.SinonStub).calledWith('deepseek.maxInputTokens', 8000));
		assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith(
			'Max input tokens set to 8000'
		));
	});

	test('deepseek.setMaxInputTokens shows current value in input box', async () => {
		mockProviderInstance.getStoredMaxInputTokens.mockResolvedValue(6000);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setMaxInputTokens')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves('6000');
		await cb();

		const inputBoxCall = (vscode.window.showInputBox as sinon.SinonStub).firstCall.args[0];
		assert.strictEqual(inputBoxCall.value, '6000');
	});

	test('deepseek.setMaxInputTokens ignores if user cancels', async () => {
		mockProviderInstance.getStoredMaxInputTokens.mockResolvedValue(4000);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setMaxInputTokens')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves(undefined);
		await cb();

		assert.ok((context.globalState.update as sinon.SinonStub).notCalled);
		assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).notCalled);
	});

	test('deepseek.setMaxInputTokens validates input (rejects non-positive numbers)', async () => {
		mockProviderInstance.getStoredMaxInputTokens.mockResolvedValue(4000);

		activate(context);
		const cb = (vscode.commands.registerCommand as sinon.SinonStub)
			.getCalls().find(c => c.args[0] === 'deepseek.setMaxInputTokens')!.args[1];

		(vscode.window.showInputBox as sinon.SinonStub).resolves('4000');
		await cb();

		const inputBoxCall = (vscode.window.showInputBox as sinon.SinonStub).firstCall.args[0];
		const validator = inputBoxCall.validateInput;

		// Test valid input
		assert.strictEqual(validator('5000'), '');

		// Test invalid inputs
		assert.strictEqual(validator('0'), 'Enter a positive number');
		assert.strictEqual(validator('-100'), 'Enter a positive number');
		assert.strictEqual(validator('abc'), 'Enter a positive number');
		assert.strictEqual(validator(''), 'Enter a positive number');
	});
});