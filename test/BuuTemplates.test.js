const inquirer = require('@inquirer/prompts');
import { BuuTemplates } from '../buutemplates.js';

// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const path = require('path');

jest.mock('fs', () => {
    return {
        readFileSync: jest.fn().mockImplementation((file, encoding) => {
            const buf = Buffer.from(mockFiles[file], 'utf8');
            return buf;
        }),
        readFile: jest.fn().mockImplementation((path, cb = (err, buf) => {}) => {
            if(mockFiles[path]) {
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
            return Object.keys(mockFiles).findIndex( (value) => path === value );
        }),
        mkdirSync: jest.fn().mockImplementation((path, opts = {}) => {
            mockFiles[path] = '';
        }),
        readdir: jest.fn().mockImplementation((path = "", cb) => {
            const files = Object.keys(mockFiles).filter( value => {
                if(path === value) {
                    return true;
                } else if(path.startsWith(value)) {
                    return true;
                } else {
                    return false;
                }
            });
            cb(false, files);
        })
    };
});

// Mocked files during testing
const mockFiles = {};

jest.mock('@inquirer/prompts');

describe('BuuTemplates', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock assignment README.md file
        mockFiles[path.join('test', 'assignments', 'Lecture1', 'README.md')] = '## Assignment 1.1: Test assignment 1\n\n' +
        'Test description 1\n\n' +
        '## Assignment 1.2: Test assignment 2\n\n' +
        'Test description 2\n\n' +
        '## Assignment 1.3: Test assignment 3\n\n' +
        'Test description\n\n' +
        '## Assignment 1.4: Test assignment 4\n\n' +
        'Test description 4\n\n';
    });

    afterEach(() => {});

    it('should create .buutemplates.json configuration file', async () => {
        const projectRoot = process.cwd();
        const configFile = path.join(projectRoot, '.buutemplates.json');

        // Setup readme file mock path
        const readmeMockPath = path.join('test', 'assignments', 'Lecture1', 'README.md');
        mockFiles[configFile] = JSON.stringify({

        });

        const inputMock = jest.fn();
        const confirmMock = jest.fn();

        // Mock inquirer functions
        inquirer.input = inputMock;
        inquirer.confirm = confirmMock;

        inputMock.mockImplementationOnce(() => Promise.resolve(readmeMockPath));
        confirmMock.mockImplementationOnce(() => Promise.resolve(true));
        inputMock.mockImplementationOnce(() => Promise.resolve(1));
        inputMock.mockImplementationOnce(() => Promise.resolve(3));

        const buutemplates = new BuuTemplates();
        await buutemplates.setup();

        // Expect the function to behave as expected with the provided input
        expect(buutemplates.options.readmePath).toBe(readmeMockPath);
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(3);
        expect(confirmMock).toHaveBeenCalledTimes(1);
        expect(inputMock).toHaveBeenCalledTimes(3);
        expect(mockFiles[configFile]).toBeDefined();
    });
});
