// module.exports = {
//     moduleFileExtensions: ['js', 'json', 'ts'],
//     rootDir: 'src',
//     testRegex: '.*\\spec\\.ts$',
//     transform: {
//         '^.+\\.(t|j)s$': 'ts-jest',
//     },
//     collectCoverageFrom: [
//         '**/*.(t|j)s',
//     ],
//     coverageDirectory: '../coverage',
//     testEnvironment: 'node',
// };

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    moduleDirectories: ['node_modules', 'src'],

    transform: {
        "^.+\\.tsx?$": ["ts-jest", { "tsconfig": "tsconfig.json" }]
    }

};