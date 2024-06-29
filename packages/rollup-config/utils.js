import { existsSync } from 'fs';
import { isAbsolute } from 'path';

/**
 *  Check if the path is valid
 * @param {string} str
 * @returns {boolean}
 */
export function isValidPath(str) {
  // Check if the string is an absolute path
  const isAbs = isAbsolute(str);
  if (!isAbs) {
    return false;
  }

  // Check if the path exists in the file system
  return existsSync(str);
}
