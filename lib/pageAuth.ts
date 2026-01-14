/**
 * Simple page-level password protection
 * For pages that need a password gate but not full admin auth
 */

// Page passwords - add new protected pages here
const PAGE_PASSWORDS: Record<string, string> = {
  'wewillwin': 'govfishback'
};

/**
 * Verify a password for a specific page
 */
export function verifyPagePassword(page: string, password: string): boolean {
  const correctPassword = PAGE_PASSWORDS[page];
  if (!correctPassword) return false;
  return password === correctPassword;
}

/**
 * Check if a page requires password protection
 */
export function isProtectedPage(page: string): boolean {
  return page in PAGE_PASSWORDS;
}
