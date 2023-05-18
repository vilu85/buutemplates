import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { input, confirm } from '@inquirer/prompts';
import { generateFolderRange } from 'buufolders/buuf.js';

/**
 * Copyright (c) 2023 Ville Perkkio
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @class BuuTemplates
 */
const [_, __, lecture, assignmentStart, assignmentEnd, readmePath] = process.argv;

/**
 * @typedef {import('buufolders/buuf.js').BuuFoldersOptions} BuuFoldersOptions
 */
/**
 * @typedef {Object} BuuTemplateOptions
 * @property {string} readmePath
 * @property {string} lectureRootPath
 * @property {number?} maxLineLength sets maximum line length for assignment description blocks if it's set.
 */

export class BuuTemplates {
    /**
     * @type {BuuTemplateOptions & BuuFoldersOptions}
     */
    options = {
        fileType: '.ts',
        padNumbers: false,
        folderBasename: 'Lecture',
        assignmentFileBasename: 'index',
    };

    /**
     * @type {string} config json file path
     */
    configFile = null;
    configurationExists = false;
    askConfigurationSave = false;

    /**
     * Readme filtered assignment text blocks
     *
     * @type {{[assignmentIdentifier: string]: string[]}[]}
     */
    assignments = null;
    generatePackageJson = false;
    lectureNumber = 0;
    assignmentStart = 0;
    assignmentEnd = 0;

    constructor() {
        const projectRoot = process.cwd();
        this.configFile = path.join(projectRoot, '.buutemplates.json');

        if (this.fileExists(this.configFile)) {
            const json = this.readJsonFile(this.configFile);
            this.options = {
                ...this.options,
                ...json,
            };
            this.configurationExists = true;
        }

        // Check if readmePath was given in args.
        if (readmePath && readmePath.length && !this.validateReadmePath(readmePath)) {
            throw Error(`Invalid Lecture README.md path: ${colors.red(readmePath)}`);
        }
    }

    init() {
        this.setupAndGenerate();
    }

    async setupAndGenerate() {
        try {
            await this.setup();
            await this.generateTemplates();
        } catch (error) {
            console.log(error);
        }
    }

    isValidName(name) {
        // Define a regular expression that matches any character that is not a letter, digit, underscore, or hyphen
        const regex = /[^a-zA-Z0-9_-]/;

        // Test if the string contains any non-allowed characters
        return !regex.test(name);
    }

    validateReadmePath(value) {
        const _readmePath = value.trim().endsWith('README.md') ? value.trim() : path.join(value.trim(), 'README.md');

        if (this.fileExists(path.join(value.trim(), 'Lecture1', 'README.md'))) {
            // Check if given path is lecture folder root
            this.configurationExists = true;
            this.options.lectureRootPath = value.trim();
        } else if (this.fileExists(_readmePath)) {
            // Check if given path is a specific lecture's README.md
            this.options.readmePath = _readmePath;
        } else {
            console.log(`README.md file could not be found from ${colors.red(_readmePath)}`);
            console.log(`The path was not a valid lecture root path: ${colors.red(value.trim())}`);
            return false;
        }
        return true;
    }

