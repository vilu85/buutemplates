// jest.config.cjs
module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    // Allow transforming all @inquirer packages (prompts, checkbox, core, etc.)
    transformIgnorePatterns: ['/node_modules/(?!@inquirer)'],
    // Tell babel-jest to operate in ESM mode
    globals: {
        'babel-jest': {
            useESM: true,
        },
    },
};
