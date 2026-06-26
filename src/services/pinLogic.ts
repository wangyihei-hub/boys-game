/**
 * Validates a parent PIN format.
 * A valid PIN contains 4 to 6 digits only.
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