    async setup() {
        if (!this.configurationExists) {
            this.options.folderBasename = await input({
                message: 'Enter base name for lecture folders:',
                default: this.options.folderBasename,
                validate: (value) => {
                    if (this.isValidName(value)) {
                        return true;
                    } else {
                        return 'Invalid lecture folder base name.';
                    }
                },
            });

            this.options.assignmentFileBasename = await input({
                message: 'Enter base name for assignment files:',
                default: this.options.assignmentFileBasename,
                validate: (value) => {
                    if (this.isValidName(value)) {
                        return true;
                    } else {
                        return 'Invalid assignment file base name.';
                    }
                },
            });

            this.options.padNumbers = await confirm({
                message: 'Do you want to use padding in numbers?',
                default: this.options.padNumbers ?? false,
            });

            if (
                await confirm({
                    message:
                        'To make the task description easier to read, do you want to set a maximum length for comment lines (too long lines are automatically cut to a new line)?',
                    default: true,
                })
            ) {
                this.options.maxLineLength = Number(
                    await input({
                        message: 'Enter the maximum length for each line:',
                        default: 120,
                        validate: (value) => {
                            if (isNaN(value)) {
                                return 'Invalid number';
                            } else if (Number(value) < 40) {
                                return 'Maximum length cannot be less than 40 characters';
                            } else if (Number(value) > 400) {
                                return 'Maximum length cannot be more than 400 characters';
                            }

                            return true;
                        },
                    })
                );
            }

            this.configurationExists = true;
            this.askConfigurationSave = true;
        }

        while (!this.options?.readmePath && !this.options?.lectureRootPath) {
            const enteredPath = await input({
                message: 'Enter lecture README.md path or root path of Lecture folders:',
            });
            if (enteredPath) {
                this.validateReadmePath(enteredPath);
                if (this.options?.lectureRootPath) {
                    this.askConfigurationSave = true;
                }
            }
        }

        if (this.configurationExists && this.askConfigurationSave) {
            const savePath = await confirm({ message: 'Do you want save the the configuration?' });
            if (savePath) {
                // eslint-disable-next-line no-unused-vars
                const { readmePath, ...saveableOptions } = this.options;
                await this.writeJsonFile(this.configFile, saveableOptions);
            }
        }

        if (this.options?.lectureRootPath) {
            this.lectureNumber =
                lecture ??
                (await input({
                    message: 'Enter the lecture number:',
                    validate: (value) => {
                        if (isNaN(value)) {
                            return 'Invalid lecture number';
                        } else if (value < 0) {
                            return 'Lecture number cannot be less than 1';
                        } else if (
                            !this.fileExists(path.join(this.options.lectureRootPath, `Lecture${value}`, 'README.md'))
                        ) {
                            return (
                                'Invalid lecture number or README.md does not exist: ' +
                                path.join(this.options.lectureRootPath, `Lecture${value}`, 'README.md')
                            );
                        } else {
                            return true;
                        }
                    },
                }));

            this.options.readmePath = path.join(
                this.options.lectureRootPath,
                `Lecture${this.lectureNumber}`,
                'README.md'
            );

            this.readme = await this.getReadmeContent();
            this.parseReadme(this.readme);
        } else if (this.options.readmePath && this.lectureNumber === 0) {
            this.readme = await this.getReadmeContent();
            this.parseReadme(this.readme);

            if (this.parsedLectureNumber) {
                this.lectureNumber = this.parsedLectureNumber;
                console.log(`Lecture ${colors.yellow(this.lectureNumber)} found from README.md`);
            }
        }

        this.assignmentStart =
            assignmentStart ??
            (await input({
                message: 'Enter the number of the first assignment:',
                validate: (value) => {
                    if (isNaN(value)) {
                        return 'Invalid number';
                    } else if (value < 0) {
                        return 'Assignment number cannot be less than 0';
                    } else {
                        return true;
                    }
                },
            }));
        this.assignmentEnd =
            assignmentEnd ??
            (await input({
                message: 'Enter the number of the last assignment:',
                validate: (value) => {
                    if (isNaN(value)) {
                        return 'Invalid number';
                    } else if (value < 0) {
                        return 'Assignment number cannot be less than 1';
                    } else if (value < Number(this.assignmentStart)) {
                        return 'The last assignment number cannot be smaller than the first assignment number.';
                    } else {
                        return true;
                    }
                },
            }));

        //TODO: Implement package.json generation
        //this.generatePackageJson = await confirm({ message: 'Do you also want to generate package.json files?' });
    }

