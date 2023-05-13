const inquirer = require('@inquirer/prompts');
import { BuuTemplates } from '../buutemplates.js';

// eslint-disable-next-line no-unused-vars
const fs = require('fs');
const path = require('path');

jest.mock('fs', () => {
    return {
        readFileSync: jest.fn().mockImplementation((file, encoding) => {
            const buf = Buffer(mockFiles[file], 'utf8');
            return buf;
        }),
        readFile: jest.fn().mockImplementation((path, cb = (err, buf) => {}) => {
            const buf = Buffer(mockFiles[path], 'utf8');
            cb(false, buf);
        }),
        writeFile: jest.fn().mockImplementation((file, data, cb) => {
            mockFiles[file] = data;
            cb(null);
        }),
        writeFileSync: jest.fn().mockImplementation((file, data, cb) => {
            mockFiles[file] = data;
            cb(null);
        }),
        statSync: jest.fn().mockImplementation((path) => {
            if (mockFiles[path]) {
                return { size: 1 };
            } else {
                return false;
            }
        }),
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

    it('should create assignment templates', async () => {
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
        inputMock.mockImplementationOnce(() => Promise.resolve(2));
        inputMock.mockImplementationOnce(() => Promise.resolve(false));

        const buutemplates = new BuuTemplates();
        await buutemplates.setup();

        // Expect the function to behave as expected with the provided input
        expect(buutemplates.options.readmePath).toBe(readmeMockPath);
        expect(buutemplates.assignmentStart).toBe(1);
        expect(buutemplates.assignmentEnd).toBe(2);
        expect(inputMock).toHaveBeenCalledTimes(4);
    });
});
