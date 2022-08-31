const { start } = require('repl');
const vscode = require('vscode');
const fs = vscode.workspace.fs;
const root = vscode.workspace.workspaceFolders[0].uri.path;

let moduleMap = {};
let moduleCount = 0;
let rules = vscode.workspace.getConfiguration('rules');
let preambles = rules.get('preambles');
let fileContents = rules.get('files');
let styles = rules.get('style');

let restructuringModules = false;
let restructuringTopics = false;

let context = {
    topicName: '',
    moduleName: '',
    content001: '',
    content002: '',
    content003: '',
    content004: '',
    content005: ''
}

/**
 * Shows a message to the user
 * @param {string} phrase
 */
const say = async (phrase) => {
    await vscode.window.showInformationMessage(phrase);
}

/**
 * Shows an error message to the user
 * @param {string} phrase 
 */
const sayError = async (phrase) => {
    await vscode.window.showErrorMessage(phrase);
}

/**
 * Get user input from the input box
 * @param {string} question 
 * @param {string} placeholder
 */
const askQuestion = async (question, placeholder = '') => {
    let options = {
        ignoreFocusOut: false,
        password: false,
        placeholder: placeholder,
        prompt: question
    }
    return await vscode.window.showInputBox(options);
}

/**
 * Ask the user to pick from an array of choices
 * @param {string} question 
 * @param {string[]} choices 
 * @param {boolean} chooseMany 
 * @returns 
 */
const askChoice = async (question, choices, chooseMany = false) => {
    let options = {
        canPickMany: chooseMany,
        ignoreFocusOut: true,
        title: question
    }
    return await vscode.window.showQuickPick(choices, options);
}

/**
 * 
 * @param {vscode.Uri} changedTopicUri 
 */
const updateTopicNumbers = async (changedTopicUri) => {

    if (restructuringTopics) return;

    restructuringTopics = true;

    let topicPath = changedTopicUri.path;
    let changedTopicModulePath = topicPath.substring(0, topicPath.lastIndexOf('/'));
    let moduleUri = vscode.Uri.file(changedTopicModulePath);

    await updateNumbersInDirectory(moduleUri);

    restructuringTopics = false;
}

/**
 * Updates all the module numbers to accommodate the changed module
 */
const updateModuleNumbers = async () => {

    restructuringModules = true;

    let moduleUri = vscode.Uri.file(root + '\\modules');
    clearModuleMap();
    await updateNumbersInDirectory(moduleUri);
    await buildModuleMap();

    restructuringModules = false;
}

const updateNumbersInDirectory = async (directoryUri) => {
    let files = await fs.readDirectory(directoryUri);
    let count = 0;
    for (let file of files) {
        let fileName = file[0];
        if (!startsWithNumber(fileName)) continue;
        count++;
        let newName = convertHumanReadableToName(titleCapitalize(convertNameToHumanReadable(fileName)));
        newName = ensureModuleOrTopicNumber(newName.substring(newName.indexOf('-') + 1), count);
        await fs.rename(vscode.Uri.file(directoryUri.path + '\\' + fileName), vscode.Uri.file(directoryUri.path + '\\' + newName));
    }
}

/**
 * Responds to a change in the modules directory
 * @param {vscode.Uri} changedUri 
 * @returns 
 */
const moduleChanged = async changedUri => {
    if (restructuringModules) return;
    let changedModuleName = changedUri.path.substring(changedUri.path.lastIndexOf('/') + 1);
    let moduleNumber = Number.parseInt(changedModuleName.substring(0, 3));
    if (!restructureNeeded(moduleNumber)) return;

    await updateModuleNumbers();
}

/**
 * Responds to a new addition to the modules directory
 * @param {vscode.Uri} changedUri 
 * @returns 
 */
const moduleAdded = async changedUri => {
    if (restructuringModules) return;
    let changedModuleName = changedUri.path.substring(changedUri.path.lastIndexOf('/') + 1);
    let moduleNumber = Number.parseInt(changedModuleName.substring(0, 3));

    if (!moduleNumber) return;

    let mapName = convertToMapModuleName(changedModuleName);
    let inMap = moduleMap[mapName] !== undefined;
    if (!inMap) {
        await addModuleToMap(changedModuleName);
        console.log("Added manually created module to map");
    }

    if (!restructureNeeded(moduleNumber)) return;

    await updateModuleNumbers();
}

/**
 * Responds to a deletion in the modules directory
 * @param {vscode.Uri} changedUri 
 * @returns 
 */
const moduleDeleted = async changedUri => {
    if (restructuringModules) return;
    let changedModuleName = changedUri.path.substring(changedUri.path.lastIndexOf('/') + 1);
    let moduleNumber = Number.parseInt(changedModuleName.substring(0, 3));
    
    if (!moduleNumber) return;

    removeModuleFromMap(changedModuleName);
    console.log("Removed module from map");

    if (!restructureNeeded(moduleNumber - 1)) return;

    await updateModuleNumbers();
}

/**
 * Adds a module with the given file system name to the module map alongside its topic count
 * @param {string} module 
 */
