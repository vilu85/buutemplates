import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { input, confirm } from '@inquirer/prompts';
import { generateFolderRange } from 'buufolders/buuf';

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
const [_, __, readmePath, lecture, assignmentStart, assignmentEnd] = process.argv;

/**
 * @typedef {import('../Buufolders/FolderGeneratorNPM/buuf').BuuFoldersOptions} BuuFoldersOptions
 */
/**
 * @typedef {Object} BuuTemplateOptions
 * @property {string} readmePath
 * @property {string} lectureRootPath
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
        assignmentFilenamePrefix: '',
        assignmentFilenameSuffix: '',
    };

    /**
     * @type {string} config json file path
     */
    configFile = null;

    /**
     * Readme filtered assignment text blocks
     *
     * @type {{[assignmentIdentifier: string]: string[]}[]}
     */
    filtered = null;
    generatePackageJson = false;
    lectureNumber = 1;
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
        }

        this.init();
    }

    init() {
        this.setupAndGenerate();
    }

    async setupAndGenerate() {
        await this.setup();
        await this.generateTemplates();
    }

    async setup() {
        let shouldConfirmSave = false;

        while (!this.options?.readmePath && !this.options?.lectureRootPath) {
            let enteredPath = await input({ message: 'Enter lecture README.md path or root path of Lecture folders:' });
            if (enteredPath) {
                enteredPath = enteredPath.trim();
                const _readmePath = enteredPath.endsWith('README.md')
                    ? enteredPath
                    : path.join(enteredPath, 'README.md');

                // Check if given path is lecture folder root
                if (this.fileExists(path.join(enteredPath, 'Lecture1', 'README.md'))) {
                    shouldConfirmSave = true;
                    this.options.lectureRootPath = enteredPath;
                } else if (this.fileExists(_readmePath)) {
                    shouldConfirmSave = true;
                    this.options.readmePath = _readmePath;
                } else {
                    console.log(`README.md file could not be found from ${colors.red(_readmePath)}`);
                    console.log(`The path was not a valid lecture root path: ${colors.red(enteredPath)}`);
                }
            }
        }

        if (shouldConfirmSave) {
            const savePath = await confirm({ message: 'Do you want save the path for later use?' });
            if (savePath) {
                await this.writeJsonFile(this.configFile, this.options);
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
        }

        this.assignmentStart =
            assignmentStart ??
            (await input({
                message: 'Enter the number of the first assignment:',
                validate: (value) => {
                    if (isNaN(value)) {
                        return 'Invalid number';
                    } else if (value < 0) {
                        return 'Assignment number cannot be less than 1';
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
                    } else if (value < this.assignmentStart) {
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
        return this.filtered.find((value) => {
            return Object.keys(value)[0] === String(num);
        });
    }

    /**
     * Provides assignment descriptions during index.ts generation
     * @param {number} lectureNumber
     * @param {number} assignmentNumber
     */
    fileContentProvider(lectureNumber, assignmentNumber) {
        const _assignmentNumber = '' + assignmentNumber;
        const assignmentEntry = this.getAssignmentEntry(assignmentNumber);
        const data = this.generateIndexTs(_assignmentNumber, assignmentEntry);
        return data;
    }

    async generateTemplates() {
        this.readme = await this.getReadmeContent();
        const assignmentBlocks = this.parseReadme(this.readme);

        if (assignmentBlocks && assignmentBlocks.length) {
            this.filtered = assignmentBlocks;
            if (this.filtered && this.filtered.length) {
                console.log(`Generating ${this.assignmentEnd - this.assignmentStart} index.ts files...`);
                generateFolderRange(
                    this.lectureNumber,
                    this.assignmentStart,
                    this.assignmentEnd,
                    this.options,
                    (num, assignNum) => this.fileContentProvider(num, assignNum)
                );
            } else {
                console.log(
                    `Error: There is no assignments in given range (${this.assignmentStart}-${this.assignmentEnd})`
                );
                process.exit(1);
            }
        } else {
            console.log(`Error: Assignments could not be found from the file '${this.options.readmePath}'`);
            process.exit(1);
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

    /**
     * Parses readme content
     *
     * @param {string} content
     * @return {{
     *  [assignmentIdentifier: string]: string[];
     * }[]}
     */
    parseReadme(content) {
        const regex = /## Assignment \d+\.\d+: [\w .]+\r?\n[\s\S]*?(?=\n## Assignment|$)/gm;
        const assignments = content.match(regex);
        if (assignments) {
            const assignmentBlocks = assignments.map((value) => {
                const assignmentNumber = value.match(/## Assignment (\d+)\.(\d+)/);
                const assignmentContent = value.split(/\r?\n/);
                return {
                    [`${assignmentNumber[2]}`]: assignmentContent,
                };
            });

            return assignmentBlocks;
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
