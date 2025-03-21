import * as assert from 'assert';
import { before } from 'mocha';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  before(() => {
    console.log('Starting extension tests');
  });

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(4));
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('YourName.nreviewcode'));
  });

  test('Review command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('extension.ollamaReviewCode'));
  });

  test('Generate command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('extension.ollamaGenerateCode'));
  });
});