const addModuleToMap = async module => {
    let mapName = convertToMapModuleName(module);
    moduleMap[mapName] = await getTopicCountInModule(module);
    moduleCount++;
}

/**
 * Removes a module with the given name from the module map
 * @param {string} module 
 */
const removeModuleFromMap = module => {
    let mapName = convertToMapModuleName(module);
    delete moduleMap[mapName];
    moduleCount--;
}

/**
 * Clears the module map. Important to not set module map to a blank object since it is exported
 */
const clearModuleMap = () => {
    for (let key in moduleMap) {
        delete moduleMap[key];
    }
    moduleCount = 0;
}

/**
 * Checks to see if the change of a module will require the module list to be recounted
 * @param {number} moduleNumber 
 * @returns {boolean}
 */
const restructureNeeded = moduleNumber => {
    return !(!moduleNumber || moduleNumber == moduleCount);
}

/**
 * Create the named topic and all files in the named module, creating the module if necessary
 * @param {string} moduleName
 * @param {string} topicName
 */
const createTopic = async (moduleName, topicName) => {
    try {
        // Store human readable module and topic names properly capitalized
        moduleName = titleCapitalize(convertNameToHumanReadable(moduleName));
        topicName = titleCapitalize(convertNameToHumanReadable(topicName));

        // Store file system module and topic names from the properly capitalized versions
        let fsModuleName = convertHumanReadableToName(moduleName);
        let fsTopicName = convertHumanReadableToName(topicName);
        await createModule(fsModuleName);
        
        let mapModuleName = convertToMapModuleName(fsModuleName);
        // Ensure that the file system module and topic names have the correct number
        fsModuleName = ensureModuleOrTopicNumber(fsModuleName, getModuleNumber(mapModuleName));
        fsTopicName = ensureModuleOrTopicNumber(fsTopicName, ++moduleMap[mapModuleName]);
        let topicPath = root + '\\modules\\' + fsModuleName + '\\' + fsTopicName;

        // Create the topic directory and populate the files
        await fs.createDirectory(vscode.Uri.file(topicPath));

        // Store the topic and module names as the current context
        context.topicName = cleanTopicOrModuleName(topicName);
        context.moduleName = cleanTopicOrModuleName(moduleName);
        populateFiles(topicPath);
    }
    catch(exception) {
        return false;
    }
    return true;
}

/**
 * Returns the names of all folder names in the "modules" folder
 * @returns {Promise<string[]>}
 */
const getAllModuleNames = async () => {
    let files = await fs.readDirectory(vscode.Uri.file(root + '\\modules'));

    // Return just the module names
    return files.map(moduleName => moduleName[0]);
}

/**
 * Converts any module name into the same format as the mapped modules
 * @param {string} name 
 * @returns {string}
 */
const convertToMapModuleName = name => removeNumberPrefix(convertHumanReadableToName(
                                            titleCapitalize(convertNameToHumanReadable(name))));

/**
 * Creates the mandatory topic files at the specified path
 * @param {string} topicPath 
 */
const populateFiles = async (topicPath) => {
    createFile001(topicPath);
    createFile002(topicPath);
    createFile003(topicPath);
    createFile004(topicPath);
    createFile005(topicPath);
    createQuiz(topicPath);
}

/**
 * Creates the Prerequisites and Learning Objectives file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createFile001 = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['001PrerequisitesAndLearningObjectives']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\001-Prerequisites-and-Learning-Objectives.md'), Uint8Array.from(content));
}

/**
 * Creates the Description file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createFile002 = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['002Description']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\002-Description.md'), Uint8Array.from(content));
}

/**
 * Creates the Real-World Application file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createFile003 = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['003Real-WorldApplication']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\003-Real-World-Application.md'), Uint8Array.from(content));
}

/**
 * Creates the Implementation file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createFile004 = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['004Implementation']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\004-Implementation.md'), Uint8Array.from(content));
}

/**
 * Creates the Summary file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createFile005 = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['005Summary']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\005-Summary.md'), Uint8Array.from(content));
}

/**
 * Creates the Quiz file at the specified topic path
 * @param {string} topicPath The path to create the file at
 */
const createQuiz = async (topicPath) => {
    let rawContent = applyContextHooks(fileContents['quiz']);
    let content = Buffer.from(rawContent, 'utf8');
    await fs.writeFile(vscode.Uri.file(topicPath + '\\Quiz.gift'), Uint8Array.from(content));
}

/**
 * Creates a module with the specified name if it doesn't exist already
 * @param {string} moduleName 
 * @returns {Promise<boolean>}
 */
const createModule = async moduleName => {
    let mapModuleName = convertToMapModuleName(moduleName);
    if (moduleMap[mapModuleName] !== undefined) return false;
    moduleName = ensureModuleOrTopicNumber(moduleName, moduleCount + 1);

    let moduleUri = vscode.Uri.file(root + '\\modules\\' + moduleName);
    await fs.createDirectory(moduleUri);
    await addModuleToMap(moduleName);
    return true;
}

/**
 * Converts a module or topic name from it's file system name to a human readable one
 * @param {string} moduleOrTopicName 
 * @returns {string}
 */
const convertNameToHumanReadable = moduleOrTopicName => {
    return moduleOrTopicName.replaceAll('-', ' ');
}

