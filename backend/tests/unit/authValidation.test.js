const { validateRegister, validateLogin } = require('../../src/validations/authValidation');

describe('TEST-001, TEST-003, TEST-004, TEST-087, TEST-088, TEST-089, TEST-090 — Auth Validation', () => {
  describe('validateRegister', () => {
    test('should pass with valid data', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password1',
        phone: '+911234567890',
      });
      expect(result.error).toBeUndefined();
    });

    test('TEST-087: should fail when name is missing', () => {
      const result = validateRegister({
        email: 'john@example.com',
        password: 'Password1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toMatch(/name/i);
    });

    test('TEST-087: should fail when email is missing', () => {
      const result = validateRegister({
        name: 'John Doe',
        password: 'Password1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toMatch(/email/i);
    });

    test('TEST-088: should fail with invalid email format', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'notanemail',
        password: 'Password1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
    });

    test('TEST-089: should fail when password is fewer than 8 characters', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Ab1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
    });

    test('TEST-089: should fail when password has no uppercase letter', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
    });

    test('TEST-089: should fail when password has no lowercase letter', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PASSWORD1',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
    });

    test('TEST-089: should fail when password has no digit', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password',
        phone: '+911234567890',
      });
      expect(result.error).toBeDefined();
    });

    test('TEST-090: should fail when phone number is less than 10 digits', () => {
      const result = validateRegister({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password1',
        phone: '12345',
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('validateLogin', () => {
    test('should pass with valid login data', () => {
      const result = validateLogin({
        email: 'john@example.com',
        password: 'Password1',
      });
      expect(result.error).toBeUndefined();
    });

    test('TEST-087: should fail when email is missing', () => {
      const result = validateLogin({ password: 'Password1' });
      expect(result.error).toBeDefined();
    });

    test('TEST-087: should fail when password is missing', () => {
      const result = validateLogin({ email: 'john@example.com' });
      expect(result.error).toBeDefined();
    });
  });
});
