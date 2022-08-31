const vscode = require('vscode');
const util = require('./util.js');

let fsWatcher;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	fsWatcher = vscode.workspace.createFileSystemWatcher('**/modules/*');
	fsWatcher.onDidChange(uri => util.moduleChanged(uri));
	fsWatcher.onDidCreate(uri => util.moduleAdded(uri));
	fsWatcher.onDidDelete(uri => util.moduleDeleted(uri));
	await util.setInitialModuleMap();
	console.log('Revature style guide enabled.');

	let addTopicCmd = vscode.commands.registerCommand('revature-style-guide.createTopic', async function () {

		let allModules = mapKeysToArray(util.moduleMap);
		allModules.push('+ Create New Module');
		let moduleName = await util.askChoice("Module Name?", allModules);

		if (moduleName === '+ Create New Module') {
			moduleName = await util.askQuestion('New Module Name?');
		}
		if (moduleName === undefined) return;

		let numberOfTopics = Number.parseInt(await util.askQuestion("How many topics do you want to create?"));
		if (isNaN(numberOfTopics) || numberOfTopics <= 0) return;
		
		let successes = 0;
		for (let i = 0; i < numberOfTopics; i++) {
			let result = await addTopic(moduleName);
			if (result === undefined) return;
			successes += result ? 1 : 0;
		}

		let failures = numberOfTopics - successes;
		util.say(`Successfully created ${successes} topic${successes == 1 ? '': 's'} with ${failures} failure${failures == 1 ? '': 's'}.`);
	});

	let addModuleCmd = vscode.commands.registerCommand('revature-style-guide.createModule', async function () {
		let moduleName = await util.askQuestion('New Module Name?');
		if (moduleName === undefined) return;

		moduleName = util.convertHumanReadableToName(
			util.titleCapitalize(util.convertNameToHumanReadable(moduleName)));
		let success = await util.createModule(moduleName);
		if (success) {
			util.say('Module created successfully.');
		}
		else {
			util.sayError('Error: Module was not created because it already exists.');
		}

	});

	context.subscriptions.push(addTopicCmd);
	context.subscriptions.push(addModuleCmd);
}

function deactivate() {
	fsWatcher.dispose();
}

/**
 * @param {string} moduleName 
 * @returns 
 */
async function addTopic(moduleName) {
	let topicName = await util.askQuestion("Topic Name?");
	if (topicName === undefined) return;
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
