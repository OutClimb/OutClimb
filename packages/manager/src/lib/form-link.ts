export function getPublicFormLink(slug: string): string {
  if (import.meta.env.MODE === 'dev') {
    return `http://register.outclimb.local/form/${slug}`
  } else {
    return `https://register.outclimb.gay/form/${slug}`
  }
}
