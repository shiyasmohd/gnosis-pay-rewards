import numeral from 'numeral';

/**
 * Format a number to a human readable string
 * @param number the number to format
 * @param usd whether to format as USD
 * @returns
 */
export function formatNumber(number: number, usd = false): string {
  // Always convert to number
  number = Number(number);

  if (isNaN(number as any) || number === 0) {
    if (usd) {
      return numeral(number).format(usd ? '$0a' : '0a');
    }

    return (0).toFixed();
  }

  if (number < 1000) {
    const n = number.toFixed(2);

    return numeral(n).format(usd ? '$0a' : '0a');
  }

  return numeral(number).format(usd ? '$0.00a' : '0.00a');
}
