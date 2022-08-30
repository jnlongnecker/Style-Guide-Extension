const vscode = require('vscode');
const fs = vscode.workspace.fs;
const root = vscode.workspace.workspaceFolders[0].uri.path;

let moduleMap = {};
let moduleCount = 0;
exports.moduleMap = moduleMap;

/**
 * 
 * @param {string} question 
 * @param {string} placeholder
 */
exports.askQuestion = async (question, placeholder = '') => {
    let options = {
        ignoreFocusOut: false,
        password: false,
        placeholder: placeholder,
        prompt: question
    }
    return await vscode.window.showInputBox(options);
}

/**
 * 
 * @param {string} question 
 * @param {string[]} choices 
 * @param {boolean} chooseMany 
 * @returns 
 */
exports.askChoice = async (question, choices, chooseMany = false) => {
    let options = {
        canPickMany: chooseMany,
        ignoreFocusOut: true,
        title: question
    }
    return await vscode.window.showQuickPick(choices, options);
}

/**
 * 
 * @param {string} moduleName
 * @param {string} topicName
 */
exports.createTopic = async (moduleName, topicName) => {
    let fsModuleName = convertHumanReadableToName(moduleName);
    let fsTopicName = convertHumanReadableToName(topicName);
    createModule(fsModuleName);
    
    fsModuleName = ensureModuleOrTopicNumber(fsModuleName, moduleCount);
    fsTopicName = ensureModuleOrTopicNumber(fsTopicName, ++moduleMap[fsModuleName]);
    moduleMap[moduleName]++;
    let topicPath = root + '\\modules\\' + fsModuleName + '\\' + fsTopicName;
    await fs.createDirectory(vscode.Uri.file(topicPath));
    //populateFiles(topicPath);
}

/**
 * 
 * @returns {Promise<string[]>}
 */
exports.getAllModuleNames = async () => {
    let files = await fs.readDirectory(vscode.Uri.file(root + '\\modules'));

    // Return just the module names
    return files.map(moduleName => moduleName[0]);
}

/**
 * 
 * @param {string[]} moduleList 
 * @returns {string[]}
 */
exports.prettifyModuleNames = moduleList => {
    return moduleList.map( module => convertNameToHumanReadable(module));
}


const populateFiles = async (moduleName, topicName, topicPath) => {

}

const createPrereqFile = async (topicName, topicPath) => {
    let prereqContent = `# ${topicName}: Prerequisites and Learning Objectives\n\n## Prerequisites`
}

/**
 * 
 * @param {string} moduleName 
 * @returns 
 */
const createModule = async moduleName => {
    if (moduleMap[moduleName] >= 1) return;
    moduleCount++;

    moduleName = ensureModuleOrTopicNumber(moduleName, moduleCount);
    moduleMap[moduleName] = 0;

    let moduleUri = vscode.Uri.file(root + '\\modules\\' + convertHumanReadableToName(moduleName));
    fs.createDirectory(moduleUri);
}

/**
 * 
 * @param {string} moduleOrTopicName 
 * @returns {string}
 */
const convertNameToHumanReadable = moduleOrTopicName => {
    return capitalizeAll(moduleOrTopicName.replaceAll('-', ' '));
}

/**
 * 
 * @param {string} moduleOrTopicName 
 * @returns {string}
 */
const convertHumanReadableToName = moduleOrTopicName => {
    return moduleOrTopicName.replaceAll(' ', '-');
}

/**
 * 
 * @param {string} phrase 
 * @returns {string}
 */
const capitalizeAll = (phrase) => {
    let allWords = phrase.split(' ');

    return allWords.reduce( 
        (runningTotal, currWord) => runningTotal + ' ' + smartCapitalize(currWord, runningTotal), '');
}

/**
 * 
 * @param {string} word 
 * @param {string} context 
 * @returns {string}
 */
const smartCapitalize = (word, context) => {
    // Capitalize the start always
    if (context.length == 0) return capitalize(word);
    if (context[context.length - 1] == ':') return capitalize(word);
    
    word = word.toLowerCase();
    switch(word) {
        // Keep certain words lowercase, capitalize the rest
        case 'a':
        case 'an':
        case 'and':
        case 'as':
        case 'at':
        case 'but':
        case 'by':
        case 'for':
        case 'from':
        case 'if':
        case 'in':
        case 'of':
        case 'on':
        case 'or':
        case 'so':
        case 'to':
            return word;
        default:
            return capitalize(word);
    }
}

/**
 * 
 * @param {string} word 
 * @returns {string}
 */
const capitalize = word => word[0].toUpperCase() + word.substring(1).toLowerCase()

/**
 * 
 */
exports.setInitialModuleMap = async () => {
	let allModules = await exports.getAllModuleNames();
	for (let module of allModules) {
		moduleMap[module] = await getTopicCountInModule(module);
        moduleCount++;
	}
}

const getTopicCountInModule = async (moduleName) => {
    let modulePath = root + '\\modules\\' + moduleName;
    let files = await fs.readDirectory(vscode.Uri.file(modulePath));
    return files.reduce((sum, value) => sum += value[1] == 2 ? 0 : 1, 0);
}

const ensureModuleOrTopicNumber = (name, number) => {

    if (Number.isInteger(name[0])) return;
    return number.toString().padStart(3, '0') + '-' + name;
}