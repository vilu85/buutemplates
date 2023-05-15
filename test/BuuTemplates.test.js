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
const mockFiles = {};

jest.mock('@inquirer/prompts');

describe('BuuTemplates', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock lecture 1 assignment README.md file
        mockFiles[path.join('test', 'assignments', 'Lecture1', 'README.md')] =
            '## Assignment 1.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            '## Assignment 1.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            '## Assignment 1.3: Test assignment 3\n\n' +
            'Test description\n\n' +
            '## Assignment 1.4: Test assignment 4\n\n' +
            'Test description 4\n\n';

        // Mock lecture 2 assignment README.md file
        mockFiles[path.join('test', 'assignments', 'Lecture2', 'README.md')] =
            '## Assignment 2.1: Test assignment 1\n\n' +
            'Test description 1\n\n' +
            '## Assignment 2.2: Test assignment 2\n\n' +
            'Test description 2\n\n' +
            '## Assignment 2.3: Test assignment 3\n\n' +
            'Test description\n\n' +
            '## Assignment 2.4: Test assignment 4\n\n' +
            'Test description 4\n\n' +
            '## Assignment 2.5: Test assignment 5\n\n' +
            'Test description 5\n\n' +
            '## Assignment 2.6: Test assignment 6\n\n' +
            'Test description 6\n\n' +
            '## Assignment 2.7: Test assignment 7\n\n' +
            'Test description 7\n\n';
    });

    afterEach(() => {});

    it('should create .buutemplates.json configuration file', async () => {
        // Mock inquirer functions
        const inputMock = jest.fn();
        const confirmMock = jest.fn();
        inquirer.input = inputMock;
        inquirer.confirm = confirmMock;

        // Mock user input for lecture folder base name
        inputMock.mockImplementationOnce(() => Promise.resolve('Lecture'));
        // Mock user input for assignment file base name
        inputMock.mockImplementationOnce(() => Promise.resolve('index'));
        // Mock user input for the question 'Use padding?'
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
        expect(confirmMock).toHaveBeenCalledTimes(2);
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

        // Expect index.ts files be generated for assignments 1.1-1.3 but not 1.4
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture1', 'Assignment1.1', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture1', 'Assignment1.2', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture1', 'Assignment1.3', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.not.objectContaining({
                [path.join(projectRoot, 'Lecture1', 'Assignment1.4', 'index.ts')]: expect.any(String),
            })
        );
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
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.4', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.5', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.6', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.7', 'index.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.not.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.3', 'index.ts')]: expect.any(String),
            })
        );
    });

    it('should create assignment templates by using tokens in name', async () => {
        // Mock .buutemplates.json configuration with lecture root path
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');
        mockFiles[configFile] = JSON.stringify({
            fileType: '.ts',
            padNumbers: false,
            folderBasename: 'Lecture',
            assignmentFileBasename: 'assignment%LECTURE%.%ASSIGNMENT%',
            lectureRootPath: path.join('test', 'assignments'),
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
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.1', 'assignment2.1.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.2', 'assignment2.2.ts')]: expect.any(String),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.3', 'assignment2.3.ts')]: expect.any(String),
            })
        );
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
            debug: true,
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

        // Expect to skip assignment_file_X.ts files 1-3 and write 2.4
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.1', 'assignment_file_1.ts')]:
                    expect.stringContaining('TODO'),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.2', 'assignment_file_2.ts')]:
                    expect.stringContaining('TODO'),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.3', 'assignment_file_3.ts')]:
                    expect.stringContaining('TODO'),
            })
        );
        expect(mockFiles).toEqual(
            expect.objectContaining({
                [path.join(projectRoot, 'Lecture2', 'Assignment2.4', 'assignment_file_4.ts')]:
                    expect.stringMatching(/Assignment 2\.4/gm),
            })
        );
    });
});
