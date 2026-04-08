export const EMAIL_MAX_LENGTH = 255

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email)
}
