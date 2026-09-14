/**
 * Centralized currency utilities for RouteWise
 * Supports worldwide destinations with accurate symbols, codes, and typical default expense rates.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  formatted: string;
}

/**
 * Extracts a clean symbol from a currency string like "EUR (€)", "USD ($)", "JPY (¥)", "INR (₹)"
 */
export function getCurrencySymbol(currencyStr?: string): string {
  if (!currencyStr) return '₹';

  // Check if string contains parentheses symbol e.g. "EUR (€)" or "(¥)"
  const match = currencyStr.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  const clean = currencyStr.trim().toUpperCase();
  if (clean.includes('INR')) return '₹';
  if (clean.includes('EUR')) return '€';
  if (clean.includes('USD')) return '$';
  if (clean.includes('GBP')) return '£';
  if (clean.includes('JPY')) return '¥';
  if (clean.includes('CNY')) return '¥';
  if (clean.includes('KRW')) return '₩';
  if (clean.includes('THB')) return '฿';
  if (clean.includes('IDR')) return 'Rp';
  if (clean.includes('CHF')) return 'Fr';
  if (clean.includes('AED')) return 'AED';
  if (clean.includes('SGD')) return 'S$';
  if (clean.includes('AUD')) return 'A$';
  if (clean.includes('CAD')) return 'C$';

  return clean;
}

/**
 * Extracts the ISO 3-letter currency code (e.g. "EUR", "USD", "JPY", "INR")
 */
export function getCurrencyCode(currencyStr?: string): string {
  if (!currencyStr) return 'INR';
  const firstWord = currencyStr.trim().split(' ')[0].toUpperCase();
  if (/^[A-Z]{3}$/.test(firstWord)) {
    return firstWord;
  }
  if (currencyStr.includes('INR') || currencyStr.includes('₹')) return 'INR';
  if (currencyStr.includes('EUR') || currencyStr.includes('€')) return 'EUR';
  if (currencyStr.includes('USD') || currencyStr.includes('$')) return 'USD';
  if (currencyStr.includes('GBP') || currencyStr.includes('£')) return 'GBP';
  if (currencyStr.includes('JPY') || currencyStr.includes('¥')) return 'JPY';
  return firstWord || 'INR';
}

/**
 * Formats a numerical amount with the appropriate currency symbol
 */
export function formatCurrency(amount: number, currencyStr?: string): string {
  const symbol = getCurrencySymbol(currencyStr);
  const num = Math.round(amount);
  return `${symbol} ${num.toLocaleString()}`;
}

/**
 * Provides reasonable cost defaults for different currency tiers
 * (e.g. 100 JPY is ~$0.65, so a hotel is ~12,000 JPY, whereas in USD it is ~$120)
 */
export function getDefaultCurrencyRates(currencyStr?: string) {
  const code = getCurrencyCode(currencyStr);

  switch (code) {
    case 'JPY':
    case 'KRW':
      return {
        defaultBudget: 180000,
        hotelPerNight: 14000,
        transitPerPerson: 4000,
        foodPerPersonDay: 4500,
        miscBudget: 15000,
      };
    case 'IDR':
    case 'VND':
      return {
        defaultBudget: 15000000,
        hotelPerNight: 750000,
        transitPerPerson: 350000,
        foodPerPersonDay: 250000,
        miscBudget: 800000,
      };
    case 'INR':
    case 'NPR':
    case 'LKR':
    case 'BDT':
      return {
        defaultBudget: 25000,
        hotelPerNight: 3200,
        transitPerPerson: 1800,
        foodPerPersonDay: 800,
        miscBudget: 2500,
      };
    case 'EUR':
    case 'USD':
    case 'GBP':
    case 'CHF':
    case 'AUD':
    case 'CAD':
    case 'SGD':
    default:
      return {
        defaultBudget: 1800,
        hotelPerNight: 130,
        transitPerPerson: 85,
        foodPerPersonDay: 45,
        miscBudget: 150,
      };
  }
}
