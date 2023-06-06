const inquirer = require('@inquirer/prompts');

import { BuuTemplates } from '../buutemplates.js';

// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const path = require('path');
const projectRoot = process.cwd();

// Setup readme file mock path
const readmeMockPath = path.join('test', 'assignments', 'Lecture1', 'README.md');

// Setup configuration file path
const configFilePath = path.join(projectRoot, '.buutemplates.json');

// Mock console log
const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

// Mock process argv
const originalArgv = process.argv;

jest.mock('fs', () => {
    return {
        readFileSync: jest.fn().mockImplementation((file, encoding = 'utf8') => {
            const buf = Buffer.from(mockFiles[file], encoding);
            return buf;
        }),
        readFile: jest.fn().mockImplementation((path, cb = (_err, _buf) => {}) => {
            if (mockFiles[path]) {
                const buf = Buffer.from(mockFiles[path], 'utf8');
                cb(false, buf);
            } else {
                cb(new Error(`Mock file is missing: ${path}`), null);
                const buf = Buffer.from(mockFiles[path], 'utf8');
                cb(false, buf);
            }
        }),
        writeFile: jest.fn().mockImplementation((file, data, cb) => {
            mockFiles[file] = data;
            cb(null);
        }),
        writeFileSync: jest.fn().mockImplementation((file, data) => {
            mockFiles[file] = data;
        }),
        statSync: jest.fn().mockImplementation((path) => {
            if (mockFiles[path]) {
                return { size: 1 };
            } else {
                return false;
            }
        }),
        existsSync: jest.fn().mockImplementation((path) => {
            return Object.keys(mockFiles).findIndex((value) => path === value);
        }),
        mkdirSync: jest.fn().mockImplementation((path, _opts = {}) => {
            mockFiles[path] = '';
        }),
        readdir: jest.fn().mockImplementation((path = '', cb) => {
            const files = Object.entries(mockFiles).reduce((acc, [filePath, fileContent]) => {
                if (filePath === path || filePath.startsWith(path)) {
                    return [...acc, { filePath, fileContent }];
                }
                return acc;
            }, []);

            cb(false, files);
        }),
    };
});

// Mocked files during testing
let mockFiles = {};

jest.mock('@inquirer/prompts');

