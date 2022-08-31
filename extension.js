const vscode = require('vscode');
const util = require('./util.js');

let moduleWatcher;
let topicWatcher;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	// File watcher for modules
	moduleWatcher = vscode.workspace.createFileSystemWatcher('**/modules/*');
	moduleWatcher.onDidChange(uri => util.moduleChanged(uri));
	moduleWatcher.onDidCreate(uri => util.moduleAdded(uri));
	moduleWatcher.onDidDelete(uri => util.moduleDeleted(uri));

	// File watcher for topics
	topicWatcher = vscode.workspace.createFileSystemWatcher('**/modules/*/*')
	topicWatcher.onDidChange(uri => util.updateTopicNumbers(uri));
	topicWatcher.onDidCreate(uri => util.updateTopicNumbers(uri));
	topicWatcher.onDidDelete(uri => util.updateTopicNumbers(uri));

	// Build the map of modules
	await util.setInitialModuleMap();
	console.log('Revature style guide enabled.');

	/**
	 * Command Palette command to create a topic
	 */
	let addTopicCmd = vscode.commands.registerCommand('revature-style-guide.createTopic', async function () {

		let allModules = mapKeysToArray(util.moduleMap);
		allModules.push('+ Create New Module');

		// Gather input
		let moduleName = await util.askChoice("Module Name?", allModules);

		if (moduleName === '+ Create New Module') {
			moduleName = await util.askQuestion('New Module Name?');
		}
		if (moduleName === undefined) return;

		let numberOfTopics = Number.parseInt(await util.askQuestion("How many topics do you want to create?"));
		if (isNaN(numberOfTopics) || numberOfTopics <= 0) return;
		
		let successes = 0;

		// Create desired number of topics
		for (let i = 0; i < numberOfTopics; i++) {
			let result = await addTopic(moduleName);
			if (result === undefined) return;
			successes += result ? 1 : 0;
		}

		// Display results
		let failures = numberOfTopics - successes;
		util.say(`Successfully created ${successes} topic${successes == 1 ? '': 's'} with ${failures} failure${failures == 1 ? '': 's'}.`);
	});

	/**
	 * Command Palette command to create a module
	 */
	let addModuleCmd = vscode.commands.registerCommand('revature-style-guide.createModule', async function () {

		// Gather input
		let moduleName = await util.askQuestion('New Module Name?');
		if (moduleName === undefined) return;

		// Convert input module name to the proper format to create a file system directory
		moduleName = util.convertHumanReadableToName(
			util.titleCapitalize(util.convertNameToHumanReadable(moduleName)));
		let success = await util.createModule(moduleName);

		// Display results
		if (success) {
			util.say('Module created successfully.');
		}
		else {
			util.sayError('Error: Module was not created because it already exists.');
		}

	});

	let updateProject = vscode.commands.registerCommand('revature-style-guide.updateProject', util.adhereProjectToStyleGuide);

	context.subscriptions.push(addTopicCmd);
	context.subscriptions.push(addModuleCmd);
	context.subscriptions.push(updateProject);
}

// Dispose the file watchers when extension is deactivated
function deactivate() {
	moduleWatcher.dispose();
	topicWatcher.dispose();
}

/**
 * Asks for a topic name and creates it in the file system
 * @param {string} moduleName 
 * @returns 
 */
async function addTopic(moduleName) {
	let topicName = await util.askQuestion("Topic Name?");
	if (topicName === undefined) return;
	return util.createTopic(moduleName, topicName);
}

/**
 * Takes the keys in a map and stores them in an array
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
