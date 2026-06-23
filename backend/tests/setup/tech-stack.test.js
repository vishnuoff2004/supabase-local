const path = require('path');
const fs = require('fs');

describe('REQ-035 — Technology Stack (TEST-110)', () => {
  const backendPkgPath = path.join(__dirname, '../../package.json');
  let pkg;

  beforeAll(() => {
    pkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
  });

  test('should have Express ^4.x as dependency', () => {
    expect(pkg.dependencies.express).toMatch(/^\^4\./);
  });

  test('should have Sequelize ^6.x as dependency', () => {
    expect(pkg.dependencies.sequelize).toMatch(/^\^6\./);
  });

  test('should have pg as dependency', () => {
    expect(pkg.dependencies.pg).toBeDefined();
  });

  test('should have jsonwebtoken dependency', () => {
    expect(pkg.dependencies.jsonwebtoken || pkg.devDependencies.jsonwebtoken).toBeDefined();
  });

  test('should have bcryptjs as dependency', () => {
    expect(pkg.dependencies.bcryptjs).toBeDefined();
  });

  test('should have cors as dependency', () => {
    expect(pkg.dependencies.cors).toBeDefined();
  });

  test('should have dotenv as dependency', () => {
    expect(pkg.dependencies.dotenv).toBeDefined();
  });

  test('should have jest as devDependency', () => {
    expect(pkg.devDependencies.jest).toBeDefined();
  });

  test('should have supertest as devDependency', () => {
    expect(pkg.devDependencies.supertest).toBeDefined();
  });
});
