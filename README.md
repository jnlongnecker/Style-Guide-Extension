# Style Guide Assistant

This extension serves to aid in the adherence to the style guide for NextGen content. I plan to update this extension over time to provide more quality-of-life features, so stay tuned and be sure to install updates as they come out!

## Features

### Adding Modules

Using the command palette, you can easily add in new modules to the project. The benefit of using the command palette is that the `Style Guide Assistant` will take care of those pesky details like the module number and making sure it matches the `kebab-case` file format. You can worry about the important stuff, like what the module should be called!

### Adding Topics

All modules have to have some topics, so you can easily use the command palette to insert new topics. You can choose an existing module from the list, or you can decide to create you own module in case your topic doesn't fit in an existing module. Once again, all the pesky things like proper casing and numbering will be taken care of for you. Not only will the topic name be properly formatted, but the required files for a topic will be automatically created with the templates for each file!

### Automatic Number Adjustment

If you want to move the order of modules or topics around, it can be tedious to change the numbers of a bunch of other topics or modules as well. Instead, the `Style Guide Assistant` will automatically track any changes done to the order and update all the other topic or module numbers with the proper number to ensure the proper numerical order! This takes place whether you add a new module or topic using the command palette or in some other way manually.

### Project and Module Rebuild

Have an existing project that hasn't had the benefit of all these awesome features and want to bring it up to speed? Never fear, with a single command palette command, the `Style Guide Assistant` will automatically dig through your project and do this stuff for you:

- Fix topic and module names to fit convention
- Populate empty `001-005.md` files with the template
- Create `001-005.md` files and `Quiz.gift` file with the template
- Create the properly formatted `Cumulative.md` file for topics with populated `001-005.md` files

### Automatic Completion of Cumulative.md

Copy-pasting your code from the `001-005.md` files is tedious and time consuming. The `Style Guide Assistant` will do all that for you! Now, every time you save a `001-005.md` file, the associated `Cumulative.md` file will get automatically updated with the changes!

### Context Hooks

Use provided context hooks to fully customize the content that you want to appear by default in the `001-005.md` files. Here is a list of all the context hooks and what they represent:

|Syntax                    |Meaning                                                      |
| ------------------------ | ----------------------------------------------------------- |
|`{!topicName}`            |The name of the current topic in human-readable form (no '-')|
|`{!moduleName}`           |The name of the current module in human-readable form        |
|`{!prerequisitesPreamble}`|The configurable preamble for the Prerequisites section      |
|`{!objectivesPreamble}`   |The configurable preamble for the Learning Objectives section|
|`{!001Content}`           |The text from the Prerequisites and Learning Objectives file |
|`{!002Content}`           |The text from the Description file                           |
|`{!003Content}`           |The text from the Real-World Application file                |
|`{!004Content}`           |The text from the Implementation file                        |
|`{!005Content}`           |The text from the Summary file                               |
						

## Extension Settings

The `Style Guide Assistant` is heavily customizable for your needs. You are able to configure everything from the default content for the `001-005.md` files to whether or not you want to use capitalization rules for titles!

This extension contributes the following settings:

- `contextHooks.information`: Used to provide information to you about context hooks. Doesn't do anything.
- `contextHooks.fileContent`: Set to `true` to use the heading of `001-005.md` files in the `Cumulative.md` file.
- `rules.preambles.prerequisitesPreamble`: Used to configure the preamble that appears after the `Prerequisites` heading
- `rules.preambles.learningObjectivesPreamble`: Used to configure the preamble that appears after the `Learning Objectives` heading
- `rules.files.001PrerequisitesAndLearningObjectives`: Used to configure default text that appears in `001-Prerequisites-And-Learning-Objectives.md`.
- `rules.files.002Description`: Used to configure default text that appears in `002-Description.md`.
- `rules.files.003Real-WorldApplication`: Used to configure default text that appears in `003-Real-World-Application.md`.
- `rules.files.004Implementation`: Used to configure default text that appears in `004-Implementation.md`.
- `rules.files.005Summary`: Used to configure default text that appears in `005-Summary.md`.
- `rules.files.cumulative`: Used to configure template that the `Cumulative.md` file uses.
- `rules.files.quiz`: Used to configure default text that appears in `Quiz.gift`.
- `rules.style.useTitleCapitalization`: Set to `true` to use the title capitalization rules with the specified words that should always be lowercase.
- `rules.style.titleCapitalization`: An `array` of `strings` to specify words that should be lowercase in titles.

## Installation

This extension is not available publicly on the extension marketplace. In order to start using this yourself, download the `.vsix` file in the releases section and run the following command from VS Code:

```bash
code --install-extension revature-style-guide-x.x.x.vsix
```

Replace the "x"s with the version number for the `.vsix` file you downloaded, and make sure that you are in the same directory as the file.

## Known Issues

Using the extension from within a workspace with multiple project folders open is not supported. Make sure to use the extension with just a single project open.

## Release Notes

### 0.0.1

Alpha release of initial features.

- File system topic and module number tracker
- Command palette command to add a topic
- Command palette command to add a module
- Command palette command to rebuild a module
- Command palette command to rebuild the entire project
- Automatic `Cumulative.md` updating
- Automatic topic and module name title capitalization