    /**
     * Writes json object to the file.
     *
     * @param {string} path
     * @param {Object} fileData
     * @returns {boolean}
     */
    writeJsonFile(path, fileData) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, JSON.stringify(fileData, null, 2), function (err) {
                if (err) reject(err);
                resolve();
            });
        });
    }

    fileExists(path) {
        try {
            const { size } = fs.statSync(path);
            return !!size;
        } catch (error) {
            return false;
        }
    }

    readJsonFile(path) {
        const data = fs.readFileSync(path);
        const json = JSON.parse(data);
        return json;
    }

    getAssignmentEntry(num) {
        return this.assignments.find((value) => {
            return Object.keys(value)[0] === String(num);
        });
    }

    /**
     * Returns a full file path for the lecture and assignment numbers.
     *
     * @param {number} lectureNumber
     * @param {number} assignmentNumber
     * @param {BuuFoldersOptions} options
     * @return {string}
     */
    getAssignmentFilePath(lectureNumber, assignmentNumber, options) {
        const projectRoot = process.cwd();
        const formattedLectureNumber = options.padNumbers
            ? String(lectureNumber).padStart(2, '0')
            : String(lectureNumber);

        const lectureFolder = `${options.folderBasename}${formattedLectureNumber}`;
        const lectureFolderFullPath = path.join(projectRoot, lectureFolder);

        const formattedAssignmentNumber = options.padNumbers
            ? String(assignmentNumber).padStart(2, '0')
            : assignmentNumber;
        const assignmentFolder = `Assignment${lectureNumber}.${formattedAssignmentNumber}`;
        const assignmentFile = this.getAssignmentFilename(lectureNumber, assignmentNumber, options);

        return path.join(lectureFolderFullPath, assignmentFolder, assignmentFile);
    }

    /**
     * Returns filename
     * @param {number} lectureNumber
     * @param {number} assignmentNumber
     * @param {BuuFoldersOptions} options
     */
    getAssignmentFilename(lectureNumber, assignmentNumber, options) {
        if (!options.fileType.startsWith('.')) {
            options.fileType = '.' + options.fileType;
        }
        return (
            options.assignmentFileBasename
                .replace('%LECTURE%', lectureNumber)
                .replace(
                    '%ASSIGNMENT%',
                    options.padNumbers ? String(assignmentNumber).padStart(2, '0') : assignmentNumber
                ) + options.fileType
        );
    }

    /**
     * Provides assignment descriptions during index.ts generation
     * @param {number} _lectureNumber
     * @param {number} assignmentNumber
     */
    fileContentProvider(_lectureNumber, assignmentNumber) {
        const _assignmentNumber = '' + assignmentNumber;
        const assignmentEntry = this.getAssignmentEntry(assignmentNumber);
        const data = this.generateIndexTs(_assignmentNumber, assignmentEntry);
        return data;
    }

    async generateTemplates() {
        if (this.assignments && this.assignments.length) {
            console.log(`Generating ${this.assignmentEnd - this.assignmentStart + 1} index.ts files...`);
            generateFolderRange(
                Number(this.lectureNumber),
                Number(this.assignmentStart),
                Number(this.assignmentEnd),
                this.options,
                (num, assignNum) => this.fileContentProvider(num, assignNum)
            );
        } else {
            throw Error(
                `Error: There is no assignments in given range (${this.assignmentStart}-${this.assignmentEnd})`
            );
        }
    }

    /**
     * Generates index.ts file with the comment from assignment.
     *
     * @param {string} assignmentNumberSuffix
     * @param {{[assignmentIdentifier: string]: string[]}} assignmentEntry
     */
    generateIndexTs(assignmentNumberSuffix, assignmentEntry) {
        if (assignmentEntry?.[assignmentNumberSuffix]) {
            let data = '/**\n';
            assignmentEntry[assignmentNumberSuffix].forEach((value) => (data += ` * ${value}\n`));
            data += ' */\n';

            return data;
        } else {
            throw Error(`Assignment description for the assignment ${assignmentNumberSuffix} could not be found`);
        }
    }

    /**
     * Filters assignments based on given start and end numbers.
     *
     * @param {number} start assignment number from
     * @param {number} end assignment number to
     * @param {{
     *  [assignmentIdentifier: string]: string[];
     * }[]} assignmentBlocks
     * @return {{
     *  [assignmentIdentifier: string]: string[];
     * }[]} filtered result
     */
    filterAssignments(start, end, assignmentBlocks) {
        return assignmentBlocks.filter((value) => {
            const [assignmentNumber] = Object.keys(value)[0];
            return parseInt(assignmentNumber) >= start && parseInt(assignmentNumber) <= end;
        });
    }

    splitLineAtSpace(line, maxLength) {
        const lastSpaceIndex = line.lastIndexOf(' ', maxLength);

        if (lastSpaceIndex !== -1) {
            const segment1 = line.substring(0, lastSpaceIndex).trim();
            const segment2 = line.substring(lastSpaceIndex + 1).trim();

            return [segment1, ...this.splitLineAtSpace(segment2, maxLength)];
        }

        return [line];
    }

    /**
     * Parses readme content and sets @var parsedLecture number and
     * @var assignments
     *
     * @param {string} content
     * @return {{
     *  [assignmentIdentifier: string]: string[];
     * }[]}
     */
    parseReadme(content) {
        const parsedLecture = content.match(/## Assignment (\d+)\.(\d+)/);
        if (parsedLecture && parsedLecture.length) {
            this.parsedLectureNumber = Number(parsedLecture[1]);
        }

        const regex = /(?=## Assignment \d+\.\d+:)/;
        const blocks = content.split(regex).map((block) => {
            return block;
        });

        // Filter assignments from content blocks
        const filteredBlocks = blocks.filter((value) => value.match(/(?=## Assignment \d+\.\d+:)/));
        if (filteredBlocks) {
            // Map filtered blocks to the array in form: assignment number => assignment description
            this.assignments = filteredBlocks.map((value) => {
                const assignmentNumber = value.match(/## Assignment (\d+)\.(\d+)/);
                const assignmentContent = value.split(/\r?\n/);
                return {
                    [`${assignmentNumber[2]}`]: assignmentContent,
                };
            });

            // Check if maxLineLength option is set
            if (this?.options?.maxLineLength) {
                // Split lines that exceeds defined max line length
                this.assignments = this.assignments.map((item) => {
                    const key = Object.keys(item)[0];
                    const value = item[key];

                    const updatedValue = value.flatMap((line) => {
                        // Check if the line length is greater than maxLineLength - comment prefix length (3)
                        if (line.length > this.options.maxLineLength - 3) {
                            return this.splitLineAtSpace(line, this.options.maxLineLength - 3);
                        }

                        return line;
                    });

                    return {
                        [key]: updatedValue,
                    };
                });
            }

            // Remove empty lines from each assignment description
            this.assignments = this.assignments.map((item) => {
                const key = Object.keys(item)[0];
                const value = item[key];

                // Find the index of the last non-empty line
                let lastIndex = value.length - 1;
                while (lastIndex >= 0 && value[lastIndex].trim() === '') {
                    lastIndex--;
                }

                // Remove empty lines from the end of the assignment block
                const updatedValue = value.slice(0, lastIndex + 1);

                return {
                    [key]: updatedValue,
                };
            });
        } else {
            throw Error(`Error: Assignments could not be found from the file '${this.options.readmePath}'`);
        }
    }

    /**
     * Returns readme content from the file.
     * @returns {Promise<String, Error>}
     */
    getReadmeContent() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.options.readmePath, function (err, data) {
                if (err) reject(err);
                resolve(data.toString());
            });
        });
    }
}
