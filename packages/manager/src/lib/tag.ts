export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ')
}

export function addTag(tags: Array<string>, candidate: string): Array<string> {
  const tag = normalizeTag(candidate)
  const isDuplicate = tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())
  return tag === '' || isDuplicate ? tags : [...tags, tag]
}

export function removeTag(tags: Array<string>, tagToRemove: string): Array<string> {
  return tags.filter((tag) => tag !== tagToRemove)
}
