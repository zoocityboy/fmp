import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import { Constants } from '../../models/constants';

suite('Extension Test Suite', () => {
	void vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
	
	test('Load config', () => {
		const value = vscode.workspace.getConfiguration().get(Constants.gmaConfigBuildSelectedApplication);
		assert.equal(value, Constants.defaultAppKey);
	});
});
