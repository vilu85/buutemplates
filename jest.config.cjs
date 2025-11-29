// jest.config.cjs
module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    // Allow babel-jest to transform the ESM package we depend on
    transformIgnorePatterns: ['/node_modules/(?!@inquirer/prompts)'],
    // Tell babel-jest to operate in ESM mode
    globals: {
        'babel-jest': {
            useESM: true,
        },
    },
};