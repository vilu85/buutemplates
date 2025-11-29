import { jest } from '@jest/globals';

// mock @inquirer/prompts BEFORE it's imported by buutemplates.js
await jest.unstable_mockModule('@inquirer/prompts', () => ({
  input: jest.fn(),
  confirm: jest.fn(),
  select: jest.fn(),
}));

const inquirer = await import('@inquirer/prompts');
const { BuuTemplates } = await import('../buutemplates.js');

import path from 'path';

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

// Note: we registered an ESM mock with jest.unstable_mockModule above and imported it. Do not call jest.mock('@inquirer/prompts') here.

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

    // rest of tests unchanged...

