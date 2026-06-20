export function formatPrice(value) {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return '₹0.00';
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num < 0) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default formatPrice;
