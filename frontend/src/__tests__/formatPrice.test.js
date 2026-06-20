import { formatPrice } from '../utils/formatPrice';

describe('formatPrice — TEST-026: Fare displayed in correct format', () => {
  test('formats standard fare with INR symbol and 2 decimal places', () => {
    expect(formatPrice(250.5)).toBe('₹250.50');
    expect(formatPrice(250)).toBe('₹250.00');
    expect(formatPrice(499.99)).toBe('₹499.99');
  });

  test('formats large fare with thousand separators', () => {
    expect(formatPrice(1000000)).toBe('₹10,00,000.00');
    expect(formatPrice(10000)).toBe('₹10,000.00');
  });

  test('formats zero fare as ₹0.00', () => {
    expect(formatPrice(0)).toBe('₹0.00');
    expect(formatPrice(0.0)).toBe('₹0.00');
  });

  test('rounds decimal values correctly', () => {
    expect(formatPrice(100.256)).toBe('₹100.26');
    expect(formatPrice(100.254)).toBe('₹100.25');
    expect(formatPrice(99.999)).toBe('₹100.00');
  });

  test('handles string input', () => {
    expect(formatPrice('250.5')).toBe('₹250.50');
    expect(formatPrice('500')).toBe('₹500.00');
  });

  test('handles null/undefined/NaN gracefully', () => {
    expect(formatPrice(null)).toBe('₹0.00');
    expect(formatPrice(undefined)).toBe('₹0.00');
    expect(formatPrice(NaN)).toBe('₹0.00');
  });

  test('negative fare returns ₹0.00 as fallback', () => {
    expect(formatPrice(-50)).toBe('₹0.00');
    expect(formatPrice(-250.5)).toBe('₹0.00');
  });
});
