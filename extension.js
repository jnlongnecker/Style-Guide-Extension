const vscode = require('vscode');
const util = require('./util.js');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	await util.setInitialModuleMap();
	console.log('Revature style guide enabled.');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let addTopicCmd = vscode.commands.registerCommand('revature-style-guide.helloWorld', async function () {

		let allModules = mapKeysToArray(util.moduleMap);
		allModules.push('+ Create New Module');
		let moduleName = await util.askChoice("Module Name?", allModules);

		if (moduleName === '+ Create New Module') {
			moduleName = await util.askQuestion('New Module Name?');
		}

		let numberOfTopics = Number.parseInt(await util.askQuestion("How many topics do you want to create?"));
		for (let i = 0; i < numberOfTopics; i++) {
			await addTopic(moduleName);
		}
	});

	context.subscriptions.push(addTopicCmd);
}

// this method is called when your extension is deactivated
function deactivate() {}

/**
 * @param {string} moduleName 
 * @returns 
 */
async function addTopic(moduleName) {
	let topicName = await util.askQuestion("Topic Name?");
	return util.createTopic(moduleName, topicName);
}

/**
 * 
 * @param {Object} map 
 * @returns {string[]}
 */
function mapKeysToArray(map) {
	let array = [];
	for (let key in map) {
		array.push(key);
	}
	return array;
}

module.exports = {
	activate,
	deactivate
}
