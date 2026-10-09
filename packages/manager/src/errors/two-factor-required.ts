export class TwoFactorRequiredError extends Error {
  constructor() {
    super('Two-factor code required')
  }
}
