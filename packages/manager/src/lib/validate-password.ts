export function validatePassword(password: string, username: string): string | null {
  if (!password) {
    return 'Please fill in this field'
  }

  if (password.length < 16) {
    return 'Password must be at least 16 characters long'
  }

  if (password.length > 72) {
    return 'Password must be at most 72 characters long'
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'Password must contain at least one special character'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }

  if (username && password.includes(username)) {
    return 'Password must not contain the username'
  }

  return null
}
