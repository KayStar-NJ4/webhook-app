// Jest setup file
// Thiết lập timeout cho tests
jest.setTimeout(10000)

// Mock console để tránh spam trong test output
global.console = {
  ...console,
  // Uncomment để disable console.log trong tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}
