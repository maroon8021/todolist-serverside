module.exports = {
  "roots": [
    "<rootDir>"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  "moduleNameMapper": {
    "^#/(.+)": "<rootDir>/src/$1"
  },
  "globals": {
    "ts-jest": {
      "tsConfig": "tsconfig.json"
    }
  },
  "testPathIgnorePatterns": [
    "node_modules"
  ]
}