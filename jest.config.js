module.exports = {
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "jsdom",
  // Fixes an error with `import { ... } from "lit"` in specs
  transformIgnorePatterns: ["/node_modules/(?!lit|@lit).+\\.js$"],
  // Fixes an error with `import ... from "bundle-text:..."` in specs
  moduleNameMapper: { "bundle-text:(.*)": "$1" },
  // Fixes an error with importing CSS and SVG files in specs
  transform: {
    "\\.[jt]sx?$": "babel-jest",
    ".+\\.(css|svg)$": "jest-transform-stub",
  },
};
