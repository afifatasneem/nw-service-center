/**
 * Secure password hashing using Web Crypto API (PBKDF2 / SHA-256)
 * No plain-text passwords stored in the database.
 */

// Generate a random salt string
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password with salt using SHA-256
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + '::NW_SERVICE::' + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against stored hash and salt
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}
