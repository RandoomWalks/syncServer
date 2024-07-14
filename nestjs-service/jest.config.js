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
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.spec.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    moduleDirectories: ['node_modules', 'src'],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
    }
  };
  


// module.exports = {
//     preset: 'ts-jest',
//     testEnvironment: 'node',
//     roots: ['<rootDir>/src/prac/dependency_injection/minimal_runnable_example/scratch/nest_integrate_go/nestjs-service'],
//     moduleNameMapper: {
//       '^@/(.*)$': '<rootDir>/src/$1',
//     },
//     moduleDirectories: ['node_modules', 'src'],
//     transform: {
//       '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
//     }
//   };
  