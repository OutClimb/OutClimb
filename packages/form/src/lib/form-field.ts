export type FieldValue = string | Array<string> | boolean

interface FieldMetadata {
  options: Array<string>
  placeholder?: string
}

export const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  'given-name': 'e.g. Emily',
  'family-name': 'e.g. Oak',
  email: 'e.g. me@emi.ly',
  phone: 'e.g. 763-867-5309',
}

export const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

export function parseMetadata(metadata: string | null): FieldMetadata {
  if (!metadata) return { options: [] }
  try {
    const meta = JSON.parse(metadata)
    return {
      options: Array.isArray(meta?.options) ? (meta.options as Array<string>) : [],
      placeholder: typeof meta?.placeholder === 'string' ? meta.placeholder : undefined,
    }
  } catch {
    return { options: [] }
  }
}

export function initialValue(type: string): FieldValue {
  if (type === 'bool' || type === 'newsletter') return false
  if (type === 'checkboxes') return []
  return ''
}
