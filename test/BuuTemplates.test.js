import { BuuTemplates } from '../buutemplates.js';
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const join = path.join;
const writeFile = promisify(fs.writeFile);

const readFileSync = jest.fn().mockImplementation((file, encoding) => {
	return mockFiles[file];
});

const mockFiles = {
    'README.md':
        '## Assignment 1.1: Test assignment 1\n\n' +
        'Test description 1\n\n' +
        '## Assignment 1.2: Test assignment 2\n\n' +
        'Test description 2\n\n' +
        '## Assignment 1.3: Test assignment 3\n\n' +
        'Test description\n\n' +
        '## Assignment 1.4: Test assignment 4\n\n' +
        'Test description 4\n\n',
};

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
            mockFiles[file] = JSON.parse(data);
            cb(null);
        }),
        writeFileSync: jest.fn().mockImplementation((file, data, cb) => {
            mockFiles[file] = JSON.parse(data);
            cb(null);
        }),
        statSync: jest.fn().mockImplementation((path) => {
            if (mockFiles[path]) {
                return 1;
            } else {
                return 0;
            }
        }),
    };
});

jest.mock('@inquirer/prompts');

// jest.mock('@inquirer/prompts', () => ({
//     input: jest.fn().mockResolvedValueOnce({ path: '/example/path' })
// }));

describe('BuuTemplates', () => {
    // let buuTemplates;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {});

    it('should create assignment templates', async () => {
        jest.spyOn(process, 'cwd').mockReturnValue('/path/to/project');
        jest.spyOn(console, 'log').mockImplementation(() => {});

        input.mockResolvedValueOnce({ projectPath: '/path/to/project' });

        const bt = new BuuTemplates();
        await bt.init();

        expect(input).toHaveBeenCalledTimes(1);
        expect(input).toHaveBeenCalledWith(
        expect.objectContaining({
            message: 'Please enter the path to your project root directory',
        })
        );
        const buuTemplates = new BuuTemplates();
        expect(buuTemplates.options).toEqual(/* expected options */);

        const file = join(__dirname, 'package.json');
        const content = await readFileSync(file, 'utf8');

        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(content).toBe('1.0.1');
    });
});
