import { Input } from '@/components/ui/input'
import { addTag, removeTag } from '@/lib/tag'
import { XIcon } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'

const TAG_SEPARATOR_KEYS = ['Enter', ',']

interface TagInputProps {
  id: string
  tags: Array<string>
  suggestions: Array<string>
  onChange: (tags: Array<string>) => void
  disabled?: boolean
}

export function TagInput({ id, tags, suggestions, onChange, disabled }: TagInputProps) {
  const suggestionListId = useId()
  const [draft, setDraft] = useState('')

  const unusedSuggestions = useMemo(() => {
    const usedTags = new Set(tags.map((tag) => tag.toLowerCase()))
    return suggestions.filter((suggestion) => !usedTags.has(suggestion.toLowerCase()))
  }, [tags, suggestions])

  const commitDraft = useCallback(() => {
    onChange(addTag(tags, draft))
    setDraft('')
  }, [tags, draft, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (TAG_SEPARATOR_KEYS.includes(e.key)) {
        e.preventDefault()
        commitDraft()
      } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
        onChange(tags.slice(0, -1))
      }
    },
    [commitDraft, draft, tags, onChange],
  )

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2.5 text-sm text-secondary-foreground">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(removeTag(tags, tag))}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-foreground/10 disabled:pointer-events-none">
                <XIcon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        type="text"
        list={suggestionListId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder="Type a tag and press Enter"
        disabled={disabled}
      />
      <datalist id={suggestionListId}>
        {unusedSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  )
}