describe('BuuTemplates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Clear mocked files after each test
        mockFiles = {};

        // Mock lecture 1 assignment README.md file
        mockFiles[path.join('test', 'assignments', 'Lecture1', 'README.md')] =
            '## Assignment 1.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            '## Assignment 1.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            '## Assignment 1.3: Test assignment 3\n\n' +
            'Test description\n\n' +
            '## Assignment 1.4: Test assignment 4\n\n' +
            'Test description 4\n\n' +
            '## Bonus Assignment 1.5: Test assignment 5\n\n' +
            'Bonus test description 5\n\n';

        // Mock lecture 2 assignment README.md file
        mockFiles[path.join('test', 'assignments', 'Lecture2', 'README.md')] =
            '## Assignment 2.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            '## Assignment 2.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            '## Assignment 2.3: Test assignment 3\n\n' +
            'Test description 3\n\n' +
            '## Assignment 2.4: Test assignment 4\n\n' +
            'Test description 4\n\n' +
            '## Assignment 2.5: Test assignment 5\n\n' +
            'Test description 5\n\n' +
            '## Assignment 2.6: Test assignment 6\n\n' +
            'Test description 6\n\n' +
            '## Assignment 2.7: Test assignment 7\n\n' +
            'Test description 7\n\n';

        // Mock empty process.argv arguments
        process.argv = [];    
    });

    afterAll(() => {
        process.argv = originalArgv;
        consoleLogMock.mockRestore();
    });

    it('should create configuration file with predefined style', async () => {
        // Mock inquirer functions
        const inputMock = jest.fn();
        const confirmMock = jest.fn();
        const selectMock = jest.fn();
        inquirer.input = inputMock;
        inquirer.confirm = confirmMock;
        inquirer.select = selectMock;

        // Mock user selection for directory and file structure style
        selectMock.mockImplementationOnce(() => Promise.resolve('assignmentWithoutPadding'));
        // Mock user input for the question 'Use max line length?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for the question 'Generate README?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for README.md full path
        inputMock.mockImplementationOnce(() => Promise.resolve(readmeMockPath));
        // Mock user input for the question 'Save configuration?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(true));
        // Mock user input for assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        const buutemplates = new BuuTemplates();
        await buutemplates.setup();

        // Expect the class run time variables be set
        expect(buutemplates.options.readmePath).toBe(readmeMockPath);
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect user inputs be called
        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(confirmMock).toHaveBeenCalledTimes(3);
        expect(inputMock).toHaveBeenCalledTimes(3);

        // Expect configuration file be defined
        expect(mockFiles[configFilePath]).toBeDefined();
 
        // Expect configuration to match with selected style
        expect(buutemplates.options).toEqual(
            expect.objectContaining(buutemplates.structureStyles.find( value => value.value === 'assignmentWithoutPadding').options)
        );
    });

    it('should create configuration file with user defined style', async () => {
        // Mock inquirer functions
        const inputMock = jest.fn();
        const confirmMock = jest.fn();
        const selectMock = jest.fn();
        inquirer.input = inputMock;
        inquirer.confirm = confirmMock;
        inquirer.select = selectMock;

        // Mock user selection for directory and file structure style
        selectMock.mockImplementationOnce(() => Promise.resolve('custom'));
        // Mock user input for lecture folder base name
        inputMock.mockImplementationOnce(() => Promise.resolve('Lecture'));
        // Mock user input for assignment file base name
        inputMock.mockImplementationOnce(() => Promise.resolve('index'));
        // Mock user input for the question 'Use padding?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for the question 'Use max line length?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for the question 'Generate README?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for README.md full path
        inputMock.mockImplementationOnce(() => Promise.resolve(readmeMockPath));
        // Mock user input for the question 'Save configuration?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(true));
        // Mock user input for assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        const buutemplates = new BuuTemplates();
        await buutemplates.setup();

        // Expect the class run time variables be set
        expect(buutemplates.options.readmePath).toBe(readmeMockPath);
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect user inputs be called
        expect(confirmMock).toHaveBeenCalledTimes(4);
        expect(inputMock).toHaveBeenCalledTimes(5);

        // Expect configuration file be defined
        expect(mockFiles[configFilePath]).toBeDefined();
    });

    it('should create assignment templates using existing configuration', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            readmePath: readmeMockPath,
            generateReadmeFiles: false
        });

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect index.ts files be generated for assignments 1.1-1.3
        for (let assignmentNumber = 1; assignmentNumber < 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.${assignmentNumber}`, 'index.ts')]).toMatch(new RegExp(`Test description ${assignmentNumber}`, 'gm'));
        }

        // Expect index.ts file not be generated for the assignment 1.4
        expect(mockFiles).toEqual(
            expect.not.objectContaining({
                [path.join(projectRoot, 'Lecture1', 'Assignment1.4', 'index.ts')]: expect.any(String),
            })
        );
    });

    it('should create assignment templates and README files', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            readmePath: readmeMockPath,
            generateReadmeFiles: true
        });

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect index.ts files be generated for assignments 1.1-1.3
        for (let assignmentNumber = 1; assignmentNumber < 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.${assignmentNumber}`, 'index.ts')]).toMatch(new RegExp(`Test description ${assignmentNumber}`, 'gm'));
        }

        // Expect README files be generated for assignments 1.1-1.3
        for (let assignmentNumber = 1; assignmentNumber < 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.${assignmentNumber}`, 'README.md')]).toMatch(new RegExp(`Test description ${assignmentNumber}`, 'gm'));
        }
    });

    it('should create files for the bonus assignment', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            readmePath: readmeMockPath,
            generateReadmeFiles: true
        });

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(4));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(5));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(4);
        expect(buutemplates.assignmentEnd).toBe(5);

        // Expect index.ts file be generated for assignment 1.4
        expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.4`, 'index.ts')]).toMatch(new RegExp(`Test description 4`, 'gm'));

        // Expect index.ts and README.md files be generated for the bonus assignment 1.5
        expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.5`, 'index.ts')]).toMatch(new RegExp(`Bonus test description 5`, 'gm'));
        expect(mockFiles[path.join(projectRoot, 'Lecture1', `Assignment1.5`, 'README.md')]).toMatch(new RegExp(`Bonus test description 5`, 'gm'));
    });

    it('should create assignment templates for specific lecture number', async () => {
        // Mock .buutemplates.json configuration with lecture root path
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            lectureRootPath: path.join('test', 'assignments'),
            generateReadmeFiles: false
        });

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the lecture number
        inputMock.mockImplementationOnce(() => Promise.resolve(2));
        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(4));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(7));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect lecture number be set
        expect(buutemplates.lectureNumber).toBe(2);
        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(4);
        expect(buutemplates.assignmentEnd).toBe(7);

        // Expect index.ts files be generated for assignments 2.4-2.7 but not 2.3
        for (let assignmentNumber = 4; assignmentNumber <= 7; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture2', `Assignment2.${assignmentNumber}`, 'index.ts')]).toMatch(new RegExp(`Test description ${assignmentNumber}`, 'gm'));
        }
    });
    
    it('should create the assignment files and replace the tokens in the filename', async () => {
        // Mock .buutemplates.json configuration with lecture root path
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'assignment%LECTURE%.%ASSIGNMENT%',
            lectureRootPath: path.join('test', 'assignments'),
            generateReadmeFiles: false
        });

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the lecture number
        inputMock.mockImplementationOnce(() => Promise.resolve(2));
        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect lecture number be set
        expect(buutemplates.lectureNumber).toBe(2);
        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect assignmentX.XX.ts files be generated for assignments 2.1-2.3
        for (let assignmentNumber = 1; assignmentNumber <= 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture2', `Assignment2.${assignmentNumber}`, `assignment2.${assignmentNumber}.ts`)]).toMatch(new RegExp(`Test description ${assignmentNumber}`, 'gm'));
        }
    });

    it('should skip existing assignment files', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'assignment_file_%ASSIGNMENT%',
            lectureRootPath: path.join('test', 'assignments'),
            generateReadmeFiles: false
        });

        // Mock existing assignment folders and files
        mockFiles[path.join(projectRoot, 'Lecture2', 'Assignment2.1', 'assignment_file_1.ts')] = 'TODO';
        mockFiles[path.join(projectRoot, 'Lecture2', 'Assignment2.2', 'assignment_file_2.ts')] = 'TODO';
        mockFiles[path.join(projectRoot, 'Lecture2', 'Assignment2.3', 'assignment_file_3.ts')] = 'TODO';

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the lecture start number
        inputMock.mockImplementationOnce(() => Promise.resolve(2));
        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(4));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(4);

        // Expect to skip assignment_file_X.ts files 1-3
        for (let assignmentNumber = 1; assignmentNumber <= 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture2', `Assignment2.${assignmentNumber}`, `assignment_file_${assignmentNumber}.ts`)]).toEqual('TODO');
        }

        // Expect to generate assignment_file_4.ts
        expect(mockFiles[path.join(projectRoot, 'Lecture2', 'Assignment2.4', 'assignment_file_4.ts')]).toMatch(new RegExp('Assignment 2.4', 'gm'));
    });

    it('should generate folder structure and templates relative to README.md path', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: true,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            generateReadmeFiles: false
        });

        // Mock Lecture README.md
        mockFiles[path.join(projectRoot, 'relative', 'README.md')] =
            '## Assignment 3.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            '## Assignment 3.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            '## Assignment 3.3: Test assignment 3\n\n' +
            'Test description 3\n\n' +
            '## Assignment 3.4: Test assignment 4\n\n' +
            'Test description 4\n\n' +
            '## Assignment 3.5: Test assignment 5\n\n' +
            'Test description 5\n\n' +
            '## Assignment 3.6: Test assignment 6\n\n' +
            'Test description 6\n\n' +
            '## Assignment 3.7: Test assignment 7\n\n' +
            'Test description 7\n\n';

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the lecture README.md path
        inputMock.mockImplementationOnce(() => Promise.resolve(path.join(projectRoot, 'relative', 'README.md')));

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(4));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(7));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(4);
        expect(buutemplates.assignmentEnd).toBe(7);

        // Expect index.ts files be generated for assignments 3.4-3.7 in path /relative/Lecture3/Assignment03.0X/index.ts
        for (let assignmentNumber = 4; assignmentNumber <= 7; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture03', `Assignment3.0${assignmentNumber}`, 'index.ts')]).toMatch(new RegExp(`Assignment 3.${assignmentNumber}`, 'gm'));
        }
    });

    it('should remove extra linebreaks from assignment description comment blocks', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'index',
            generateReadmeFiles: false
        });

        // Mock Lecture README.md
        mockFiles[path.join(projectRoot, 'test6', 'README.md')] =
            '## Assignment 4.1: Test assignment 1\n\n' +
            'Test description 1\n\n\n\n\n\n' +
            '## Assignment 4.2: Test assignment 2\n\n' +
            'Test description 2\n\n\n\n' +
            '## Assignment 4.3: Test assignment 3\n\n' +
            'Test description 3\n\n\n\n\n\n';

        // Mock inquirer functions
        const inputMock = jest.fn();
        inquirer.input = inputMock;

        // Mock user input for the lecture README.md path
        inputMock.mockImplementationOnce(() => Promise.resolve(path.join(projectRoot, 'test6', 'README.md')));

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);

        // Expect that the empty lines have been removed from the end
        for (let assignmentNumber = 1; assignmentNumber <= 3; assignmentNumber++) {
            expect(mockFiles[path.join(projectRoot, 'Lecture4', `Assignment4.${assignmentNumber}`, 'index.ts')]).toEqual(`/**\n * ## Assignment 4.${assignmentNumber}: Test assignment ${assignmentNumber}\n * \n * Test description ${assignmentNumber}\n */\n`);
        }
    });

    it('should split lines that exceeds over 80 chars', async () => {
        // Mock .buutemplates.json configuration
        const projectRoot = process.cwd();

        // Mock Lecture README.md
        mockFiles[path.join(projectRoot, 'test7', 'README.md')] =
            '## Assignment 4.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\n' +
            'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n' +
            'Something\n\n\n' +
            '## Assignment 4.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\n' +
            'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n\n\n' +
            '## Assignment 4.3: Test assignment 3\n\n' +
            'Test description\n\n' +
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\n' +
            'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n\n\n\n';

        // Mock inquirer functions
        const inputMock = jest.fn();
        const confirmMock = jest.fn();
        const selectMock = jest.fn();
        inquirer.input = inputMock;
        inquirer.confirm = confirmMock;
        inquirer.select = selectMock;

        // Mock user selection for directory and file structure style
        selectMock.mockImplementationOnce(() => Promise.resolve('custom'));
        // Mock user input for lecture folder base name
        inputMock.mockImplementationOnce(() => Promise.resolve('Lecture'));
        // Mock user input for assignment file base name
        inputMock.mockImplementationOnce(() => Promise.resolve('index'));
        // Mock user input for the question 'Use padding?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(false));
        // Mock user input for the question 'Use max line length?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(true));
        // Mock user input for the question 'Set maximum length'
        inputMock.mockImplementationOnce(() => Promise.resolve('80'));
        // Mock user input for the question 'Save configuration?'
        confirmMock.mockImplementationOnce(() => Promise.resolve(true));

        // Mock user input for the lecture README.md path
        inputMock.mockImplementationOnce(() => Promise.resolve(path.join(projectRoot, 'test7', 'README.md')));

        // Mock user input for the assignment start number
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        // Mock user input for the assignment end number
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        // Run generation
        const buutemplates = new BuuTemplates();
        await buutemplates.setupAndGenerate();

        // Expect assignment start and end inputs be set
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);
        // Expect maxLineLength be 80
        expect(buutemplates.options.maxLineLength).toBe(80);

        // Expect each line length be 80 chars or less
        mockFiles[path.join(projectRoot, 'Lecture4', 'Assignment4.1', 'index.ts')].split('\n').forEach((line) => {
            expect(line.length).toBeLessThanOrEqual(80);
        });
        mockFiles[path.join(projectRoot, 'Lecture4', 'Assignment4.2', 'index.ts')].split('\n').forEach((line) => {
            expect(line.length).toBeLessThanOrEqual(80);
        });
        mockFiles[path.join(projectRoot, 'Lecture4', 'Assignment4.3', 'index.ts')].split('\n').forEach((line) => {
            expect(line.length).toBeLessThanOrEqual(80);
        });
    });
});
