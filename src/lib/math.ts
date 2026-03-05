/**
 * Utility for high-precision financial calculations.
 * Avoids floating point errors by working with scaled integers.
 */

export const PRECISION = 100; // Work with 2 decimal places (cents/paise)

/**
 * Converts a number to a scaled integer to avoid floating point issues.
 */
export const toScaled = (num: number): number => {
  return Math.round(num * PRECISION);
};

/**
 * Converts a scaled integer back to a normal number.
 */
export const fromScaled = (scaled: number): number => {
  return scaled / PRECISION;
};

/**
 * Sums an array of numbers with high precision.
 */
export const sum = (numbers: number[]): number => {
  const scaledSum = numbers.reduce((acc, num) => acc + toScaled(num), 0);
  return fromScaled(scaledSum);
};

/**
 * Calculates percentage with high precision.
 * Returns a number between 0 and 100.
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  // Use higher precision for internal calculation
  const scaledValue = toScaled(value);
  const scaledTotal = toScaled(total);
  return (scaledValue / scaledTotal) * 100;
};

/**
 * Formats a number as currency with high precision.
 */
export const formatCurrency = (amount: number, currency: string = '₹', locale: string = 'en-IN'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === '₹' ? 'INR' : 'USD', // Fallback mapping
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('INR', '₹').replace('USD', '$');
};

/**
 * Formats a number for display without the currency symbol, but with proper decimal handling.
 */
export const formatNumber = (amount: number, locale: string = 'en-IN', fractionDigits: number = 2): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};
