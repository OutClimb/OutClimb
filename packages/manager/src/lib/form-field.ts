export const CONTENT_FIELD_TYPES = new Set(['subheader', 'divider', 'paragraph'])

export function isContentField(type: string): boolean {
  return CONTENT_FIELD_TYPES.has(type)
}
