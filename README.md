![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![Node.js](https://github.com/vilu85/buutemplates/actions/workflows/node.js.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#)
# BuuTemplates

> Generate file templates for Buutti assignments

### 🏠 [Homepage](https://github.com/vilu85/buutemplates)

## Table of contents

- [Table of contents](#table-of-contents)
- [Getting Started](#getting-started)
- [Installation](#installation)
  - [From npm](#option-1-download-from-npm)
  - [From repository](#option-2-clone-the-repository)
- [Usage](#usage)
  - [Options](#options)
- [Running the tests](#running-the-tests)
  - [Issues](#issues)
  - [Contributing](#contributing)
  - [Versioning](#versioning)
  - [Authors](#authors)
  - [License](#license)

## Getting Started

The BuuTemplates is a command-line tool that automates the process of creating index.ts, index.js, or main ts/js files with custom names and assignment descriptions for Buutti assignments.

To use this tool, you need to have a Buutti lecture folders with the appropriate structure, including a folder for each lecture and a README.md file in each lecture folder. The README.md file should contain a description of each assignment for that lecture.

To create the main entry files and assignment description blocks, run the command `npm run buutemplates` and follow the prompts. The tool will prompt you to enter the full path of a singular lecture's README.md file or the root path of the folder for all lectures.

If a singular lecture's README.md path is given, the tool will use it and generate assignments only for that lecture.

If the root path is given, the tool will ask for a lecture number and use the appropriate lecture folder based on the given lecture number. The user has the option to save this configuration, so they don't have to enter the README.md path again and can instead input the lecture number when they want to generate more assignments for later lectures.

Next, the tool will prompt you to specify the range of assignments you want to create and the name of the main entry file you want to generate.

Once the tool has gathered all the necessary information, it will automatically generate the main entry file and add the appropriate assignment descriptions as block comments at the beginning of each generated file.

That's it! With the BuuTemplates, you can easily automate the creation of main entry files and assignment descriptions for your Buutti course.

## Installation

To install BuuTemplates, you can either download it from npm or clone the repository from GitHub.

### Option 1: Download from npm

To download BuuTemplates from npm, run the following command in your terminal:

```sh
npm install buutemplates
```

This will download and install the latest version of BuuTemplates.

If you want to install BuuTemplates globally, you can use the -g flag:

```sh
npm install -g buutemplates
```

This will install BuuTemplates globally, so you can run it from any directory on your system by typing `buutemplates` in your terminal.

### Option 2: Clone the repository

If you prefer to clone the BuuTemplates repository from GitHub, run the following command in your terminal:

```sh
git clone https://github.com/vilu85/buutemplates.git
```

Once you have downloaded or cloned BuuTemplates, navigate into the project directory and run the following command to install the dependencies:

```sh
npm install
```

This will install all the required dependencies for BuuTemplates to run.

## Usage

To use BuuTemplates, follow the steps below:

1. Open a terminal and navigate to the directory where you have installed BuuTemplates.

2. Type the following command to run the tool:

```sh
npm run buutemplates
```

If you have installed BuuTemplates globally, you can run it with the following command:

```sh
buutemplates
```

3. If a `.buutemplates.json` configuration file is found in the directory, BuuTemplates will use any saved configurations. Otherwise, the tool will ask you a series of questions to set up the configuration.

4. If the configuration is not found, the tool will ask you to specify a base name for the lecture folders and generated TypeScript/JavaScript files.
   - You can use the `%LECTURE%` and `%ASSIGNMENT%` tokens in the base name to be replaced with the current lecture number and assignment number, respectively.
   - For example, if you specify the base name to be `Assignment_%LECTURE%.%ASSIGNMENT%`, the generated file name for lecture 2 and assignment 3 will be `Assignment_2.3.ts`.

5. The tool will then ask if you want to use padding in numbers. If you choose yes, the generated directory and file names will include leading zeros for lecture and assignment numbers less than 10 (e.g., `Lecture_02`, `Assignment_01`).

6. After providing the lecture folder and file name configuration, the tool will ask you to specify the lecture root folder or the full path of a singular lecture's `README.md` file.
   - If you provide the path to the root folder, the tool will then ask you for the lecture number.
   - If you provide the path to a singular lecture's `README.md` file, the tool will parse the lecture number from the file name and skip asking for it.
   - Note that singular lecture `README.md` paths are not saved in the configuration, so you will need to provide the path every time you run the tool.

7. After providing the lecture information, the tool will ask you to specify the assignment range by entering the first and last assignment numbers.

8. Once the configuration is set up, the tool will generate the appropriate lecture directories and assignment files based on the input range and configuration.

## Options

In addition to the interactive mode, BuuTemplates also supports passing command-line arguments to generate lecture folders and assignment files without having to answer any questions.

The following options are available:

- `<lectureNumber>`: The lecture number to generate folders for. Required.
- `<assignmentStart>`: The number of the first assignment to generate. Required.
- `<assignmentEnd>`: The number of the last assignment to generate. Required.
- `<readmePath>`: The full path to the `README.md` file of a singular lecture. Optional. If this is provided, BuuTemplates will use the lecture number parsed from the file name and skip asking for it.

If you want to generate templates without answering the questions interactively, you can pass the necessary options as command line arguments. The following command will generate templates for lecture 1, assignments 1-5, and save the README file to the specified path:

```
buutemplates 1 1 5 path/to/readme.md
```

If a `.buutemplates.json` configuration file is found in the directory, BuuTemplates will use any saved configurations. Otherwise, it will ask you to set up the configuration before generating the lecture folders and assignment files.

<!-- Note that if you pass command-line arguments, they will override any values saved in the configuration file.

For example, the following command will generate lecture folders and assignment files for lecture 3, assignments 1 through 5, and save the configuration with base folder name "lectures" and file name format "Assignment_%LECTURE%.%ASSIGNMENT%":

```
npm run buutemplates 3 1 5 --baseFolderName lectures --fileNameFormat "Assignment_%LECTURE%.%ASSIGNMENT%" --padding --saveConfiguration
```

In this case, the `--baseFolderName` and `--fileNameFormat` options override any values saved in the configuration file, while `--padding` and `--saveConfiguration` set the padding option and save the configuration to `.buutemplates.json`, respectively. -->

## Running the tests

BuuTemplates uses Jest, a popular JavaScript testing framework, for testing. All tests can be found in the `./tests` directory.

In normal usage, you do not need to run any tests as BuuTemplates generates the appropriate files and directories as intended. However, tests are important during development to ensure that everything works as expected. When contributing to the project through pull requests or merges, tests must pass before they can be accepted.

To run the tests locally, you must first install the development dependencies by running the following command in the terminal:

```
npm install --dev
```

After installation, you can run the tests using the following command:

```
npm test
```

This will run all tests in the `./tests` directory and output the results to the terminal. If any tests fail, you will see an error message describing the failure.

It is important to make sure all tests pass before contributing to the project or making any significant changes.

## Issues

Issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/vilu85/buutemplates/issues). You can also take a look at the [contributing guide](https://github.com/vilu85/buutemplates/blob/main/CONTRIBUTING.md).

## Contributing

Please read [CONTRIBUTING.md](https://github.com/vilu85/buutemplates/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Add your changes: `git add .`
4.  Commit your changes: `git commit -am 'Add some feature'`
5.  Push to the branch: `git push origin my-new-feature`
6.  Submit a pull request :sunglasses:

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/vilu85/buutemplates/tags).

## Authors

* **Ville Perkkio** - *Initial work* - [Website](https://github.com/vilu85) - [@vilu85](https://github.com/vilu85) - [@vilu85](https://linkedin.com/in/vilu85)

## License

Copyright © 2023 [Ville Perkkio](https://github.com/vilu85)

This project is [MIT](https://opensource.org/license/mit/) licensed.