/**
 * Converts a human readable module or topic name into one the file system can use
 * @param {string} moduleOrTopicName 
 * @returns {string}
 */
const convertHumanReadableToName = moduleOrTopicName => {
    return moduleOrTopicName.replaceAll(' ', '-');
}

/**
 * Returns the module or topic name properly capitalized with no number prefix
 * @param {string} name 
 * @returns {string}
 */
const cleanTopicOrModuleName = name => {
    let newName = titleCapitalize(convertNameToHumanReadable(name));
    if (startsWithNumber(newName)) newName = removeNumberPrefix(name);
    return newName;
}

/**
 * Returns the module or topic name with its number prefix removed
 * @param {string} name 
 * @returns {string}
 */
const removeNumberPrefix = name => {
    if (!startsWithNumber(name)) return name;

    let trueStart = Math.max(name.indexOf(' '), name.indexOf('-'));
    return name.substring(trueStart + 1);
}

/**
 * Returns a phrase properly capitalized as a title
 * @param {string} phrase 
 * @returns {string}
 */
const titleCapitalize = (phrase) => {
    phrase.trim();
    let allWords = phrase.split(' ');
    if (allWords.length == 1) return capitalize(allWords[0]);

    let lastWord = capitalize(allWords.pop());

    return allWords.reduce( 
        (runningTotal, currWord) => runningTotal + ' ' + smartCapitalize(currWord, runningTotal), '').trim() + ' ' + lastWord;
}

/**
 * Utility for titleCapitalize. Will only capitalize the proper words in a title
 * @param {string} word 
 * @param {string} context 
 * @returns {string}
 */
const smartCapitalize = (word, context) => {
    // Capitalize the start always
    if (context.length == 0) return capitalize(word);
    if (context[context.length - 1] == ':') return capitalize(word);
    
    let lowercaseCheck = word.toLowerCase();

    let lowercaseWords = styles.titleCapitalization;
    let shouldCapitalize = lowercaseWords.reduce((currentDecision, nextWord) => currentDecision && lowercaseCheck !== nextWord, true);

    if (shouldCapitalize) word = capitalize(word);

    return word;
}

/**
 * Returns the word capitalized
 * @param {string} word 
 * @returns {string}
 */
const capitalize = word => {
    if (word.length == 0) return '';
    // Handle all-caps abbreviations properly
    if (word === word.toUpperCase()) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * Builds the module map on extension activation
 */
const buildModuleMap = async () => {
    // Modules are stored without their number prefix to ensure no duplicate named modules when looking up
	let allModules = await getAllModuleNames();
	for (let module of allModules) {
		await addModuleToMap(module);
	}
}

/**
 * Returns the number of directories in the specified module that start with numbers
 * @param {string} moduleName 
 * @returns {Promise<number>}
 */
const getTopicCountInModule = async (moduleName) => {
    let modulePath = root + '\\modules\\' + moduleName;
    let files = await fs.readDirectory(vscode.Uri.file(modulePath));
    const isTopic = (file) => file[1] == 2 && startsWithNumber(file[0]);
    return files.reduce((sum, value) => sum += isTopic(value) ? 1 : 0, 0);
}

/**
 * Returns the module or topic name with the number prefix specified
 * @param {string} name 
 * @param {number} number 
 * @returns {string}
 */
const ensureModuleOrTopicNumber = (name, number) => {

    if (startsWithNumber(name)) {
        let startIndex = Math.max(0, name.indexOf('-'));
        let paddedNum = name.substring(0, startIndex).padStart(3, '0');
        return paddedNum + name.substring(startIndex);
    }
    return number.toString().padStart(3, '0') + '-' + name;
}

/**
 * Returns true if the name starts with a number
 * @param {string} name 
 * @returns {boolean}
 */
const startsWithNumber = name => /^\d$/.test(name[0])

/**
 * Replaces context hook syntax in text with the appropriate values
 * @param {string} text 
 * @returns {string}
 */
const applyContextHooks = text => {
    text = text.replaceAll('{!prerequisitesPreamble}', preambles.prerequisitesPreamble);
    text = text.replaceAll('{!objectivesPreamble}', preambles.learningObjectivesPreamble);
    text = text.replaceAll('{!topicName}', context.topicName);
    text = text.replaceAll('{!moduleName}', context.moduleName);
    return text;
}

/**
 * Returns the number of the specified module, or -1 if not found
 * @param {string} module 
 * @returns {number}
 */
const getModuleNumber = module => {
    let num = 1;
    for (let moduleName in moduleMap) {
        if (moduleName == module) return num;
        num++;
    }
    return -1;
}


module.exports = {
    moduleMap,
    moduleCount,
    say,
    sayError,
    askChoice,
    askQuestion,
    setInitialModuleMap: buildModuleMap,
    createModule,
    convertToMapModuleName,
    getAllModuleNames,
    createTopic,
    updateTopicNumbers,
    updateModuleNumbers,
    moduleChanged,
    moduleAdded,
    moduleDeleted,
    convertHumanReadableToName,
    convertNameToHumanReadable,
    titleCapitalize
};